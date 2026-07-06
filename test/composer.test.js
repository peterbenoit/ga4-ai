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
