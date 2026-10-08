import { and, eq, sql, desc, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { auth, trustedOrigins } from "./auth";
import {
  user,
  session,
  childProfiles,
  toolStates,
  userEntitlements,
  auditLogs,
  syncEvents,
} from "./schema";
import {
  profileInput,
  stateInput,
  toolKeys,
  requiresParent,
  canOperate,
} from "./policy";
import { hasVerifiedEmail } from "./auth-policy";
import { validatePayload } from "./payload";
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export async function jsonBody(request: Request) {
  if (
    !(request.headers.get("content-type") || "").startsWith("application/json")
  )
    throw new HttpError(415, "JSON_REQUIRED", "请使用 JSON 请求。");
  if (Number(request.headers.get("content-length")) > 1048576)
    throw new HttpError(
      413,
      "PAYLOAD_TOO_LARGE",
      "记录超过 1 MB，请先导出并整理。",
    );
  const reader = request.body?.getReader();
  let bytes = 0,
    text = "";
  const decoder = new TextDecoder();
  if (!reader) throw new HttpError(400, "INVALID_BODY", "请求内容为空。");
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 1048576) {
      await reader.cancel();
      throw new HttpError(413, "PAYLOAD_TOO_LARGE", "记录超过 1 MB。");
    }
    text += decoder.decode(value, { stream: true });
  }
  try {
    return JSON.parse(text + decoder.decode());
  } catch {
    throw new HttpError(400, "INVALID_JSON", "请求内容不是有效 JSON。");
  }
}
async function context(request: Request) {
  const value = await auth.api.getSession({ headers: request.headers });
  if (!value) throw new HttpError(401, "AUTH_REQUIRED", "请先登录。");
  const [owner] = await db
    .select()
    .from(user)
    .where(eq(user.id, value.user.id));
  const [current] = await db
    .select()
    .from(session)
    .where(
      and(eq(session.id, value.session.id), eq(session.userId, value.user.id)),
    );
  if (!owner || owner.disabled || !current || current.expiresAt <= new Date())
    throw new HttpError(401, "SESSION_EXPIRED", "登录已失效，请重新登录。");
  return { owner, current };
}
type Context = Awaited<ReturnType<typeof context>>;
function parent(ctx: Context) {
  if (
    !ctx.current.parentUnlockedUntil ||
    ctx.current.parentUnlockedUntil <= new Date()
  )
    throw new HttpError(403, "PARENT_UNLOCK_REQUIRED", "请先验证家长密码。");
}
async function owned(ctx: Context, id: string) {
  const [profile] = await db
    .select()
    .from(childProfiles)
    .where(
      and(eq(childProfiles.id, id), eq(childProfiles.userId, ctx.owner.id)),
    );
  if (!profile)
    throw new HttpError(404, "PROFILE_NOT_FOUND", "未找到孩子档案。");
  return profile;
}
async function permission(ctx: Context, tool: string, operation: string) {
  const grants = await db
    .select()
    .from(userEntitlements)
    .where(eq(userEntitlements.userId, ctx.owner.id));
  if (!canOperate(grants, tool, operation))
    throw new HttpError(403, "OPERATION_DENIED", "账号没有这项操作权限。");
}
function audit(
  actorId: string,
  action: string,
  targetId: string,
  detail: unknown = null,
) {
  return db
    .insert(auditLogs)
    .values({ id: crypto.randomUUID(), actorId, action, targetId, detail });
}
async function throttle(userId: string, route: string) {
  const key = "api:" + userId + ":" + route;
  const result = await db.execute(
    sql`INSERT INTO rate_limits (id,key,count,last_request) VALUES (${crypto.randomUUID()},${key},1,${Date.now()}) ON CONFLICT (key) DO UPDATE SET count = CASE WHEN rate_limits.last_request < ${Date.now() - 60000} THEN 1 ELSE rate_limits.count+1 END, last_request=CASE WHEN rate_limits.last_request < ${Date.now() - 60000} THEN ${Date.now()} ELSE rate_limits.last_request END RETURNING count`,
  );
  const limit = route === "parent-unlock" ? 5 : 180;
  if (Number(result.rows[0]?.count) > limit)
    throw new HttpError(429, "RATE_LIMITED", "操作太频繁，请一分钟后重试。");
}
export async function dispatch(request: Request, parts: string[]) {
  const method = request.method,
    route = parts.join("/");
  const origin = request.headers.get("origin");
  if (origin && !trustedOrigins.includes(origin))
    throw new HttpError(403, "ORIGIN_DENIED", "请求来源未被允许。");
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && !origin)
    throw new HttpError(403, "ORIGIN_REQUIRED", "缺少请求来源。");
  if (route === "health" && method === "GET") {
    await db.execute(sql`SELECT 1`);
    return { ok: true };
  }
  const ctx = await context(request);
  await throttle(ctx.owner.id, parts[0] || "");
  if (route === "session" && method === "GET")
    return {
      user: {
        id: ctx.owner.id,
        email: ctx.owner.email,
        name: ctx.owner.name,
        role: ctx.owner.role,
        emailVerified: ctx.owner.emailVerified,
      },
      activeProfileId: ctx.current.activeProfileId,
      parentUnlockedUntil: ctx.current.parentUnlockedUntil,
    };
  if (route === "parent-unlock" && method === "POST") {
    const body = z
      .object({ password: z.string().min(1).max(128) })
      .strict()
      .parse(await jsonBody(request));
    await auth.api.verifyPassword({ headers: request.headers, body });
    const until = new Date(Date.now() + 15 * 60000);
    await db
      .update(session)
      .set({ parentUnlockedUntil: until })
      .where(eq(session.id, ctx.current.id));
    await audit(ctx.owner.id, "parent.unlock", ctx.current.id);
    return { parentUnlockedUntil: until };
  }
  if (route === "parent-lock" && method === "POST") {
    await db
      .update(session)
      .set({ parentUnlockedUntil: null })
      .where(eq(session.id, ctx.current.id));
    return { ok: true };
  }
  if (route === "account" && method === "PATCH") {
    parent(ctx);
    const body = z
      .object({ name: z.string().trim().min(1).max(40) })
      .strict()
      .parse(await jsonBody(request));
    await db
      .update(user)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(user.id, ctx.owner.id));
    return { ok: true };
  }
  if (route === "logout-all" && method === "POST") {
    parent(ctx);
    await db.delete(session).where(eq(session.userId, ctx.owner.id));
    return { ok: true };
  }
  if (route === "profiles") {
    if (method === "GET")
      return {
        profiles: await db
          .select({
            id: childProfiles.id,
            nickname: childProfiles.nickname,
            grade: childProfiles.grade,
          })
          .from(childProfiles)
          .where(eq(childProfiles.userId, ctx.owner.id)),
        activeProfileId: ctx.current.activeProfileId,
      };
    if (method === "POST") {
      parent(ctx);
      await permission(ctx, "*", "profile.create");
      const body = profileInput.parse(await jsonBody(request));
      const [profile] = await db
        .insert(childProfiles)
        .values({ ...body, id: crypto.randomUUID(), userId: ctx.owner.id })
        .returning();
      await db
        .update(session)
        .set({ activeProfileId: profile.id })
        .where(eq(session.id, ctx.current.id));
      await audit(ctx.owner.id, "profile.create", profile.id);
      return profile;
    }
  }
  if (route === "active-profile" && method === "POST") {
    const body = z
      .object({ profileId: z.string().min(1).max(100) })
      .strict()
      .parse(await jsonBody(request));
    await owned(ctx, body.profileId);
    await db
      .update(session)
      .set({ activeProfileId: body.profileId })
      .where(eq(session.id, ctx.current.id));
    return { activeProfileId: body.profileId };
  }
  if (parts[0] === "profiles" && parts[1]) {
    const profile = await owned(ctx, parts[1]);
    if (parts.length === 2 && method === "PATCH") {
      parent(ctx);
      await permission(ctx, "*", "profile.edit");
      const body = profileInput.parse(await jsonBody(request));
      const [updated] = await db
        .update(childProfiles)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(childProfiles.id, profile.id))
        .returning();
      await audit(ctx.owner.id, "profile.edit", profile.id);
      return updated;
    }
    if (parts.length === 2 && method === "DELETE") {
      parent(ctx);
      await permission(ctx, "*", "profile.delete");
      const body = z
        .object({ confirmNickname: z.string() })
        .strict()
        .parse(await jsonBody(request));
      if (body.confirmNickname !== profile.nickname)
        throw new HttpError(
          400,
          "CONFIRM_REQUIRED",
          "请正确输入孩子昵称确认删除。",
        );
      await db.transaction(async (tx) => {
        await tx.delete(childProfiles).where(eq(childProfiles.id, profile.id));
        await tx
          .update(session)
          .set({ activeProfileId: null })
          .where(eq(session.activeProfileId, profile.id));
        await tx.insert(auditLogs).values({
          id: crypto.randomUUID(),
          actorId: ctx.owner.id,
          action: "profile.delete",
          targetId: profile.id,
        });
      });
      return { ok: true };
    }
    if (parts[2] === "state" && parts.length === 4) {
      const tool = z.enum(toolKeys).parse(parts[3]);
      await permission(
        ctx,
        tool,
        method === "GET" ? "state.read" : "state.write",
      );
      const condition = and(
        eq(toolStates.profileId, profile.id),
        eq(toolStates.toolKey, tool),
      );
      if (method === "GET") {
        const [state] = await db.select().from(toolStates).where(condition);
        return state
          ? {
              revision: state.revision,
              schemaVersion: state.schemaVersion,
              payload: state.payload,
            }
          : { revision: 0, schemaVersion: 1, payload: null };
      }
      if (method === "PUT") {
        const body = stateInput.parse(await jsonBody(request));
        validatePayload(tool, body.payload);
        let saved;
        try {
          saved = await db.transaction(async (tx) => {
            // Lock the profile, including the first write; this also serializes deletion and concurrent imports.
            const locked = await tx.execute(
              sql`SELECT id FROM child_profiles WHERE id=${profile.id} AND user_id=${ctx.owner.id} FOR UPDATE`,
            );
            if (!locked.rows.length)
              throw new HttpError(404, "PROFILE_NOT_FOUND", "未找到孩子档案。");
            const [current] = await tx
              .select()
              .from(toolStates)
              .where(condition);
            if ((current?.revision ?? 0) !== body.revision)
              throw new HttpError(
                409,
                "REVISION_CONFLICT",
                "云端记录已变化，请导出本机记录并重新选择。",
              );
            if (requiresParent(tool, current?.payload, body.payload))
              parent(ctx);
            const values = {
              schemaVersion: body.schemaVersion,
              payload: body.payload,
              revision: body.revision + 1,
              updatedAt: new Date(),
            };
            const [state] = current
              ? await tx
                  .update(toolStates)
                  .set(values)
                  .where(and(condition, eq(toolStates.revision, body.revision)))
                  .returning()
              : await tx
                  .insert(toolStates)
                  .values({
                    ...values,
                    id: crypto.randomUUID(),
                    profileId: profile.id,
                    toolKey: tool,
                  })
                  .returning();
            await tx.insert(syncEvents).values({
              id: crypto.randomUUID(),
              userId: ctx.owner.id,
              toolKey: tool,
              success: true,
              code: "OK",
            });
            return state;
          });
        } catch (error) {
          await db.insert(syncEvents).values({
            id: crypto.randomUUID(),
            userId: ctx.owner.id,
            toolKey: tool,
            success: false,
            code: error instanceof HttpError ? error.code : "FAILED",
          });
          throw error;
        }
        return {
          revision: saved.revision,
          schemaVersion: saved.schemaVersion,
          payload: saved.payload,
        };
      }
    }
  }
  if (
    parts[0] === "profiles" &&
    parts[1] &&
    parts[2] === "import" &&
    parts.length === 3 &&
    method === "POST"
  ) {
    parent(ctx);
    const profile = await owned(ctx, parts[1]);
    const body = z
      .object({
        confirmNickname: z.string(),
        states: z
          .array(stateInput.extend({ toolKey: z.enum(toolKeys) }))
          .max(3),
      })
      .strict()
      .parse(await jsonBody(request));
    if (body.confirmNickname !== profile.nickname)
      throw new HttpError(400, "CONFIRM_REQUIRED", "请确认目标孩子昵称。");
    if (new Set(body.states.map((s) => s.toolKey)).size !== body.states.length)
      throw new HttpError(400, "DUPLICATE_TOOL", "每个工具只能导入一次。");
    for (const state of body.states) {
      validatePayload(state.toolKey, state.payload);
      await permission(ctx, state.toolKey, "state.write");
    }
    const result = await db.transaction(async (tx) => {
      const locked = await tx.execute(
        sql`SELECT id FROM child_profiles WHERE id=${profile.id} AND user_id=${ctx.owner.id} FOR UPDATE`,
      );
      if (!locked.rows.length)
        throw new HttpError(404, "PROFILE_NOT_FOUND", "未找到孩子档案。");
      if (!locked.rows.length)
        throw new HttpError(404, "PROFILE_NOT_FOUND", "未找到孩子档案。");
      const states = [];
      for (const state of body.states) {
        const where = and(
          eq(toolStates.profileId, profile.id),
          eq(toolStates.toolKey, state.toolKey),
        );
        const [old] = await tx.select().from(toolStates).where(where);
        if ((old?.revision ?? 0) !== state.revision)
          throw new HttpError(
            409,
            "REVISION_CONFLICT",
            "云端记录已更新，请重新导出并选择。",
          );
        const values = {
          payload: state.payload,
          schemaVersion: state.schemaVersion,
          revision: state.revision + 1,
          updatedAt: new Date(),
        };
        const [saved] = old
          ? await tx.update(toolStates).set(values).where(where).returning()
          : await tx
              .insert(toolStates)
              .values({
                ...values,
                id: crypto.randomUUID(),
                profileId: profile.id,
                toolKey: state.toolKey,
              })
              .returning();
        states.push({ toolKey: saved.toolKey, revision: saved.revision });
      }
      await tx.insert(auditLogs).values({
        id: crypto.randomUUID(),
        actorId: ctx.owner.id,
        action: "data.import",
        targetId: profile.id,
        detail: { tools: body.states.map((s) => s.toolKey) },
      });
      return states;
    });
    return { ok: true, states: result };
  }

  if (route === "export" && method === "GET") {
    await permission(ctx, "*", "data.export");
    const profiles = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.userId, ctx.owner.id));
    const states = await db
      .select({
        profileId: toolStates.profileId,
        toolKey: toolStates.toolKey,
        schemaVersion: toolStates.schemaVersion,
        revision: toolStates.revision,
        payload: toolStates.payload,
        updatedAt: toolStates.updatedAt,
      })
      .from(toolStates)
      .innerJoin(childProfiles, eq(childProfiles.id, toolStates.profileId))
      .where(eq(childProfiles.userId, ctx.owner.id));
    return new Response(
      JSON.stringify(
        {
          format: "xuebabangbang-export-v1",
          exportedAt: new Date(),
          account: { email: ctx.owner.email, name: ctx.owner.name },
          profiles,
          states,
        },
        null,
        2,
      ),
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="xuebabangbang-records.json"',
        },
      },
    );
  }
  if (parts[0] === "admin") {
    if (ctx.owner.role !== "admin" || !hasVerifiedEmail(ctx.owner))
      throw new HttpError(403, "ADMIN_REQUIRED", "仅管理员可以访问。");
    if (route === "admin/users" && method === "GET") {
      const search = (new URL(request.url).searchParams.get("q") || "").slice(
        0,
        100,
      );
      const users = await db
        .select({
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          disabled: user.disabled,
        })
        .from(user)
        .where(
          search
            ? or(
                ilike(user.email, "%" + search + "%"),
                ilike(user.name, "%" + search + "%"),
              )
            : undefined,
        )
        .orderBy(desc(user.createdAt))
        .limit(100);
      const counts = await db.execute(
        sql`SELECT p.user_id,count(DISTINCT p.id)::int AS profiles, array_remove(array_agg(DISTINCT s.tool_key),null) AS tools FROM child_profiles p LEFT JOIN tool_states s ON s.profile_id=p.id GROUP BY p.user_id`,
      );
      return {
        users: users.map((u) => ({
          ...u,
          ...counts.rows.find((p) => p.user_id === u.id),
        })),
      };
    }
    if (route === "admin/stats" && method === "GET") {
      const result = await db.execute(
        sql`SELECT (SELECT count(*)::int FROM users) AS users,(SELECT count(*)::int FROM users WHERE created_at >= date_trunc('day',now() AT TIME ZONE 'Asia/Shanghai') AT TIME ZONE 'Asia/Shanghai') AS today,(SELECT count(*)::int FROM users WHERE created_at>=now()-interval '7 days') AS week,(SELECT count(*)::int FROM child_profiles) AS profiles`,
      );
      const tools = await db.execute(
        sql`SELECT s.tool_key,count(DISTINCT p.user_id)::int AS users FROM tool_states s JOIN child_profiles p ON p.id=s.profile_id GROUP BY s.tool_key`,
      );
      const sync = await db
        .select()
        .from(syncEvents)
        .orderBy(desc(syncEvents.createdAt))
        .limit(30);
      return { ...result.rows[0], tools: tools.rows, sync };
    }
    if (route === "admin/audit" && method === "GET")
      return {
        logs: await db
          .select()
          .from(auditLogs)
          .orderBy(desc(auditLogs.createdAt))
          .limit(100),
      };
    if (parts[1] === "users" && parts[2] && parts.length === 3) {
      const [target] = await db
        .select()
        .from(user)
        .where(eq(user.id, parts[2]));
      if (!target) throw new HttpError(404, "USER_NOT_FOUND", "未找到用户。");
      if (method === "GET")
        return {
          user: {
            id: target.id,
            email: target.email,
            name: target.name,
            disabled: target.disabled,
            createdAt: target.createdAt,
            lastLoginAt: target.lastLoginAt,
          },
          profiles: await db
            .select()
            .from(childProfiles)
            .where(eq(childProfiles.userId, target.id)),
        };
      if (method === "POST") {
        parent(ctx);
        const body = z
          .object({ action: z.enum(["disable", "restore", "revoke-sessions"]) })
          .strict()
          .parse(await jsonBody(request));
        if (target.id === ctx.owner.id && body.action === "disable")
          throw new HttpError(400, "SELF_DISABLE", "不能禁用当前管理员。");
        await db.transaction(async (tx) => {
          if (body.action !== "revoke-sessions")
            await tx
              .update(user)
              .set({
                disabled: body.action === "disable",
                updatedAt: new Date(),
              })
              .where(eq(user.id, target.id));
          if (body.action !== "restore")
            await tx.delete(session).where(eq(session.userId, target.id));
          await tx.insert(auditLogs).values({
            id: crypto.randomUUID(),
            actorId: ctx.owner.id,
            action: "admin." + body.action,
            targetId: target.id,
          });
        });
        return { ok: true };
      }
    }
  }
  throw new HttpError(404, "NOT_FOUND", "接口不存在。");
}
