import assert from "node:assert/strict";
import test from "node:test";

import { runFunnelReport } from "../src/funnel-report.js";

const dateRange = { startDate: "2026-06-01", endDate: "2026-06-30" };

function reportWithCount(count) {
  return { headers: ["activeUsers"], rows: [[String(count)]], rowCount: 1 };
}

test("funnel report runs one runReport call per step and computes drop-off between steps", async () => {
  const calls = [];
  const counts = [1000, 400, 100];
  const runReport = async (options) => {
    calls.push(options);
    return reportWithCount(counts[calls.length - 1]);
  };

  const steps = [
    { label: "Home page", dimensionFilter: { filter: { fieldName: "pagePath" } } },
    { label: "/joinmvp", dimensionFilter: { filter: { fieldName: "pagePath" } } },
    { label: "Outbound join click", dimensionFilter: { filter: { fieldName: "eventName" } } }
  ];

  const report = await runFunnelReport({
    propertyId: "100",
    steps,
    dateRange,
    token: "token",
    runReport
  });

  assert.equal(calls.length, 3);
  for (const call of calls) {
    assert.equal(call.propertyId, "100");
    assert.equal(call.token, "token");
    assert.deepEqual(call.request.dateRanges, [dateRange]);
    assert.deepEqual(call.request.metrics, [{ name: "activeUsers" }]);
  }

  assert.deepEqual(report.headers, ["Step", "Users", "Drop-off from previous step"]);
  assert.deepEqual(report.rows, [
    ["Home page", "1000", ""],
    ["/joinmvp", "400", "60.0%"],
    ["Outbound join click", "100", "75.0%"]
  ]);
  assert.equal(report.rowCount, 3);
});

test("a step with no results counts as zero and does not divide by zero on the next step", async () => {
  const runReport = async () => ({ headers: [], rows: [], rowCount: 0 });

  const report = await runFunnelReport({
    propertyId: "100",
    steps: [{ label: "Home page" }, { label: "/joinmvp" }],
    dateRange,
    token: "token",
    runReport
  });

  assert.deepEqual(report.rows, [
    ["Home page", "0", ""],
    ["/joinmvp", "0", ""]
  ]);
});

test("a step's dimensionFilter is only included in the request when provided", async () => {
  const calls = [];
  const runReport = async (options) => {
    calls.push(options);
    return reportWithCount(1);
  };

  await runFunnelReport({
    propertyId: "100",
    steps: [{ label: "Home page" }],
    dateRange,
    token: "token",
    runReport
  });

  assert.equal("dimensionFilter" in calls[0].request, false);
});
