import { z } from "zod";
import { isDeepStrictEqual } from "node:util";
export const toolKeys = ["guwen", "hanzi", "taskhelper"] as const;
export const profileInput = z
  .object({
    nickname: z.string().trim().min(1).max(40),
    grade: z.string().trim().max(30).nullable().optional(),
  })
  .strict();
export const stateInput = z
  .object({
    revision: z.number().int().nonnegative(),
    schemaVersion: z.literal(1),
    payload: z.record(z.string(), z.unknown()),
  })
  .strict();
function object(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}
function list(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? v.map(object) : [];
}
function same(a: unknown, b: unknown) {
  return isDeepStrictEqual(a, b);
}
function todayShanghai() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return ["year", "month", "day"]
    .map((k) => parts.find((p) => p.type === k)?.value)
    .join("-");
}
function automaticPenalty(
  plan: Record<string, unknown>,
  next: Record<string, unknown>,
) {
  const tasks = list(next.tasks).filter(
    (t) =>
      !t.deletedAt &&
      Array.isArray(plan.taskIds) &&
      plan.taskIds.includes(t.id),
  );
  const sessions = list(next.sessions);
  const cutoff =
    new Date(String(plan.date) + "T00:00:00+08:00").getTime() + 86400000;
  const reached = tasks.every((t) => {
    const s = sessions.find((s) => s.taskId === t.id);
    return (
      s?.completed &&
      typeof s.completedAt === "number" &&
      s.completedAt < cutoff &&
      (s.status === "completed" ||
        Number(s.actualMinutes) <= Number(s.estimatedMinutes) ||
        s.reflectionReason != null)
    );
  });
  return tasks.length && !reached ? -1 : 0;
}
export function requiresParent(tool: string, before: unknown, after: unknown) {
  if (tool !== "taskhelper") return false;
  const previous = object(before),
    next = object(after),
    today = todayShanghai();
  if (!same(previous.templates ?? [], next.templates ?? [])) return true;
  const taskDefinitions = (v: unknown) =>
    list(v).map((t) =>
      Object.fromEntries(
        Object.entries(t).filter(([k]) => k !== "reminderPending"),
      ),
    );
  if (!same(taskDefinitions(previous.tasks), taskDefinitions(next.tasks)))
    return true;
  const priorTasks = new Map(list(previous.tasks).map((t) => [t.id, t]));
  const priorSessionIds = new Set(list(previous.sessions).map((s) => s.id));
  for (const task of list(next.tasks)) {
    const old = priorTasks.get(task.id);
    if (old && old.reminderPending !== task.reminderPending) {
      const newStart = list(next.sessions).some(
        (s) =>
          !priorSessionIds.has(s.id) &&
          s.taskId === task.id &&
          s.startedIndependently === false,
      );
      if (!(
        old.reminderPending === true &&
        task.reminderPending === false &&
        newStart
      ))
        return true;
    }
  }
  for (const key of ["id", "name", "stage"])
    if (before && !same(object(previous.user)[key], object(next.user)[key]))
      return true;
  if (
    before &&
    !same(previous.scoringStartedOn ?? null, next.scoringStartedOn ?? null) &&
    !(previous.scoringStartedOn == null && next.scoringStartedOn === today)
  )
    return true;
  const priorPlans = new Map(list(previous.plans).map((p) => [p.id, p]));
  for (const plan of list(next.plans)) {
    const old = priorPlans.get(plan.id);
    if (!same(old?.taskIds ?? [], plan.taskIds ?? [])) return true;
    if (!same(old?.dailyPenalty ?? null, plan.dailyPenalty ?? null)) {
      const start = String(next.scoringStartedOn ?? today);
      if (!(
        old?.dailyPenalty == null &&
        String(plan.date) < today &&
        String(plan.date) >= start &&
        plan.dailyPenalty === automaticPenalty(plan, next)
      ))
        return true;
    }
    priorPlans.delete(plan.id);
  }
  if (priorPlans.size) return true;
  const previousSessions = new Map(
    list(previous.sessions).map((s) => [s.id, s]),
  );
  for (const item of list(next.sessions)) {
    const old = previousSessions.get(item.id);
    if (!same(old?.quality ?? null, item.quality ?? null)) return true;
    previousSessions.delete(item.id);
  }
  if ([...previousSessions.values()].some((s) => s.quality != null))
    return true;
  return false;
}
export function canOperate(
  grants: {
    toolKey: string;
    operation: string;
    allowed: boolean;
    expiresAt: Date | null;
  }[],
  tool: string,
  operation: string,
  now = new Date(),
) {
  return !grants.some(
    (g) =>
      (g.toolKey === tool || g.toolKey === "*") &&
      (g.operation === operation || g.operation === "*") &&
      !g.allowed &&
      (!g.expiresAt || g.expiresAt > now),
  );
}
