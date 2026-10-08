import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
const date = (name: string) => timestamp(name, { withTimezone: true });
export const user = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    emailVerificationExempt: boolean("email_verification_exempt")
      .notNull()
      .default(false),
    image: text("image"),
    createdAt: date("created_at").notNull().defaultNow(),
    updatedAt: date("updated_at").notNull().defaultNow(),
    role: text("role").notNull().default("user"),
    disabled: boolean("disabled").notNull().default(false),
    lastLoginAt: date("last_login_at"),
  },
  (t) => [
    uniqueIndex("users_email_normalized_unique").on(
      sql`lower(btrim(${t.email}))`,
    ),
  ],
);
export const session = pgTable("sessions", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  expiresAt: date("expires_at").notNull(),
  createdAt: date("created_at").notNull().defaultNow(),
  updatedAt: date("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  activeProfileId: text("active_profile_id"),
  parentUnlockedUntil: date("parent_unlocked_until"),
});
export const account = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: date("access_token_expires_at"),
  refreshTokenExpiresAt: date("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: date("created_at").notNull().defaultNow(),
  updatedAt: date("updated_at").notNull().defaultNow(),
});
export const verification = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: date("expires_at").notNull(),
  createdAt: date("created_at").notNull().defaultNow(),
  updatedAt: date("updated_at").notNull().defaultNow(),
});
export const rateLimit = pgTable("rate_limits", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
export const childProfiles = pgTable(
  "child_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    nickname: text("nickname").notNull(),
    grade: text("grade"),
    createdAt: date("created_at").notNull().defaultNow(),
    updatedAt: date("updated_at").notNull().defaultNow(),
  },
  (t) => [index("profiles_user_idx").on(t.userId)],
);
export const toolStates = pgTable(
  "tool_states",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    toolKey: text("tool_key").notNull(),
    schemaVersion: integer("schema_version").notNull(),
    revision: integer("revision").notNull(),
    payload: jsonb("payload").notNull(),
    updatedAt: date("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("states_profile_tool_unique").on(t.profileId, t.toolKey)],
);
export const userEntitlements = pgTable("user_entitlements", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  toolKey: text("tool_key").notNull(),
  operation: text("operation").notNull(),
  allowed: boolean("allowed").notNull(),
  expiresAt: date("expires_at"),
});
export const fileObjects = pgTable("file_objects", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  objectKey: text("object_key").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  createdAt: date("created_at").notNull().defaultNow(),
});
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  targetId: text("target_id"),
  detail: jsonb("detail"),
  createdAt: date("created_at").notNull().defaultNow(),
});
export const syncEvents = pgTable("sync_events", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  toolKey: text("tool_key").notNull(),
  success: boolean("success").notNull(),
  code: text("code").notNull(),
  createdAt: date("created_at").notNull().defaultNow(),
});
