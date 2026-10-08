import { eq } from "drizzle-orm";
import { db, pool } from "../lib/db";
import { user, auditLogs } from "../lib/schema";
async function main() {
  const email = process.argv[2];
  if (!email || process.env.CONFIRM_ADMIN_EMAIL !== email)
    throw new Error(
      "Set CONFIRM_ADMIN_EMAIL to the exact verified email and run npm run admin:promote -- email.",
    );
  await db.transaction(async (tx) => {
    const [target] = await tx.select().from(user).where(eq(user.email, email));
    if (!target || !target.emailVerified || target.disabled)
      throw new Error("Verified, enabled account required.");
    await tx
      .update(user)
      .set({ role: "admin", updatedAt: new Date() })
      .where(eq(user.id, target.id));
    await tx
      .insert(auditLogs)
      .values({
        id: crypto.randomUUID(),
        actorId: null,
        action: "admin.bootstrap.cli",
        targetId: target.id,
      });
  });
  console.log("Administrator promoted.");
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
