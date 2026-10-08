import { createHmac, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { sql } from "drizzle-orm";
import { db } from "./db";
export function trustedClientIp(
  headers: Headers,
  secret = process.env.TRUSTED_PROXY_SECRET,
) {
  const received = headers.get("x-xbb-proxy-secret") || "";
  if (
    !secret ||
    secret.length < 32 ||
    Buffer.byteLength(received) !== Buffer.byteLength(secret) ||
    !timingSafeEqual(Buffer.from(received), Buffer.from(secret))
  )
    return "untrusted-proxy";
  const ip = headers.get("x-xbb-client-ip") || "";
  return isIP(ip) ? ip : "untrusted-proxy";
}
export function authHeaders(headers: Headers, ip: string) {
  const clean = new Headers(headers);
  for (const key of [
    "x-forwarded-for",
    "x-real-ip",
    "cf-connecting-ip",
    "forwarded",
    "x-xbb-proxy-secret",
    "x-xbb-client-ip",
    "x-xbb-auth-ip",
  ])
    clean.delete(key);
  if (isIP(ip)) clean.set("x-xbb-auth-ip", ip);
  return clean;
}
const rules: Record<string, { ip: number; email: number; window: number }> = {
  "sign-up/email": { ip: 4, email: 4, window: 60 },
  "sign-in/email": { ip: 8, email: 8, window: 60 },
  "request-password-reset": { ip: 4, email: 3, window: 300 },
  "send-verification-email": { ip: 4, email: 3, window: 300 },
};
export async function authThrottle(path: string, ip: string, email?: string) {
  const rule = rules[path];
  if (!rule) return 0;
  const now = Date.now(),
    windowMs = rule.window * 1000;
  let retry = 0;
  for (const [kind, value, max] of [
    ["ip", ip, rule.ip],
    ...(email ? [["email", email, rule.email]] : []),
  ] as [string, string, number][]) {
    const key =
      "auth-v2:" +
      path +
      ":" +
      kind +
      ":" +
      createHmac("sha256", process.env.BETTER_AUTH_SECRET!)
        .update(value)
        .digest("hex");
    // Atomic DB upsert; parallel requests and container restarts share the bucket.
    const result =
      await db.execute(sql`INSERT INTO rate_limits (id,key,count,last_request)
      VALUES (${crypto.randomUUID()},${key},1,${now}) ON CONFLICT (key) DO UPDATE SET
      count=CASE WHEN rate_limits.last_request <= ${now - windowMs} THEN 1 ELSE rate_limits.count+1 END,
      last_request=CASE WHEN rate_limits.last_request <= ${now - windowMs} THEN ${now} ELSE rate_limits.last_request END
      RETURNING count,last_request`);
    const row = result.rows[0];
    if (Number(row.count) > max)
      retry = Math.max(
        retry,
        Math.max(
          1,
          Math.ceil((Number(row.last_request) + windowMs - now) / 1000),
        ),
      );
  }
  return retry;
}
