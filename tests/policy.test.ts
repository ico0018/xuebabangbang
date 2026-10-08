import { test } from "node:test";
import assert from "node:assert/strict";
import {
  requiresParent,
  canOperate,
  profileInput,
  stateInput,
} from "../lib/policy";
import { validateAuthUrl } from "../lib/config";
const base = {
  user: {
    id: "kid",
    name: "小朋友",
    stage: 1,
    preparationReminderNeeded: false,
  },
  tasks: [],
  templates: [],
  plans: [],
  sessions: [],
  scoringStartedOn: null,
};
test("children can sync timing and preparation changes", () => {
  assert.equal(
    requiresParent("taskhelper", base, {
      ...base,
      user: { ...base.user, preparationReminderNeeded: true },
      sessions: [{ id: "s", actualMinutes: 4, quality: null }],
      plans: [{ id: "p", taskIds: [], dailyPenalty: null, completionBonus: 2 }],
    }),
    false,
  );
});
test("sensitive task, template, plan and quality changes need parent", () => {
  for (const next of [
    { ...base, tasks: [{ id: "t" }] },
    { ...base, templates: [{ id: "t" }] },
    { ...base, plans: [{ id: "p", taskIds: ["t"] }] },
    { ...base, sessions: [{ id: "s", quality: "all_correct" }] },
    { ...base, user: { ...base.user, name: "changed" } },
  ])
    assert.equal(requiresParent("taskhelper", base, next), true);
});
test("first nonempty task import needs parent but empty state can sync", () => {
  assert.equal(requiresParent("taskhelper", null, base), false);
  assert.equal(
    requiresParent("taskhelper", null, { ...base, tasks: [{ id: "t" }] }),
    true,
  );
});
test("permissions deny explicit active grants, expired denies do not apply", () => {
  assert.equal(
    canOperate(
      [
        {
          toolKey: "*",
          operation: "state.write",
          allowed: false,
          expiresAt: null,
        },
      ],
      "guwen",
      "state.write",
    ),
    false,
  );
  assert.equal(
    canOperate(
      [
        {
          toolKey: "guwen",
          operation: "state.read",
          allowed: false,
          expiresAt: new Date(0),
        },
      ],
      "guwen",
      "state.read",
    ),
    true,
  );
});
test("strict profile schema excludes unnecessary child information", () => {
  assert.equal(
    profileInput.safeParse({ nickname: "Nora", school: "Private" }).success,
    false,
  );
  assert.equal(
    stateInput.safeParse({ revision: -1, schemaVersion: 1, payload: {} })
      .success,
    false,
  );
});
test("remote auth enforces HTTPS and scoped cookie domain", () => {
  assert.throws(() => validateAuthUrl("http://example.com"));
  assert.throws(() => validateAuthUrl("https://example.com", "evil.com"));
  assert.equal(
    validateAuthUrl("http://localhost:8320"),
    "http://localhost:8320",
  );
  assert.equal(
    validateAuthUrl("https://api.xuebabangbang.cn", "xuebabangbang.cn"),
    "https://api.xuebabangbang.cn",
  );
});

test("public IP authentication accepts HTTPS with host-only cookies and rejects insecure or domain cookies", () => {
  const ip = "134.175.136.31";
  assert.equal(validateAuthUrl("https://" + ip), "https://" + ip);
  assert.throws(() => validateAuthUrl("http://" + ip));
  assert.throws(() => validateAuthUrl("https://" + ip, ip));
  assert.throws(() => validateAuthUrl("https://" + ip, "xuebabangbang.cn"));
});

test("public preview TLS template rejects unknown Host before serving or proxying", async () => {
  const { readFile } = await import("node:fs/promises");
  const template = await readFile(
    new URL("../ops/nginx.public-ip.conf", import.meta.url),
    "utf8",
  );
  const tls = template.slice(template.indexOf("listen 443 ssl;"));
  const guard = tls.indexOf('if ($host != "134.175.136.31") { return 421; }');
  assert(guard > 0);
  assert(guard < tls.indexOf("location = /hanzi/parent.html"));
  assert(guard < tls.indexOf("proxy_pass"));
});
