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
      question: `Old ${index}`,
      pinned: false,
      name: null
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
    timestamp: 123,
    pinned: false,
    name: null
  });
  assert.equal(storage.state.queryHistory.length, 50);
  assert.equal(storage.state.queryHistory[0].id, "new-id");
  assert.equal(storage.state.queryHistory.at(-1).id, "old-48");
});

test("pinned entries are never evicted by the unpinned cap", async () => {
  const storage = createStorage({
    queryHistory: [
      { id: "pinned-1", question: "Monthly traffic", pinned: true, name: "Monthly traffic" },
      ...Array.from({ length: 50 }, (_, index) => ({
        id: `old-${index}`,
        question: `Old ${index}`,
        pinned: false,
        name: null
      }))
    ]
  });
  const store = createHistoryStore({ storage, idFactory: () => "new-id", now: () => 1 });

  await store.add({ question: "New question", request: {}, answer: "answer" });

  const entries = storage.state.queryHistory;
  assert.ok(entries.some((entry) => entry.id === "pinned-1"));
  assert.equal(entries.filter((entry) => !entry.pinned).length, 50);
});

test("entries can be pinned with a custom name, unpinned, and renamed", async () => {
  const storage = createStorage({
    queryHistory: [
      { id: "a", question: "Users by country", request: {}, pinned: false, name: null }
    ]
  });
  const store = createHistoryStore({ storage });

  await store.pin("a", "  Monthly geo report  ");
  let entries = await store.list();
  assert.equal(entries[0].pinned, true);
  assert.equal(entries[0].name, "Monthly geo report");

  await store.rename("a", "Renamed report");
  entries = await store.list();
  assert.equal(entries[0].name, "Renamed report");

  await store.rename("a", "   ");
  entries = await store.list();
  assert.equal(entries[0].name, "Renamed report");

  await store.unpin("a");
  entries = await store.list();
  assert.equal(entries[0].pinned, false);
  assert.equal(entries[0].name, null);
});

test("pinning with no name falls back to the question", async () => {
  const storage = createStorage({
    queryHistory: [{ id: "a", question: "Users by country", request: {}, pinned: false, name: null }]
  });
  const store = createHistoryStore({ storage });

  await store.pin("a", "");
  const entries = await store.list();
  assert.equal(entries[0].name, "Users by country");
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
