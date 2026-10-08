import { test } from "node:test";
import assert from "node:assert/strict";
import { validatePayload } from "../lib/payload";
import { stateInput, requiresParent } from "../lib/policy";
const empty = {
  version: 1,
  user: {
    id: "nora",
    name: "Nora",
    stage: 1,
    preparationReminderNeeded: false,
  },
  tasks: [],
  sessions: [],
  plans: [],
  reflections: [],
  templates: [],
  scoringStartedOn: null,
};
test("tool-specific payload rejects malformed key maps, unparseable values and unsupported versions", () => {
  assert.throws(() => validatePayload("hanzi", { garbage: true }));
  assert.throws(() =>
    validatePayload("guwen", { "guwen-leyuan-read-v1": "{bad" }),
  );
  assert.throws(() =>
    validatePayload("hanzi", { "hanzi-practice-v3-test": "true" }),
  );
  assert.throws(() =>
    validatePayload("taskhelper", { version: 1, garbage: true }),
  );
  assert.equal(
    stateInput.safeParse({ revision: 0, schemaVersion: 2, payload: {} })
      .success,
    false,
  );
  assert.deepEqual(
    validatePayload("hanzi", {
      "hanzi-practice-v3-test": '{"mastered":["字"]}',
    }),
    { "hanzi-practice-v3-test": '{"mastered":["字"]}' },
  );
  assert.equal(validatePayload("taskhelper", empty).version, 1);
});
test("parent-only task definitions cannot be changed via reminder flag or scoring baseline", () => {
  const task = { id: "t", reminderPending: false };
  const before = { ...empty, tasks: [task], scoringStartedOn: "2026-01-01" };
  assert.equal(
    requiresParent("taskhelper", before, {
      ...before,
      tasks: [{ ...task, reminderPending: true }],
    }),
    true,
  );
  assert.equal(
    requiresParent("taskhelper", before, {
      ...before,
      scoringStartedOn: "2027-01-01",
    }),
    true,
  );
  const pending = { ...before, tasks: [{ ...task, reminderPending: true }] };
  assert.equal(
    requiresParent("taskhelper", pending, { ...pending, tasks: [task] }),
    true,
  );
  assert.equal(
    requiresParent("taskhelper", pending, {
      ...pending,
      tasks: [task],
      sessions: [
        { id: "new", taskId: "t", startedIndependently: false, quality: null },
      ],
    }),
    false,
  );
});
test("daily penalty can settle automatically but arbitrary changes need parent", () => {
  const task = { id: "t", deletedAt: null, reminderPending: false };
  const plan = {
    id: "p",
    date: "2026-01-01",
    taskIds: ["t"],
    dailyPenalty: null,
  };
  const before = {
    ...empty,
    tasks: [task],
    plans: [plan],
    scoringStartedOn: "2026-01-01",
  };
  assert.equal(
    requiresParent("taskhelper", before, {
      ...before,
      plans: [{ ...plan, dailyPenalty: -1 }],
    }),
    false,
  );
  assert.equal(
    requiresParent("taskhelper", before, {
      ...before,
      plans: [{ ...plan, dailyPenalty: 0 }],
    }),
    true,
  );
});

test("PostgreSQL JSONB key ordering does not change parent permissions", () => {
  const before = {
    ...empty,
    tasks: [
      {
        id: "t",
        title: "数学",
        nested: { alpha: 1, beta: 2 },
        reminderPending: false,
      },
    ],
    templates: [{ id: "template", title: "语文" }],
  };
  const after = {
    ...empty,
    tasks: [
      {
        reminderPending: false,
        nested: { beta: 2, alpha: 1 },
        title: "数学",
        id: "t",
      },
    ],
    templates: [{ title: "语文", id: "template" }],
  };
  assert.equal(requiresParent("taskhelper", before, after), false);
});
