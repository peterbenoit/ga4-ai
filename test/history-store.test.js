import assert from "node:assert/strict";
import test from "node:test";

import { createHistoryStore } from "../src/history-store.js";

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

test("history entries are added newest-first and capped", async () => {
  const storage = createStorage({
    queryHistory: Array.from({ length: 50 }, (_, index) => ({
      id: `old-${index}`,
      question: `Old ${index}`
    }))
  });
  const store = createHistoryStore({ storage, idFactory: () => "new-id", now: () => 123 });

  const entry = await store.add({
    question: "Users by country",
    request: { metrics: [{ name: "activeUsers" }] },
    answer: "United States led."
  });

  assert.deepEqual(entry, {
    id: "new-id",
    question: "Users by country",
    request: { metrics: [{ name: "activeUsers" }] },
    answer: "United States led.",
    timestamp: 123
  });
  assert.equal(storage.state.queryHistory.length, 50);
  assert.equal(storage.state.queryHistory[0].id, "new-id");
  assert.equal(storage.state.queryHistory.at(-1).id, "old-48");
});

test("history entries can be deleted individually or cleared", async () => {
  const storage = createStorage({
    queryHistory: [
      { id: "a", question: "A" },
      { id: "b", question: "B" }
    ]
  });
  const store = createHistoryStore({ storage });

  await store.delete("a");

  assert.deepEqual(await store.list(), [{ id: "b", question: "B" }]);

  await store.clear();

  assert.deepEqual(await store.list(), []);
});
