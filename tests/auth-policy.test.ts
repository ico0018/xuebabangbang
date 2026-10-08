import { test } from "node:test";
import assert from "node:assert/strict";
import {
  requiresEmailVerification,
  normalizeEmail,
  hasVerifiedEmail,
} from "../lib/auth-policy";
import { safeReturnTo } from "../lib/auth-navigation";
test("verification defaults closed and only false opts out", () => {
  for (const value of ["true", "0", "FALSE", "", "invalid"])
    assert.equal(requiresEmailVerification(value), true);
  assert.equal(requiresEmailVerification("false"), false);
});
test("mailbox identity normalized without provider-specific alias merging", () => {
  assert.equal(
    normalizeEmail("  Parent+child@EXAMPLE.COM  "),
    "parent+child@example.com",
  );
  assert.equal(hasVerifiedEmail({ emailVerified: false }), false);
});
test("return navigation only permits portal and configured learning origins", () => {
  const origin = "http://localhost:8320",
    tools = ["http://localhost:8321/"];
  for (const value of [
    "https://evil.example/",
    "//evil.example/",
    "javascript:alert(1)",
    "/api/auth/sign-out",
    "/login",
    "http://user:password@localhost:8321/",
  ])
    assert.equal(safeReturnTo(value, origin, tools), origin + "/account");
  assert.equal(
    safeReturnTo("http://localhost:8321/practice.html", origin, tools),
    "http://localhost:8321/practice.html",
  );
});
