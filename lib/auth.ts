import { validateAuthUrl } from "./config";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./schema";
import { sendMail } from "./mail";
import { requiresEmailVerification, normalizeEmail } from "./auth-policy";
import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
export const trustedOrigins = (
  process.env.TRUSTED_ORIGINS || "http://localhost:3000"
)
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);
export const requireEmailVerification = requiresEmailVerification();
function createAuth(verificationRequired: boolean) {
  return betterAuth({
    appName: "学霸帮帮",
    baseURL: validateAuthUrl(
      process.env.BETTER_AUTH_URL || "http://localhost:3000",
      process.env.COOKIE_DOMAIN,
    ),
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: verificationRequired,
      autoSignIn: !verificationRequired,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) =>
        sendMail(user.email, "重置学霸帮帮密码", url),
      onPasswordReset: async ({ user: owner }) => {
        // Consuming a one-time mailbox token proves ownership. The new password
        // replaces any password chosen by someone who pre-registered this address.
        await db
          .update(schema.user)
          .set({ emailVerified: true, emailVerificationExempt: false })
          .where(eq(schema.user.id, owner.id));
      },
    },
    emailVerification: {
      sendOnSignUp: verificationRequired,
      sendOnSignIn: verificationRequired,
      autoSignInAfterVerification: true,
      beforeEmailVerification: async (owner) => {
        const [stored] = await db
          .select()
          .from(schema.user)
          .where(eq(schema.user.id, owner.id));
        if (stored?.emailVerificationExempt && !stored.emailVerified) {
          // Never upgrade a pre-registered password by clicking a bare verification
          // link. Recovery must also replace that password and revoke all sessions.
          throw new APIError("FORBIDDEN", {
            code: "EMAIL_OWNERSHIP_RESET_REQUIRED",
            message: "请通过邮箱重置密码来确认邮箱归属。",
          });
        }
      },
      afterEmailVerification: async (owner) => {
        await db
          .delete(schema.session)
          .where(eq(schema.session.userId, owner.id));
      },
      sendVerificationEmail: async ({ user, url }) =>
        sendMail(user.email, "验证学霸帮帮邮箱", url),
    },
    user: {
      additionalFields: {
        emailVerificationExempt: {
          type: "boolean",
          defaultValue: false,
          input: false,
          returned: false,
        },
        role: { type: "string", defaultValue: "user", input: false },
        disabled: { type: "boolean", defaultValue: false, input: false },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 14,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
      additionalFields: {
        activeProfileId: { type: "string", required: false, input: false },
        parentUnlockedUntil: { type: "date", required: false, input: false },
      },
    },
    advanced: {
      // Only our server wrapper can populate this header after authenticating Nginx.
      ipAddress: { ipAddressHeaders: ["x-xbb-auth-ip"] },
      useSecureCookies: (process.env.BETTER_AUTH_URL || "").startsWith(
        "https:",
      ),
      ...(process.env.COOKIE_DOMAIN
        ? {
            crossSubDomainCookies: {
              enabled: true,
              domain: process.env.COOKIE_DOMAIN,
            },
          }
        : {}),
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 80,
      customRules: {
        "/sign-in/email": { window: 60, max: 8 },
        "/sign-up/email": { window: 60, max: 4 },
        "/request-password-reset": { window: 60, max: 4 },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (value) => ({
            data: {
              ...value,
              email: normalizeEmail(value.email),
              emailVerificationExempt: !verificationRequired,
            },
          }),
        },
      },
      session: {
        create: {
          before: async (value) => {
            const [owner] = await db
              .select()
              .from(schema.user)
              .where(eq(schema.user.id, value.userId));
            if (
              !owner ||
              owner.disabled ||
              (owner.role === "admin" && !owner.emailVerified)
            )
              return false;
            await db
              .update(schema.user)
              .set({ lastLoginAt: new Date() })
              .where(eq(schema.user.id, value.userId));
            return { data: value };
          },
        },
      },
    },
  });
}
export const auth = createAuth(requireEmailVerification);
// Used ONLY for password sign-in of server-recorded ordinary learning accounts
// admitted before enforcement. The browser cannot set or request an exemption.
export const compatibleSignInAuth = requireEmailVerification
  ? createAuth(false)
  : auth;
