import assert from "node:assert/strict";
import test from "node:test";

import { composeAnswer } from "../src/composer.js";

test("composeAnswer sends the question and report data to the fixed composer model", async () => {
  let options;
  const report = {
    headers: ["date", "activeUsers"],
    rows: [
      ["20260601", "120"],
      ["20260701", "150"]
    ],
    rowCount: 2,
    raw: {}
  };

  const result = await composeAnswer({
    question: "Did traffic grow this month?",
    report,
    apiKey: "key",
    async call(value) {
      options = value;
      return "  Yes, active users grew from 120 to 150.  ";
    }
  });

  assert.equal(options.apiKey, "key");
  assert.match(options.system, /only the report data provided/);
  assert.match(options.user, /Did traffic grow this month\?/);
  assert.match(options.user, /"activeUsers"/);
  assert.equal(result, "Yes, active users grew from 120 to 150.");
});

test("composeAnswer includes a date range mapping when the request compares multiple periods", async () => {
  let options;
  const report = {
    headers: ["dateRange", "activeUsers"],
    rows: [
      ["date_range_0", "150"],
      ["date_range_1", "120"]
    ],
    rowCount: 2,
    raw: {}
  };
  const request = {
    dimensions: [{ name: "dateRange" }],
    metrics: [{ name: "activeUsers" }],
    dateRanges: [
      { startDate: "2026-06-01", endDate: "2026-06-30" },
      { startDate: "2025-06-01", endDate: "2025-06-30" }
    ]
  };

  await composeAnswer({
    question: "How does this June compare to last June?",
    report,
    request,
    apiKey: "key",
    async call(value) {
      options = value;
      return "Active users grew from 120 to 150 year over year.";
    }
  });

  assert.match(options.user, /date_range_0 = 2026-06-01 to 2026-06-30/);
  assert.match(options.user, /date_range_1 = 2025-06-01 to 2025-06-30/);
});

test("composeAnswer propagates errors from the Claude call", async () => {
  await assert.rejects(
    composeAnswer({
      question: "Users today?",
      report: { headers: [], rows: [], rowCount: 0, raw: {} },
      apiKey: "key",
      async call() {
        throw new Error("Anthropic API error (401): invalid x-api-key");
      }
    }),
    /invalid x-api-key/
  );
});
