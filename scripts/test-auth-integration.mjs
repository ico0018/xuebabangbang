// Uses a NEW isolated local database; never points tests at production/preview DB.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import pg from "pg";
const { Client } = pg;
const base = "http://localhost:18430",
  results = [],
  token = crypto.randomBytes(32).toString("hex");
let server, dbUrl, client;
const fixture = path.resolve("../runtime/.env.test");
const env =
  process.env.AUTH_TEST_ALLOW_PREVIEW === "true"
    ? process.env
    : Object.fromEntries(
        fs
          .readFileSync(fixture, "utf8")
          .split(/\r?\n/)
          .filter((v) => v.includes("="))
          .map((v) => [
            v.slice(0, v.indexOf("=")),
            v.slice(v.indexOf("=") + 1),
          ]),
      );
const directory = path.resolve(
  process.env.AUTH_TEST_TMP_DIR || "../runtime",
  "registration-mail-" + Date.now(),
);
const params = {
  email: "parent-" + Date.now() + "@example.test",
  password: crypto.randomBytes(24).toString("base64url"),
};
async function start(verify, mail) {
  const config = {
    ...process.env,
    ...env,
    NODE_ENV: "production",
    DATABASE_URL: dbUrl,
    BETTER_AUTH_URL: base,
    TRUSTED_ORIGINS: base,
    BETTER_AUTH_SECRET: token,
    TRUSTED_PROXY_SECRET: token,
    MAIL_PROVIDER: mail,
    ENABLE_DEV_MAIL: "true",
    DEV_MAIL_DIR: directory,
  };
  if (verify === undefined) delete config.REQUIRE_EMAIL_VERIFICATION;
  else config.REQUIRE_EMAIL_VERIFICATION = verify;
  server = spawn(
    process.execPath,
    ["--import", "tsx", "tests/support/auth-server.ts"],
    { cwd: process.cwd(), env: config, stdio: ["ignore", "pipe", "pipe"] },
  );
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(Error("test server startup timeout")),
      20000,
    );
    server.once("exit", () => {
      clearTimeout(timeout);
      reject(Error("test server exited"));
    });
    server.stdout.on("data", (v) => {
      if (v.toString().includes("AUTH_TEST_READY")) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
}
async function stop() {
  if (server) {
    server.kill();
    await new Promise((resolve) => server.once("exit", resolve));
    server = undefined;
  }
}
const session = () => ({ cookie: "" });
async function call(s, route, body, ip = "198.51.100.1", extra = {}) {
  const headers = {
    Origin: base,
    "x-xbb-proxy-secret": token,
    "x-xbb-client-ip": ip,
    ...extra,
  };
  if (s.cookie) headers.Cookie = s.cookie;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const r = await fetch(base + route, {
    method: body === undefined ? "GET" : "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
  const cookies = r.headers.getSetCookie();
  if (cookies.length) {
    const jar = Object.fromEntries(
      s.cookie
        .split("; ")
        .filter(Boolean)
        .map((v) => {
          const i = v.indexOf("=");
          return [v.slice(0, i), v.slice(i + 1)];
        }),
    );
    for (const cookie of cookies) {
      const first = cookie.split(";")[0],
        i = first.indexOf("=");
      jar[first.slice(0, i)] = first.slice(i + 1);
    }
    s.cookie = Object.entries(jar)
      .map(([k, v]) => k + "=" + v)
      .join("; ");
  }
  const text = await r.text();
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    value = {};
  }
  return { status: r.status, value, headers: r.headers };
}
function status(r, code) {
  assert.equal(
    r.status,
    code,
    "expected " + code + ", got " + r.status + " / " + (r.value.code || ""),
  );
}
async function mail(email, subject) {
  const files = fs.readdirSync(directory);
  for (const file of files.reverse()) {
    const item = JSON.parse(
      fs.readFileSync(path.join(directory, file), "utf8"),
    );
    if (item.to === email && item.subject.includes(subject)) return item.url;
  }
  throw Error("mail missing");
}
(async () => {
  const source = new URL(env.DATABASE_URL);
  if (process.env.AUTH_TEST_ALLOW_PREVIEW === "true") {
    assert.equal(source.hostname, "db");
    assert.equal(source.pathname, "/xueba_preview");
  } else {
    assert.equal(source.hostname, "127.0.0.1");
    assert.equal(source.port, "55432");
  }
  client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  const name = "registration_policy_" + Date.now();
  await client.query("CREATE DATABASE " + name);
  source.pathname = "/" + name;
  dbUrl = source.href;
  await client.end();
  client = new Client({ connectionString: dbUrl });
  await client.connect();
  const migrate = spawnSync(
    process.execPath,
    ["--import", "tsx", "scripts/migrate.ts"],
    { env: { ...process.env, DATABASE_URL: dbUrl }, encoding: "utf8" },
  );
  assert.equal(migrate.status, 0, "migration failed");
  await start("false", "disabled");
  const a = session(),
    b = session();
  const signed = await call(a, "/api/auth/sign-up/email", {
    ...params,
    email: "  " + params.email.toUpperCase() + "  ",
    role: "admin",
    emailVerified: true,
    emailVerificationExempt: false,
  });
  status(signed, 200);
  assert.equal(signed.value.user.emailVerified, false);
  assert.equal(signed.value.user.role, "user");
  assert.ok(a.cookie);
  assert.match(signed.headers.get("set-cookie"), /HttpOnly/i);
  status(await call(a, "/api/v1/session"), 200);
  status(await call(a, "/api/v1/admin/stats"), 403);
  status(
    await call(a, "/api/auth/request-password-reset", { email: params.email }),
    503,
  );
  status(await call(b, "/api/auth/sign-up/email", params), 422);
  const stored = (
    await client.query(
      "SELECT email_verified,email_verification_exempt FROM users WHERE email=$1",
      [params.email],
    )
  ).rows[0];
  assert.equal(stored.email_verified, false);
  assert.equal(stored.email_verification_exempt, true);
  const hash = (
    await client.query(
      "SELECT password FROM accounts JOIN users ON accounts.user_id=users.id WHERE users.email=$1",
      [params.email],
    )
  ).rows[0].password;
  assert.notEqual(hash, params.password);
  assert.ok(hash.length > 64);
  await assert.rejects(
    client.query("INSERT INTO users (id,name,email) VALUES ($1,$2,$3)", [
      "case-duplicate",
      "test",
      params.email.toUpperCase(),
    ]),
    (e) => e.code === "23505",
  );
  results.push(
    "false + disabled mail: auto session, unverified DB state, server-only role, normalized duplicate and DB expression uniqueness, existing secure password hashing",
  );
  status(
    await call(a, "/api/v1/parent-unlock", { password: params.password }),
    200,
  );
  const p = await call(a, "/api/v1/profiles", { nickname: "免验证学习" });
  status(p, 200);
  const profile = p.value.id;
  const put = async (s, id, data) => {
    const r = await fetch(base + "/api/v1/profiles/" + id + "/state/guwen", {
      method: "PUT",
      headers: {
        Origin: base,
        Cookie: s.cookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return { status: r.status, value: await r.json() };
  };
  status(
    await put(a, profile, {
      revision: 0,
      schemaVersion: 1,
      payload: { "guwen-leyuan-read-v1": '["saved"]' },
    }),
    200,
  );
  status(await call(a, "/api/auth/sign-out", {}), 200);
  status(await call(a, "/api/v1/session"), 401);
  status(await call(a, "/api/auth/sign-in/email", params), 200);
  assert.equal(
    (await call(a, "/api/v1/profiles/" + profile + "/state/guwen")).value
      .revision,
    1,
  );
  status(
    await call(
      b,
      "/api/auth/sign-up/email",
      { email: "second-" + params.email, password: params.password },
      "198.51.100.2",
    ),
    200,
  );
  const oldSecondSession = { ...b };
  status(await call(b, "/api/v1/profiles/" + profile + "/state/guwen"), 404);
  status(
    await put(b, profile, { revision: 1, schemaVersion: 1, payload: {} }),
    404,
  );
  status(
    await call(a, "/api/auth/change-email", {
      newEmail: "victim@example.test",
    }),
    403,
  );
  status(
    await call(a, "/api/auth/update-user", {
      emailVerified: true,
      email: "victim@example.test",
    }),
    400,
  );
  status(
    await call(a, "/api/auth/change-password", {
      currentPassword: "bad-password",
      newPassword: params.password + "new",
    }),
    400,
  );
  results.push(
    "Unverified learning access, profile/state persistence through logout/login, multi-account read/write denial, email-change and fake verification denied, password change requires original password",
  );
  // Actual atomic rate limits with concurrent attempts, plus spoofed header rotations.
  const signup = await Promise.all(
    Array.from({ length: 7 }, (_, i) =>
      call(
        session(),
        "/api/auth/sign-up/email",
        { email: "invalid-" + i, password: "x" },
        "203.0.113.10",
      ),
    ),
  );
  assert.ok(signup.some((r) => r.status === 429));
  assert.ok(signup.filter((r) => r.status !== 429).length <= 4);
  const login = await Promise.all(
    Array.from({ length: 10 }, () =>
      call(
        session(),
        "/api/auth/sign-in/email",
        { email: "none@example.test", password: "wrong-password" },
        "203.0.113.11",
      ),
    ),
  );
  assert.ok(login.some((r) => r.status === 429));
  const emailLimit = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      call(
        session(),
        "/api/auth/sign-in/email",
        { email: "rotated@example.test", password: "wrong-password" },
        "203.0.113." + (30 + i),
      ),
    ),
  );
  assert.ok(emailLimit.some((r) => r.status === 429));
  for (let i = 0; i < 5; i++) {
    const r = await call(
      session(),
      "/api/auth/sign-up/email",
      { email: "invalid-" + i, password: "x" },
      "203.0.113." + (100 + i),
      {
        "x-xbb-proxy-secret": "spoof",
        "x-forwarded-for": "198.18.0." + i,
        "x-real-ip": "198.19.0." + i,
        "x-xbb-auth-ip": "198.20.0." + i,
      },
    );
    if (i === 4) status(r, 429);
  }
  results.push(
    "Concurrent database IP and account rate limits; forwarding/IP header spoofing cannot rotate buckets",
  );
  await stop();
  await start(undefined, "development"); // absent config safely defaults true
  status(await call(a, "/api/auth/sign-in/email", params, "198.51.100.3"), 200);
  assert.equal(
    (await call(a, "/api/v1/profiles/" + profile + "/state/guwen")).value
      .revision,
    1,
  );
  status(
    await call(
      session(),
      "/api/auth/sign-up/email",
      { email: "invalid-new", password: "x" },
      "203.0.113.10",
    ),
    429,
  );
  const c = session(),
    verifiedEmail = "verified-" + params.email;
  const cBody = { email: verifiedEmail, password: params.password };
  const pending = await call(
    c,
    "/api/auth/sign-up/email",
    { ...cBody, emailVerificationExempt: true, emailVerified: true },
    "198.51.100.4",
  );
  status(pending, 200);
  assert.equal(pending.value.token, null);
  status(await call(c, "/api/v1/session"), 401);
  status(await call(c, "/api/auth/sign-in/email", cBody, "198.51.100.4"), 403);
  let link = await mail(verifiedEmail, "验证");
  status(await call(c, new URL(link).pathname + new URL(link).search), 302);
  status(await call(c, "/api/auth/sign-in/email", cBody, "198.51.100.4"), 200);
  assert.equal(
    (
      await client.query(
        "SELECT email_verified,email_verification_exempt FROM users WHERE email=$1",
        [verifiedEmail],
      )
    ).rows[0].email_verified,
    true,
  );
  results.push(
    "Absent config defaults true; new accounts require real email token; client exemption injection denied; prior unverified account keeps learning data; rate limit survives server restart",
  );
  // A bare verification link cannot grant ownership of an exempt/pre-registered password.
  status(
    await call(a, "/api/auth/send-verification-email", { email: params.email }),
    403,
  );
  status(
    await call(b, "/api/auth/reset-password", {
      token: "invented",
      newPassword: params.password + "other",
    }),
    400,
  );
  status(
    await call(
      b,
      "/api/auth/request-password-reset",
      { email: params.email, redirectTo: base + "/reset-password" },
      "198.51.100.5",
    ),
    200,
  );
  const reset = await call(
    b,
    new URL(await mail(params.email, "重置")).pathname +
      new URL(await mail(params.email, "重置")).search,
  );
  status(reset, 302);
  const resetToken = new URL(
    reset.headers.get("location"),
    base,
  ).searchParams.get("token");
  assert.ok(resetToken);
  const ownedPassword = crypto.randomBytes(24).toString("base64url");
  status(
    await call(
      b,
      "/api/auth/reset-password",
      { token: resetToken, newPassword: ownedPassword },
      "198.51.100.5",
    ),
    200,
  );
  status(await call(a, "/api/v1/session"), 401);
  status(await call(a, "/api/auth/sign-in/email", params, "198.51.100.6"), 401);
  status(
    await call(
      b,
      "/api/auth/sign-in/email",
      { email: params.email, password: ownedPassword },
      "198.51.100.6",
    ),
    200,
  );
  status(
    await call(session(), "/api/auth/reset-password", {
      token: resetToken,
      newPassword: params.password,
    }),
    400,
  );
  assert.equal(
    (
      await client.query("SELECT email_verified FROM users WHERE email=$1", [
        params.email,
      ])
    ).rows[0].email_verified,
    true,
  );
  results.push(
    "Mailbox reset token proves ownership, changes pre-registered password, revokes all former sessions; old/invented/replayed credentials denied",
  );
  await client.query(
    "UPDATE users SET role=$1,email_verified=false WHERE email=$2",
    ["admin", "second-" + params.email],
  );
  status(await call(oldSecondSession, "/api/v1/admin/stats"), 403);
  status(
    await call(
      session(),
      "/api/auth/sign-in/email",
      { email: "second-" + params.email, password: params.password },
      "198.51.100.7",
    ),
    403,
  );
  await stop();
  await start("true", "disabled");
  status(
    await call(
      session(),
      "/api/auth/sign-up/email",
      { email: "closed-" + params.email, password: params.password },
      "198.51.100.8",
    ),
    503,
  );
  status(
    await call(session(), "/api/auth/request-password-reset", {
      email: params.email,
    }),
    503,
  );
  status(await call(c, "/api/auth/sign-in/email", cBody, "198.51.100.8"), 200);
  results.push(
    "Unverified administrator cannot sign in or use admin API; true + no mail gives explicit unavailable status; existing verified account still signs in",
  );
  // Upgrade a populated original schema, rather than only testing an empty DB.
  await stop();
  const original = new Client({ connectionString: dbUrl });
  await original.connect();
  const migrationDb = "registration_migration_" + Date.now();
  await original.query("CREATE DATABASE " + migrationDb);
  await original.end();
  const legacyUrl = new URL(dbUrl);
  legacyUrl.pathname = "/" + migrationDb;
  const legacy = new Client({ connectionString: legacyUrl.href });
  await legacy.connect();
  const firstSql = fs.readFileSync(
    "drizzle/0000_young_titanium_man.sql",
    "utf8",
  );
  await legacy.query(firstSql);
  await legacy.query(
    "CREATE SCHEMA drizzle; CREATE TABLE drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY,hash text NOT NULL,created_at bigint)",
  );
  await legacy.query(
    "INSERT INTO drizzle.__drizzle_migrations (hash,created_at) VALUES ($1,$2)",
    [crypto.createHash("sha256").update(firstSql).digest("hex"), 1791421402558],
  );
  await legacy.query(
    "INSERT INTO users (id,name,email,email_verified) VALUES ($1,$2,$3,false)",
    ["legacy-user", "家长", " Legacy@Example.Test "],
  );
  await legacy.query(
    "INSERT INTO accounts (id,account_id,provider_id,user_id,password) VALUES ($1,$2,$3,$4,$5)",
    ["legacy-account", "legacy-user", "credential", "legacy-user", hash],
  );
  await legacy.query(
    "INSERT INTO child_profiles (id,user_id,nickname) VALUES ($1,$2,$3)",
    ["legacy-child", "legacy-user", "原有孩子"],
  );
  await legacy.query(
    "INSERT INTO tool_states (id,profile_id,tool_key,schema_version,revision,payload) VALUES ($1,$2,$3,1,7,$4)",
    [
      "legacy-state",
      "legacy-child",
      "guwen",
      { "guwen-leyuan-read-v1": '["legacy-record"]' },
    ],
  );
  const before = (
    await legacy.query("SELECT to_jsonb(tool_states) AS state FROM tool_states")
  ).rows[0].state;
  for (let run = 0; run < 2; run++) {
    const upgrade = spawnSync(
      process.execPath,
      ["--import", "tsx", "scripts/migrate.ts"],
      {
        env: { ...process.env, DATABASE_URL: legacyUrl.href },
        encoding: "utf8",
      },
    );
    assert.equal(upgrade.status, 0, "populated legacy migration failed");
  }
  const upgraded = (
    await legacy.query(
      "SELECT email,email_verified,email_verification_exempt FROM users",
    )
  ).rows[0];
  assert.deepEqual(upgraded, {
    email: "legacy@example.test",
    email_verified: false,
    email_verification_exempt: true,
  });
  assert.deepEqual(
    (
      await legacy.query(
        "SELECT to_jsonb(tool_states) AS state FROM tool_states",
      )
    ).rows[0].state,
    before,
  );
  await legacy.end();
  const former = dbUrl;
  dbUrl = legacyUrl.href;
  await start("true", "disabled");
  status(
    await call(
      session(),
      "/api/auth/sign-in/email",
      { email: "LEGACY@EXAMPLE.TEST", password: params.password },
      "198.51.100.9",
    ),
    200,
  );
  await stop();
  dbUrl = former;
  results.push(
    "Populated original schema upgrade preserves child state/revision/password and false verification, normalizes email, grants ordinary compatibility; migration rerun is safe and legacy password works with true + disabled mail",
  );

  fs.writeFileSync(
    process.env.AUTH_TEST_OUTPUT || "../qa/registration-api-results.json",
    JSON.stringify(
      {
        status: "PASS",
        environment:
          "new isolated local PostgreSQL database, actual auth/API route handlers",
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ status: "PASS", results }, null, 2));
})()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await stop();
    if (client) await client.end();
  });
