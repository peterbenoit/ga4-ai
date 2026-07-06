import assert from "node:assert/strict";
import test from "node:test";

import { createQueryController, todayInTimeZone } from "../src/query-controller.js";

function createElements() {
  const handlers = {};
  const form = {
    addEventListener(event, handler) {
      handlers[event] = handler;
    },
    submit() {
      return handlers.submit({ preventDefault() {} });
    }
  };
  const settingsButton = {
    hidden: true,
    addEventListener(event, handler) {
      handlers.settings = handler;
    },
    click() {
      return handlers.settings();
    }
  };

  return {
    form,
    input: { disabled: true, value: "" },
    submitButton: { disabled: true },
    settingsButton,
    status: { textContent: "" },
    output: { textContent: "", hidden: true }
  };
}

const metadata = {
  dimensions: [{ apiName: "country" }],
  metrics: [{ apiName: "activeUsers" }],
  timeZone: "America/New_York"
};

test("today is formatted in the property timezone", () => {
  const date = new Date("2026-07-07T02:30:00Z");

  assert.equal(todayInTimeZone(date, "America/New_York"), "2026-07-06");
});

test("missing API key surfaces settings action without calling Claude", async () => {
  const elements = createElements();
  let translateCalls = 0;
  const controller = createQueryController({
    ...elements,
    store: { async getAnthropicApiKey() { return ""; } },
    async translate() {
      translateCalls += 1;
    },
    openOptions() {}
  });
  controller.setMetadata(metadata);
  elements.input.value = "Users by country";

  await elements.form.submit();

  assert.equal(translateCalls, 0);
  assert.equal(elements.status.textContent, "Anthropic API key is not configured.");
  assert.equal(elements.settingsButton.hidden, false);
});

test("clarification outcome is shown as a follow-up question", async () => {
  const elements = createElements();
  const controller = createQueryController({
    ...elements,
    store: { async getAnthropicApiKey() { return "key"; } },
    async translate() {
      return { type: "clarification", question: "Which campaign?" };
    },
    openOptions() {}
  });
  controller.setMetadata(metadata);
  elements.input.value = "Did my campaign work?";

  await elements.form.submit();

  assert.equal(elements.status.textContent, "Clarification needed.");
  assert.equal(elements.output.textContent, "Which campaign?");
  assert.equal(elements.output.hidden, false);
});

test("valid translation displays the exact GA4 request", async () => {
  const elements = createElements();
  let options;
  const request = {
    metrics: [{ name: "activeUsers" }],
    dateRanges: [{ startDate: "2026-07-01", endDate: "2026-07-06" }]
  };
  const controller = createQueryController({
    ...elements,
    store: { async getAnthropicApiKey() { return "key"; } },
    async translate(value) {
      options = value;
      return { type: "query", request };
    },
    now: () => new Date("2026-07-07T02:30:00Z"),
    openOptions() {}
  });
  controller.setMetadata(metadata);
  elements.input.value = "Active users this month";

  await elements.form.submit();

  assert.equal(options.today, "2026-07-06");
  assert.equal(options.apiKey, "key");
  assert.equal(elements.status.textContent, "GA4 request ready.");
  assert.equal(elements.output.textContent, JSON.stringify(request, null, 2));
});

test("translation failures remain visible", async () => {
  const elements = createElements();
  const controller = createQueryController({
    ...elements,
    store: { async getAnthropicApiKey() { return "key"; } },
    async translate() {
      throw new Error("Anthropic API error (401): invalid x-api-key");
    },
    openOptions() {}
  });
  controller.setMetadata(metadata);
  elements.input.value = "Users";

  await elements.form.submit();

  assert.equal(
    elements.status.textContent,
    "Anthropic API error (401): invalid x-api-key"
  );
});
