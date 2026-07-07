import assert from "node:assert/strict";
import test from "node:test";

import { createPropertyStore } from "../src/property-store.js";

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

test("last-used property is persisted locally", async () => {
  const storage = createStorage();
  const store = createPropertyStore({ storage });

  await store.setLastUsedPropertyId("100");

  assert.equal(await store.getLastUsedPropertyId(), "100");
  assert.equal(storage.state.lastUsedPropertyId, "100");
});

test("metadata cache preserves entries for other properties", async () => {
  const storage = createStorage({
    propertyMetadataCache: { "100": { fetchedAt: 1 } }
  });
  const store = createPropertyStore({ storage });

  await store.setCachedMetadata("200", { fetchedAt: 2 });

  assert.deepEqual(await store.getCachedMetadata("100"), { fetchedAt: 1 });
  assert.deepEqual(await store.getCachedMetadata("200"), { fetchedAt: 2 });
  assert.deepEqual(storage.state.propertyMetadataCache, {
    "100": { fetchedAt: 1 },
    "200": { fetchedAt: 2 }
  });
});

test("missing metadata cache returns null", async () => {
  const store = createPropertyStore({ storage: createStorage() });

  assert.equal(await store.getCachedMetadata("100"), null);
});

test("event dictionary is empty by default", async () => {
  const store = createPropertyStore({ storage: createStorage() });

  assert.equal(await store.getEventDictionary("100"), "");
});

test("event dictionary preserves entries for other properties", async () => {
  const storage = createStorage({
    propertyEventDictionaries: { "100": "existing dictionary" }
  });
  const store = createPropertyStore({ storage });

  await store.setEventDictionary("200", "new dictionary");

  assert.equal(await store.getEventDictionary("100"), "existing dictionary");
  assert.equal(await store.getEventDictionary("200"), "new dictionary");
  assert.deepEqual(storage.state.propertyEventDictionaries, {
    "100": "existing dictionary",
    "200": "new dictionary"
  });
});
