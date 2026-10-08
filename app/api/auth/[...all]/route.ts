import { auth, trustedOrigins } from "../../../../lib/auth";
import { mailReady } from "../../../../lib/mail";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function cors(request: Request, response: Response) { const origin = request.headers.get("origin"); if (origin && trustedOrigins.includes(origin)) { response.headers.set("Access-Control-Allow-Origin", origin); response.headers.set("Access-Control-Allow-Credentials", "true"); response.headers.set("Vary", "Origin"); } response.headers.set("Cache-Control", "no-store"); return response; }
async function handle(request: Request) {
  const url = new URL(request.url);
  if (!mailReady() && ["/sign-up/email", "/request-password-reset", "/send-verification-email"].some((v) => url.pathname.endsWith(v))) return cors(request, Response.json({ message: "邮件服务尚未配置，请联系管理员配置 SMTP；开发环境可启用私有开发邮箱。", code: "MAIL_NOT_CONFIGURED" }, { status: 503 }));
  return cors(request, await auth.handler(request));
}
export const GET = handle;
export const POST = handle;
export async function OPTIONS(request: Request) { return cors(request, new Response(null, { status: 204, headers: { "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } })); }

