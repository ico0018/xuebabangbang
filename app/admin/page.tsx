import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "../../lib/auth";
import { db } from "../../lib/db";
import { user } from "../../lib/schema";
import { AdminCenter } from "../../components/AdminCenter";
export const dynamic = "force-dynamic";
export default async function Page() {
  const value = await auth.api.getSession({ headers: await headers() });
  if (!value) redirect("/login");
  const [owner] = await db
    .select()
    .from(user)
    .where(eq(user.id, value.user.id));
  if (!owner || owner.disabled || owner.role !== "admin")
    return (
      <div className="page-shell account-shell">
        <h1>仅管理员可访问</h1>
        <p>您的账号没有后台权限。</p>
      </div>
    );
  return <AdminCenter />;
}
