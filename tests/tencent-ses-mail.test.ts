import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readSesMailConfig,
  buildSesMail,
  sendSesMail,
} from "../lib/tencent-ses-mail";
const env = {
  SES_SECRET_ID: "test-id",
  SES_SECRET_KEY: "test-key",
  SES_REGION: "ap-guangzhou",
  MAIL_FROM: "noreply@mail.example.test",
  BETTER_AUTH_URL: "https://portal.example.test",
  TRUSTED_ORIGINS: "https://portal.example.test,https://tool.example.test",
  SES_VERIFY_TEMPLATE_ID: "101",
  SES_RESET_TEMPLATE_ID: "102",
};
const config = readSesMailConfig(env)!;
const recipient = "parent@example.test";
const verify = "验证学霸帮帮邮箱",
  reset = "重置学霸帮帮密码";
const verifyUrl =
  env.BETTER_AUTH_URL +
  "/api/auth/verify-email?token=one-time-test&callbackURL=" +
  encodeURIComponent(env.BETTER_AUTH_URL + "/account");
const resetUrl =
  env.BETTER_AUTH_URL +
  "/api/auth/reset-password/one-time-test?callbackURL=" +
  encodeURIComponent(env.BETTER_AUTH_URL + "/reset-password");
test("SES configuration fails closed with missing keys, templates, sender or HTTPS origin", () => {
  assert.ok(config);
  for (const field of [
    "SES_SECRET_ID",
    "SES_SECRET_KEY",
    "MAIL_FROM",
    "BETTER_AUTH_URL",
    "SES_VERIFY_TEMPLATE_ID",
    "SES_RESET_TEMPLATE_ID",
  ])
    assert.equal(readSesMailConfig({ ...env, [field]: "" }), undefined);
  for (const value of ["0", "-1", "1.5", "1e3", "9007199254740992"])
    assert.equal(
      readSesMailConfig({ ...env, SES_VERIFY_TEMPLATE_ID: value }),
      undefined,
    );
  for (const value of [
    "http://portal.example.test",
    "https://user:pass@portal.example.test",
    "https://portal.example.test/other",
  ])
    assert.equal(
      readSesMailConfig({ ...env, BETTER_AUTH_URL: value }),
      undefined,
    );
  assert.equal(
    readSesMailConfig({ ...env, SES_REGION: "ap-unknown" }),
    undefined,
  );
  assert.equal(
    readSesMailConfig({
      ...env,
      MAIL_FROM: "One <a@example.test>, b@example.test",
    }),
    undefined,
  );
});
test("SES messages select the correct approved template and a single recipient", () => {
  for (const [subject, url, id] of [
    [verify, verifyUrl, 101],
    [reset, resetUrl, 102],
  ] as const) {
    const message = buildSesMail(config, recipient, subject, url);
    assert.deepEqual(message.Destination, [recipient]);
    assert.equal(message.Template?.TemplateID, id);
    assert.equal(message.TriggerType, 1);
    const data = JSON.parse(message.Template!.TemplateData);
    assert.equal(config.origin + data.path, url);
    assert.ok(!JSON.stringify(message).includes("test-key"));
    assert.equal(message.Simple, undefined);
  }
});
test("SES rejects foreign links, userinfo, wrong auth paths and unsafe callbacks", () => {
  for (const url of [
    "https://attacker.example/api/auth/verify-email?token=x",
    "http://portal.example.test/api/auth/verify-email?token=x",
    "https://user:pass@portal.example.test/api/auth/verify-email?token=x",
    env.BETTER_AUTH_URL + "/api/auth/verify-email",
    env.BETTER_AUTH_URL + "/other?token=x",
    verifyUrl + "#secret",
    env.BETTER_AUTH_URL +
      "/api/auth/verify-email?token=x&callbackURL=https://attacker.example/",
    env.BETTER_AUTH_URL +
      "/api/auth/verify-email?token=x&callbackURL=javascript:alert(1)",
  ])
    assert.throws(() => buildSesMail(config, recipient, verify, url));
  assert.throws(() => buildSesMail(config, recipient, reset, verifyUrl));
  assert.throws(() =>
    buildSesMail(config, "a@example.test,b@example.test", verify, verifyUrl),
  );
  assert.throws(() =>
    buildSesMail(config, recipient, "unapproved subject", verifyUrl),
  );
  assert.doesNotThrow(() =>
    buildSesMail(
      config,
      recipient,
      verify,
      env.BETTER_AUTH_URL +
        "/api/auth/verify-email?token=x&callbackURL=" +
        encodeURIComponent("https://tool.example.test/practice"),
    ),
  );
});
test("SES acceptance required; provider failures never expose keys or links", async () => {
  const request = buildSesMail(config, recipient, verify, verifyUrl);
  await sendSesMail(config, request, {
    async SendEmail() {
      return { MessageId: "accepted-test" };
    },
  });
  for (const sender of [
    {
      async SendEmail() {
        return {};
      },
    },
    {
      async SendEmail() {
        throw new Error(config.secretKey + " " + verifyUrl);
      },
    },
  ])
    await assert.rejects(
      sendSesMail(config, request, sender),
      (error) =>
        error instanceof Error &&
        error.message === "邮件发送暂时失败，请稍后重试。" &&
        !error.message.includes(config.secretKey),
    );
});
