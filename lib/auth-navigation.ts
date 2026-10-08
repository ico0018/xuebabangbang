// Redirects are navigation only; authentication and all permission checks stay on the server.
export function safeReturnTo(
  value: string | null,
  origin: string,
  toolOrigins: string[],
) {
  if (!value) return origin + "/account";
  try {
    const target = new URL(value, origin);
    const allowed = new Set([
      origin,
      ...toolOrigins.map((v) => new URL(v).origin),
    ]);
    if (
      !allowed.has(target.origin) ||
      target.username ||
      target.password ||
      !["http:", "https:"].includes(target.protocol)
    )
      return origin + "/account";
    if (
      target.origin === origin &&
      /^\/(?:login|register|forgot-password|reset-password|api)(?:\/|$)/.test(
        target.pathname,
      )
    )
      return origin + "/account";
    return target.href;
  } catch {
    return origin + "/account";
  }
}
