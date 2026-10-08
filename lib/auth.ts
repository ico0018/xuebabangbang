import { validateAuthUrl } from "./config";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./schema";
import { sendMail } from "./mail";
import { eq } from "drizzle-orm";
export const trustedOrigins = (process.env.TRUSTED_ORIGINS || "http://localhost:3000").split(",").map((v) => v.trim()).filter(Boolean);
export const auth = betterAuth({
  appName: "学霸帮帮", baseURL: validateAuthUrl(process.env.BETTER_AUTH_URL || "http://localhost:3000", process.env.COOKIE_DOMAIN), secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }), trustedOrigins,
  emailAndPassword: { enabled: true, requireEmailVerification: true, minPasswordLength: 10, maxPasswordLength: 128, revokeSessionsOnPasswordReset: true, sendResetPassword: async ({ user, url }) => sendMail(user.email, "重置学霸帮帮密码", url) },
  emailVerification: { sendOnSignUp: true, sendOnSignIn: true, autoSignInAfterVerification: true, sendVerificationEmail: async ({ user, url }) => sendMail(user.email, "验证学霸帮帮邮箱", url) },
  user: { additionalFields: { role: { type: "string", defaultValue: "user", input: false }, disabled: { type: "boolean", defaultValue: false, input: false } } },
  session: { expiresIn: 60 * 60 * 24 * 14, updateAge: 60 * 60 * 24, cookieCache: { enabled: false }, additionalFields: { activeProfileId: { type: "string", required: false, input: false }, parentUnlockedUntil: { type: "date", required: false, input: false } } },
  advanced: { useSecureCookies: (process.env.BETTER_AUTH_URL || "").startsWith("https:"), ...(process.env.COOKIE_DOMAIN ? { crossSubDomainCookies: { enabled: true, domain: process.env.COOKIE_DOMAIN } } : {}), defaultCookieAttributes: { httpOnly: true, sameSite: "lax" } },
  rateLimit: { enabled: true, storage: "database", window: 60, max: 80, customRules: { "/sign-in/email": { window: 60, max: 8 }, "/sign-up/email": { window: 60, max: 4 }, "/request-password-reset": { window: 60, max: 4 } } },
  databaseHooks: { session: { create: { before: async (value) => { const [owner] = await db.select().from(schema.user).where(eq(schema.user.id, value.userId)); if (!owner || owner.disabled) return false; await db.update(schema.user).set({ lastLoginAt: new Date() }).where(eq(schema.user.id, value.userId)); return { data: value }; } } } },
});


