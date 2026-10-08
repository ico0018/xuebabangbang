import { ZodError } from "zod";
import { dispatch, HttpError } from "../../../../lib/api";
import { trustedOrigins } from "../../../../lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function cors(request: Request, response: Response) {
  const origin = request.headers.get("origin");
  if (origin && trustedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Vary", "Origin");
  }
  response.headers.set("Cache-Control", "no-store");
  return response;
}
async function handle(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const result = await dispatch(request, (await context.params).path);
    return cors(
      request,
      result instanceof Response ? result : Response.json(result),
    );
  } catch (error) {
    const typed = error instanceof HttpError;
    const validation = error instanceof ZodError;
    const status = typed
      ? error.status
      : validation
        ? 400
        : typeof error === "object" && error && "statusCode" in error
          ? Number(error.statusCode)
          : 500;
    if (status === 500) console.error("API request failed", error);
    return cors(
      request,
      Response.json(
        {
          code: typed
            ? error.code
            : validation
              ? "INVALID_INPUT"
              : status === 401
                ? "PASSWORD_INVALID"
                : "REQUEST_FAILED",
          message: typed
            ? error.message
            : validation
              ? "请检查输入内容。"
              : status === 401
                ? "密码不正确，请重试。"
                : "暂时无法完成，请稍后重试。",
        },
        { status },
      ),
    );
  }
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export async function OPTIONS(request: Request) {
  return cors(
    request,
    new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }),
  );
}
