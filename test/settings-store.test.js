import assert from "node:assert/strict";
import test from "node:test";

import { createSettingsStore } from "../src/settings-store.js";

function createStorage(initial = {}) {
  const state = { ...initial };
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

test("Anthropic API key is stored locally without transformation", async () => {
  const storage = createStorage();
  const store = createSettingsStore({ storage });

  await store.setAnthropicApiKey("sk-ant-example");

  assert.equal(await store.getAnthropicApiKey(), "sk-ant-example");
  assert.equal(storage.state.anthropicApiKey, "sk-ant-example");
});

test("missing Anthropic API key returns an empty string", async () => {
  const store = createSettingsStore({ storage: createStorage() });

  assert.equal(await store.getAnthropicApiKey(), "");
});
