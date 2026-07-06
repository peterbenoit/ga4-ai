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
    output: { textContent: "", hidden: true },
    answer: { textContent: "", hidden: true }
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
  controller.setContext({ metadata, propertyId: "100", token: "google-token" });
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
  controller.setContext({ metadata, propertyId: "100", token: "google-token" });
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
  const report = {
    headers: ["activeUsers"],
    rows: [["12"]],
    rowCount: 1,
    raw: {}
  };
  const reportCalls = [];
  const renderedReports = [];
  const controller = createQueryController({
    ...elements,
    store: { async getAnthropicApiKey() { return "key"; } },
    async translate(value) {
      options = value;
      return { type: "query", request };
    },
    async runReport(value) {
      reportCalls.push(value);
      return report;
    },
    renderReport(value) {
      renderedReports.push(value);
    },
    async compose(value) {
      composeCalls.push(value);
      return "12 active users in the last 5 days.";
    },
    now: () => new Date("2026-07-07T02:30:00Z"),
    openOptions() {}
  });
  const composeCalls = [];
  controller.setContext({ metadata, propertyId: "100", token: "google-token" });
  elements.input.value = "Active users this month";

  await elements.form.submit();

  assert.equal(options.today, "2026-07-06");
  assert.equal(options.apiKey, "key");
  assert.deepEqual(reportCalls, [{
    propertyId: "100",
    request,
    token: "google-token"
  }]);
  assert.deepEqual(renderedReports, [report]);
  assert.deepEqual(composeCalls, [{
    question: "Active users this month",
    report,
    request,
    apiKey: "key"
  }]);
  assert.equal(elements.answer.textContent, "12 active users in the last 5 days.");
  assert.equal(elements.answer.hidden, false);
  assert.equal(elements.status.textContent, "Report returned 1 row.");
  assert.equal(elements.output.textContent, JSON.stringify(request, null, 2));
});

test("empty report is a distinct successful outcome", async () => {
  const elements = createElements();
  const renderedReports = [];
  const controller = createQueryController({
    ...elements,
    store: { async getAnthropicApiKey() { return "key"; } },
    async translate() {
      return { type: "query", request: { metrics: [{ name: "activeUsers" }] } };
    },
    async runReport() {
      return { headers: ["activeUsers"], rows: [], rowCount: 0, raw: {} };
    },
    renderReport(value) {
      renderedReports.push(value);
    },
    openOptions() {}
  });
  controller.setContext({ metadata, propertyId: "100", token: "google-token" });
  elements.input.value = "Users from Mars";

  await elements.form.submit();

  assert.equal(elements.status.textContent, "No data matches this request.");
  assert.equal(renderedReports[0].rowCount, 0);
  assert.equal(elements.answer.hidden, true);
});

test("answer composition failure surfaces without losing the rendered report", async () => {
  const elements = createElements();
  const renderedReports = [];
  const report = { headers: ["activeUsers"], rows: [["12"]], rowCount: 1, raw: {} };
  const controller = createQueryController({
    ...elements,
    store: { async getAnthropicApiKey() { return "key"; } },
    async translate() {
      return { type: "query", request: { metrics: [{ name: "activeUsers" }] } };
    },
    async runReport() {
      return report;
    },
    renderReport(value) {
      renderedReports.push(value);
    },
    async compose() {
      throw new Error("Anthropic API error (529): overloaded");
    },
    openOptions() {}
  });
  controller.setContext({ metadata, propertyId: "100", token: "google-token" });
  elements.input.value = "Active users this month";

  await elements.form.submit();

  assert.deepEqual(renderedReports, [report]);
  assert.equal(elements.answer.hidden, true);
  assert.equal(elements.status.textContent, "Anthropic API error (529): overloaded");
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
  controller.setContext({ metadata, propertyId: "100", token: "google-token" });
  elements.input.value = "Users";

  await elements.form.submit();

  assert.equal(
    elements.status.textContent,
    "Anthropic API error (401): invalid x-api-key"
  );
});
