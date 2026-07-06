import assert from "node:assert/strict";
import test from "node:test";

import { createPropertyController } from "../src/property-controller.js";

function createElements() {
  const handlers = {};
  const select = {
    disabled: true,
    value: "",
    options: [],
    addEventListener(event, handler) {
      handlers[event] = handler;
    },
    replaceChildren(...options) {
      this.options = options;
    },
    change() {
      return handlers.change();
    }
  };
  const refreshButton = {
    disabled: true,
    hidden: true,
    addEventListener(event, handler) {
      handlers[event] = handler;
    },
    click() {
      return handlers.click();
    }
  };

  return {
    select,
    refreshButton,
    status: { textContent: "" }
  };
}

function createStore({ lastUsed = null, cache = {} } = {}) {
  return {
    lastUsed,
    cache: structuredClone(cache),
    async getLastUsedPropertyId() {
      return this.lastUsed;
    },
    async setLastUsedPropertyId(propertyId) {
      this.lastUsed = propertyId;
    },
    async getCachedMetadata(propertyId) {
      return this.cache[propertyId] ?? null;
    },
    async setCachedMetadata(propertyId, metadata) {
      this.cache[propertyId] = metadata;
    }
  };
}

const properties = [
  { id: "100", name: "Site One", accountName: "Account One" },
  { id: "200", name: "Site Two", accountName: "Account Two" }
];

const cachedMetadata = {
  dimensions: [{ apiName: "country" }],
  metrics: [{ apiName: "activeUsers" }],
  timeZone: "America/New_York",
  fetchedAt: 1234
};

test("initialization restores the last property and uses cached metadata", async () => {
  const elements = createElements();
  const store = createStore({ lastUsed: "200", cache: { "200": cachedMetadata } });
  let fetchCount = 0;
  const controller = createPropertyController({
    ...elements,
    store,
    async listProperties() {
      return properties;
    },
    async fetchMetadata() {
      fetchCount += 1;
      return cachedMetadata;
    },
    createOption(property) {
      return { value: property.id, textContent: property.name };
    }
  });

  await controller.initialize("token-value");

  assert.equal(elements.select.value, "200");
  assert.equal(elements.select.disabled, false);
  assert.equal(elements.refreshButton.hidden, false);
  assert.equal(fetchCount, 0);
  assert.match(elements.status.textContent, /1 dimension, 1 metric/);
  assert.match(elements.status.textContent, /America\/New_York/);
});

test("property change persists selection and fetches uncached metadata", async () => {
  const elements = createElements();
  const store = createStore({ cache: { "100": cachedMetadata } });
  const calls = [];
  const controller = createPropertyController({
    ...elements,
    store,
    async listProperties() {
      return properties;
    },
    async fetchMetadata(options) {
      calls.push(options);
      return { ...cachedMetadata, timeZone: "UTC" };
    },
    createOption(property) {
      return { value: property.id };
    }
  });
  await controller.initialize("token-value");

  elements.select.value = "200";
  await elements.select.change();

  assert.equal(store.lastUsed, "200");
  assert.deepEqual(calls, [{ propertyId: "200", token: "token-value" }]);
  assert.equal(store.cache["200"].timeZone, "UTC");
});

test("manual refresh bypasses cached metadata", async () => {
  const elements = createElements();
  const store = createStore({ cache: { "100": cachedMetadata } });
  let fetchCount = 0;
  const controller = createPropertyController({
    ...elements,
    store,
    async listProperties() {
      return [properties[0]];
    },
    async fetchMetadata() {
      fetchCount += 1;
      return cachedMetadata;
    },
    createOption(property) {
      return { value: property.id };
    }
  });
  await controller.initialize("token-value");

  await elements.refreshButton.click();

  assert.equal(fetchCount, 1);
});

test("property loading errors remain visible", async () => {
  const elements = createElements();
  const controller = createPropertyController({
    ...elements,
    store: createStore(),
    async listProperties() {
      throw new Error("GA4 API error (403): permission denied");
    },
    async fetchMetadata() {
      return cachedMetadata;
    },
    createOption(property) {
      return { value: property.id };
    }
  });

  await controller.initialize("token-value");

  assert.equal(
    elements.status.textContent,
    "GA4 API error (403): permission denied"
  );
  assert.equal(elements.select.disabled, true);
});
