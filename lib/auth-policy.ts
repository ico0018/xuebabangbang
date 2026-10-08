// Server policy: only the explicit value false opts out. Never expose a client switch.
export function requiresEmailVerification(
  value = process.env.REQUIRE_EMAIL_VERIFICATION,
) {
  return value !== "false";
}
export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
// Narrow gate for administration and future paid/email-sensitive operations.
export function hasVerifiedEmail(owner: { emailVerified: boolean }) {
  return owner.emailVerified === true;
}
