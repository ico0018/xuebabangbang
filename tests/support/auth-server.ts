import { createServer } from "node:http";
import { POST, GET } from "../../app/api/auth/[...all]/route";
import { dispatch, HttpError } from "../../lib/api";
const server = createServer(async (req, res) => {
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers))
      if (value)
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    const request = new Request(process.env.BETTER_AUTH_URL + req.url!, {
      method: req.method,
      headers,
      ...(["GET", "HEAD"].includes(req.method!)
        ? {}
        : { body: Buffer.concat(chunks) }),
    });
    let response: Response;
    if (req.url!.startsWith("/api/v1/")) {
      try {
        const data = await dispatch(request, req.url!.slice(8).split("/"));
        response = data instanceof Response ? data : Response.json(data);
      } catch (error) {
        response = Response.json(
          { code: error instanceof HttpError ? error.code : "ERROR" },
          { status: error instanceof HttpError ? error.status : 400 },
        );
      }
    } else response = await (req.method === "GET" ? GET : POST)(request);
    res.statusCode = response.status;
    for (const [key, value] of response.headers)
      if (key !== "set-cookie") res.setHeader(key, value);
    const cookies = response.headers.getSetCookie();
    if (cookies.length) res.setHeader("set-cookie", cookies);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.statusCode = 500;
    res.end("Internal test server error");
  }
});
server.listen(Number(process.env.AUTH_TEST_PORT || 18430), "127.0.0.1", () =>
  console.log("AUTH_TEST_READY"),
);
