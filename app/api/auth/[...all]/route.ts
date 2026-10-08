import {
  auth,
  compatibleSignInAuth,
  requireEmailVerification,
  trustedOrigins,
} from "../../../../lib/auth";
import { mailReady } from "../../../../lib/mail";
import { normalizeEmail } from "../../../../lib/auth-policy";
import {
  authHeaders,
  authThrottle,
  trustedClientIp,
} from "../../../../lib/auth-throttle";
import { db } from "../../../../lib/db";
import { user } from "../../../../lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function cors(request: Request, response: Response) {
  const origin = request.headers.get("origin");
  if (origin && trustedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Vary", "Origin");
  }
  response.headers.set("Cache-Control", "no-store");
  return response;
}
async function handle(request: Request) {
  const fail = (
    status: number,
    code: string,
    message: string,
    retry?: number,
  ) =>
    cors(
      request,
      Response.json(
        { code, message },
        {
          status,
          headers: retry ? { "Retry-After": String(retry) } : undefined,
        },
      ),
    );
  const url = new URL(request.url);
  const path = url.pathname.slice("/api/auth/".length);
  // Avoid a differently encoded/trailing path bypassing this server policy.
  if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(path))
    return fail(400, "INVALID_PATH", "请求地址无效。");
  if (
    request.method === "POST" &&
    !trustedOrigins.includes(request.headers.get("origin") || "")
  )
    return fail(403, "ORIGIN_DENIED", "请求来源未被允许。");
  const ip = trustedClientIp(request.headers);
  const headers = authHeaders(request.headers, ip);
  let body: Record<string, unknown> | undefined;
  if (request.method === "POST") {
    if (!(headers.get("content-type") || "").startsWith("application/json"))
      return fail(415, "JSON_REQUIRED", "请求格式无效。");
    const reader = request.body?.getReader();
    let bytes = 0,
      text = "";
    const decoder = new TextDecoder();
    if (reader)
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 16384) {
          await reader.cancel();
          return fail(413, "PAYLOAD_TOO_LARGE", "请求内容过长。");
        }
        text += decoder.decode(value, { stream: true });
      }
    try {
      body = JSON.parse(text + decoder.decode());
      if (!body || Array.isArray(body) || typeof body !== "object")
        throw new Error();
    } catch {
      return fail(400, "INVALID_BODY", "请求内容无效。");
    }
    const email =
      typeof body.email === "string" ? normalizeEmail(body.email) : undefined;
    const retry = await authThrottle(path, ip, email);
    if (retry)
      return fail(
        429,
        "RATE_LIMITED",
        `操作太频繁，请 ${retry} 秒后重试。`,
        retry,
      );
    if (email !== undefined) body.email = email;
    if (
      [
        "sign-up/email",
        "sign-in/email",
        "request-password-reset",
        "send-verification-email",
      ].includes(path) &&
      !z.email().max(254).safeParse(email).success
    )
      return fail(400, "INVALID_EMAIL", "请输入有效的邮箱地址。");
    if (path === "change-email")
      return fail(
        403,
        "EMAIL_CHANGE_DISABLED",
        "暂不开放修改邮箱；不能凭未验证邮箱变更账号归属。",
      );
    if (
      !mailReady() &&
      ([
        "request-password-reset",
        "reset-password",
        "send-verification-email",
      ].includes(path) ||
        (requireEmailVerification && path === "sign-up/email"))
    )
      return fail(
        503,
        "MAIL_NOT_CONFIGURED",
        "邮件服务暂未启用，找回密码和邮箱验证暂不可用，请稍后重试。",
      );
    if (path === "send-verification-email") {
      const [owner] = await db
        .select()
        .from(user)
        .where(eq(user.email, email!));
      if (owner?.emailVerificationExempt && !owner.emailVerified)
        return fail(
          403,
          "EMAIL_OWNERSHIP_RESET_REQUIRED",
          "请通过邮箱重置密码来确认邮箱归属，并使旧密码失效。",
        );
    }
    if (path === "sign-up/email") {
      const [existing] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, email!));
      if (existing)
        return fail(
          422,
          "USER_ALREADY_EXISTS",
          "这个邮箱已注册，请登录；若邮箱属于您，可在邮件服务启用后通过邮箱重置密码。",
        );
      body.name = "家长";
    }
  }
  let handler = auth;
  if (requireEmailVerification && path === "sign-in/email" && body) {
    const [owner] = await db
      .select()
      .from(user)
      .where(eq(user.email, String(body.email)));
    if (owner?.emailVerificationExempt && owner.role !== "admin")
      handler = compatibleSignInAuth;
  }
  headers.delete("content-length");
  const clean = new Request(request.url, {
    method: request.method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return cors(request, await handler.handler(clean));
}
export const GET = handle;
export const POST = handle;
export async function OPTIONS(request: Request) {
  return cors(
    request,
    new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }),
  );
}
