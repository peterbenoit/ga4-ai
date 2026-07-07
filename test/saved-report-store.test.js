import assert from "node:assert/strict";
import test from "node:test";

import { createSavedReportStore } from "../src/saved-report-store.js";

function createStorage(initial = {}) {
  const state = structuredClone(initial);

  return {
    state,
    async get(key) {
      return { [key]: state[key] };
    },
    async set(values) {
      Object.assign(state, values);
    }
  };
}

test("saved reports are added newest-first, defaulting the name to the question", async () => {
  const storage = createStorage({ savedReports: [] });
  const store = createSavedReportStore({ storage, idFactory: () => "new-id", now: () => 123 });

  const entry = await store.add({
    name: "",
    question: "Users by country last 7 days",
    request: { metrics: [{ name: "activeUsers" }] }
  });

  assert.deepEqual(entry, {
    id: "new-id",
    name: "Users by country last 7 days",
    question: "Users by country last 7 days",
    request: { metrics: [{ name: "activeUsers" }] },
    timestamp: 123
  });
  assert.equal(storage.state.savedReports.length, 1);
  assert.equal(storage.state.savedReports[0].id, "new-id");
});

test("saved reports keep an explicit name when one is given", async () => {
  const storage = createStorage({ savedReports: [] });
  const store = createSavedReportStore({ storage, idFactory: () => "new-id" });

  const entry = await store.add({
    name: "  Weekly traffic  ",
    question: "How many users last week?",
    request: {}
  });

  assert.equal(entry.name, "Weekly traffic");
});

test("saved reports can be renamed, deleted individually, or cleared", async () => {
  const storage = createStorage({
    savedReports: [
      { id: "a", name: "A", question: "A?", request: {} },
      { id: "b", name: "B", question: "B?", request: {} }
    ]
  });
  const store = createSavedReportStore({ storage });

  await store.rename("a", "Renamed A");
  assert.equal((await store.list()).find((entry) => entry.id === "a").name, "Renamed A");

  await store.rename("a", "   ");
  assert.equal((await store.list()).find((entry) => entry.id === "a").name, "Renamed A");

  await store.delete("a");
  assert.deepEqual(
    (await store.list()).map((entry) => entry.id),
    ["b"]
  );

  await store.clear();
  assert.deepEqual(await store.list(), []);
});
