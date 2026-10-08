import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createParentChallenge,
  verifyParentChallenge,
  parentIsReady,
} from "../lib/parent-challenge";
const secret = "test-only-auth-secret-with-at-least-32-characters";
const now = Date.now();
const session = {
  id: "login-A",
  expiresAt: new Date(now + 14 * 86400000),
  parentUnlockedUntil: null,
};
function answer(question: string) {
  const words = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
  return words.indexOf(question[0]) * words.indexOf(question[4]);
}
test("financial numeral challenge gives three bounded choices with no marked answer", () => {
  for (let i = 0; i < 50; i++) {
    const challenge = createParentChallenge(session, secret, now);
    const correct = answer(challenge.question);
    assert.match(
      challenge.question,
      /^[贰叁肆伍陆柒捌玖] × [贰叁肆伍陆柒捌玖] = \?$/,
    );
    assert.equal(challenge.choices.length, 3);
    assert.equal(new Set(challenge.choices).size, 3);
    assert(challenge.choices.includes(correct));
    assert(
      verifyParentChallenge(session, challenge.challenge, correct, secret, now),
    );
    assert(
      !verifyParentChallenge(
        session,
        challenge.challenge,
        challenge.choices.find((v) => v !== correct)!,
        secret,
        now,
      ),
    );
    const value = JSON.parse(
      Buffer.from(challenge.challenge.split(".")[0], "base64url").toString(),
    );
    assert.equal(value.answer, undefined);
    assert.equal(value.correct, undefined);
    assert.equal(value.correctIndex, undefined);
  }
});
test("challenge rejects tampering, oversized input, foreign or expired sessions and wrong signing keys", () => {
  const challenge = createParentChallenge(session, secret, now),
    correct = answer(challenge.question);
  assert(
    !verifyParentChallenge(
      { ...session, id: "another-login" },
      challenge.challenge,
      correct,
      secret,
      now,
    ),
  );
  assert(
    !verifyParentChallenge(
      session,
      challenge.challenge + "x",
      correct,
      secret,
      now,
    ),
  );
  const parts = challenge.challenge.split(".");
  const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString());
  payload.left = 9;
  parts[0] = Buffer.from(JSON.stringify(payload)).toString("base64url");
  assert(
    !verifyParentChallenge(session, parts.join("."), correct, secret, now),
  );
  assert(
    !verifyParentChallenge(session, "x".repeat(1001), correct, secret, now),
  );
  assert(
    !verifyParentChallenge(
      session,
      challenge.challenge,
      correct,
      secret + "rotated",
      now,
    ),
  );
  assert(
    !verifyParentChallenge(
      session,
      challenge.challenge,
      correct,
      secret,
      now + 5 * 60000,
    ),
  );
  assert(
    !verifyParentChallenge(
      { ...session, expiresAt: new Date(now) },
      challenge.challenge,
      correct,
      secret,
      now,
    ),
  );
  assert(
    !verifyParentChallenge(session, challenge.challenge, NaN, secret, now),
  );
});
test("authorization lasts for this login including rolling session extension, not 15 minutes", () => {
  const unlocked = { ...session, parentUnlockedUntil: session.expiresAt };
  assert(parentIsReady(unlocked, now + 16 * 60000));
  assert(!parentIsReady(unlocked, session.expiresAt.getTime()));
  const extended = { ...unlocked, expiresAt: new Date(now + 28 * 86400000) };
  assert(parentIsReady(extended, now + 15 * 86400000));
  assert(!parentIsReady({ ...unlocked, parentUnlockedUntil: null }, now));
  assert(!parentIsReady(session, now));
});
test("challenges are randomized and cannot outlive the session", () => {
  const first = createParentChallenge(session, secret, now),
    second = createParentChallenge(session, secret, now);
  assert.notEqual(first.challenge, second.challenge);
  const short = { ...session, expiresAt: new Date(now + 1000) };
  const challenge = createParentChallenge(short, secret, now);
  assert(
    !verifyParentChallenge(
      short,
      challenge.challenge,
      answer(challenge.question),
      secret,
      now + 1000,
    ),
  );
  assert.throws(() => createParentChallenge(session, "weak", now));
});
