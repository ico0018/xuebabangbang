import {
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
const numerals = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
const lifetime = 5 * 60 * 1000;
const bodySchema = z
  .object({
    v: z.literal(1),
    left: z.number().int().min(2).max(9),
    right: z.number().int().min(2).max(9),
    choices: z.array(z.number().int().min(1).max(100)).length(3),
    expiresAt: z.number().int().positive(),
    nonce: z.string().regex(/^[a-f0-9]{32}$/),
  })
  .strict();
export type ParentSession = {
  id: string;
  expiresAt: Date;
  parentUnlockedUntil: Date | null;
};
export function parentIsReady(session: ParentSession, now = Date.now()) {
  return (
    session.parentUnlockedUntil !== null && session.expiresAt.getTime() > now
  );
}
function signature(payload: string, sessionId: string, secret: string) {
  if (secret.length < 32)
    throw new Error("A configured authentication secret is required.");
  return createHmac("sha256", secret)
    .update("xbb-parent-v1\0" + sessionId + "\0" + payload)
    .digest();
}
export function createParentChallenge(
  session: ParentSession,
  secret: string,
  now = Date.now(),
) {
  if (session.expiresAt.getTime() <= now) throw new Error("Expired session");
  const left = randomInt(2, 10),
    right = randomInt(2, 10),
    correct = left * right;
  const choices = new Set([correct]);
  while (choices.size < 3)
    choices.add(
      randomInt(Math.max(1, correct - 9), Math.min(100, correct + 9) + 1),
    );
  const shuffled = [...choices];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const value = {
    v: 1,
    left,
    right,
    choices: shuffled,
    expiresAt: Math.min(now + lifetime, session.expiresAt.getTime()),
    nonce: randomBytes(16).toString("hex"),
  };
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return {
    challenge:
      payload +
      "." +
      signature(payload, session.id, secret).toString("base64url"),
    question: numerals[left] + " × " + numerals[right] + " = ?",
    choices: shuffled,
  };
}
export function verifyParentChallenge(
  session: ParentSession,
  challenge: string,
  answer: number,
  secret: string,
  now = Date.now(),
) {
  if (
    challenge.length > 1000 ||
    session.expiresAt.getTime() <= now ||
    !Number.isInteger(answer)
  )
    return false;
  const parts = challenge.split(".");
  if (parts.length !== 2 || !parts.every((p) => /^[A-Za-z0-9_-]+$/.test(p)))
    return false;
  const expected = signature(parts[0], session.id, secret),
    provided = Buffer.from(parts[1], "base64url");
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  )
    return false;
  try {
    const value = bodySchema.parse(
      JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")),
    );
    return (
      value.expiresAt > now &&
      value.expiresAt <= now + lifetime &&
      value.expiresAt <= session.expiresAt.getTime() &&
      new Set(value.choices).size === 3 &&
      value.choices.includes(answer) &&
      value.left * value.right === answer
    );
  } catch {
    return false;
  }
}
