import assert from "node:assert/strict";
import test from "node:test";

import { TRANSLATOR_MODEL } from "../src/config.js";
import { translateQuestion } from "../src/translator.js";

const metadata = {
  dimensions: [{ apiName: "country", uiName: "Country" }],
  metrics: [{ apiName: "activeUsers", uiName: "Active users" }],
  timeZone: "America/New_York"
};

const validRequest = {
  dimensions: [{ name: "country" }],
  metrics: [{ name: "activeUsers" }],
  dateRanges: [{ startDate: "2026-06-01", endDate: "2026-06-30" }]
};

test("translator passes actual date, timezone, metadata, and fixed model to Claude", async () => {
  const calls = [];
  const call = async (options) => {
    calls.push(options);
    return JSON.stringify({ type: "query", request: validRequest });
  };

  const result = await translateQuestion({
    question: "Users by country last month",
    metadata,
    today: "2026-07-06",
    apiKey: "key",
    call
  });

  assert.equal(calls[0].model, TRANSLATOR_MODEL);
  assert.match(calls[0].system, /2026-07-06/);
  assert.match(calls[0].system, /America\/New_York/);
  assert.match(calls[0].system, /activeUsers/);
  assert.match(calls[0].user, /Users by country last month/);
  assert.deepEqual(result, { type: "query", request: validRequest });
});

test("an explicit UI-selected date range is passed through and Claude is told not to infer dates", async () => {
  const calls = [];
  const request = {
    dimensions: [],
    metrics: [{ name: "activeUsers" }],
    dateRanges: [{ startDate: "2026-06-07", endDate: "2026-07-06" }]
  };
  const call = async (options) => {
    calls.push(options);
    return JSON.stringify({ type: "query", request });
  };

  const result = await translateQuestion({
    question: "How many active users?",
    metadata,
    today: "2026-07-06",
    dateRange: { startDate: "2026-06-07", endDate: "2026-07-06" },
    apiKey: "key",
    call
  });

  assert.match(calls[0].system, /2026-06-07 to 2026-07-06/);
  assert.match(calls[0].system, /never infer or ask about dates/);
  assert.deepEqual(result, { type: "query", request });
});

test("translator strips empty filter expressions before returning the request", async () => {
  const request = {
    dimensions: [],
    metrics: [{ name: "activeUsers" }],
    dateRanges: [{ startDate: "2026-06-07", endDate: "2026-07-06" }],
    dimensionFilter: {},
    metricFilter: {},
    limit: 100
  };
  const call = async () => JSON.stringify({ type: "query", request });

  const result = await translateQuestion({
    question: "How many active users did we have last 30 days?",
    metadata,
    today: "2026-07-06",
    apiKey: "key",
    call
  });

  assert.deepEqual(result, {
    type: "query",
    request: {
      dimensions: [],
      metrics: [{ name: "activeUsers" }],
      dateRanges: [{ startDate: "2026-06-07", endDate: "2026-07-06" }],
      limit: 100
    }
  });
});

test("translator returns a distinct clarification outcome", async () => {
  const call = async () => JSON.stringify({
    type: "clarification",
    question: "Which campaign should I analyze?"
  });

  const result = await translateQuestion({
    question: "Did my campaign work?",
    metadata,
    today: "2026-07-06",
    apiKey: "key",
    call
  });

  assert.deepEqual(result, {
    type: "clarification",
    question: "Which campaign should I analyze?"
  });
});

test("invalid metadata fields trigger one retry with validation errors", async () => {
  const calls = [];
  const responses = [
    JSON.stringify({
      type: "query",
      request: { ...validRequest, metrics: [{ name: "visitors" }] }
    }),
    JSON.stringify({ type: "query", request: validRequest })
  ];
  const call = async (options) => {
    calls.push(options);
    return responses.shift();
  };

  const result = await translateQuestion({
    question: "Users by country",
    metadata,
    today: "2026-07-06",
    apiKey: "key",
    call
  });

  assert.equal(calls.length, 2);
  assert.match(calls[1].user, /Unknown metric: visitors/);
  assert.deepEqual(result.request, validRequest);
});

test("second invalid response fails visibly instead of guessing", async () => {
  const call = async () => JSON.stringify({
    type: "query",
    request: { ...validRequest, dimensions: [{ name: "planet" }] }
  });

  await assert.rejects(
    translateQuestion({
      question: "Users from Mars",
      metadata,
      today: "2026-07-06",
      apiKey: "key",
      call
    }),
    /Claude returned an invalid GA4 request after retry: Unknown dimension: planet/
  );
});

test("malformed Claude JSON retries once then fails visibly", async () => {
  let callCount = 0;
  const call = async () => {
    callCount += 1;
    return "not json";
  };

  await assert.rejects(
    translateQuestion({
      question: "Users",
      metadata,
      today: "2026-07-06",
      apiKey: "key",
      call
    }),
    /Claude returned malformed JSON after retry/
  );
  assert.equal(callCount, 2);
});
