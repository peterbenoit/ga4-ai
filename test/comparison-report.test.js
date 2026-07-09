import assert from "node:assert/strict";
import test from "node:test";

import { runComparisonReport } from "../src/comparison-report.js";

const dateRange = { startDate: "2026-06-01", endDate: "2026-06-30" };

test("runComparisonReport runs one runReport call per segment and assembles a single labeled table", async () => {
  const calls = [];
  const resultsBySegment = [
    { headers: ["sessions", "engagementRate"], rows: [["1200", "0.45"]], rowCount: 1 },
    { headers: ["sessions", "engagementRate"], rows: [["800", "0.62"]], rowCount: 1 }
  ];

  const runReport = async (options) => {
    calls.push(options);
    return resultsBySegment[calls.length - 1];
  };

  const segments = [
    {
      label: "Mobile",
      dimensionFilter: { filter: { fieldName: "deviceCategory", stringFilter: { matchType: "EXACT", value: "mobile" } } }
    },
    {
      label: "Desktop",
      dimensionFilter: { filter: { fieldName: "deviceCategory", stringFilter: { matchType: "EXACT", value: "desktop" } } }
    }
  ];

  const report = await runComparisonReport({
    propertyId: "100",
    metrics: ["sessions", "engagementRate"],
    segments,
    dateRange,
    token: "token",
    runReport
  });

  assert.equal(calls.length, 2);
  for (const [index, call] of calls.entries()) {
    assert.equal(call.propertyId, "100");
    assert.equal(call.token, "token");
    assert.deepEqual(call.request.dateRanges, [dateRange]);
    assert.deepEqual(call.request.metrics, [{ name: "sessions" }, { name: "engagementRate" }]);
    assert.deepEqual(call.request.dimensionFilter, segments[index].dimensionFilter);
  }

  assert.deepEqual(report.headers, ["Segment", "sessions", "engagementRate"]);
  assert.deepEqual(report.rows, [
    ["Mobile", "1200", "0.45"],
    ["Desktop", "800", "0.62"]
  ]);
  assert.equal(report.rowCount, 2);
});

test("runComparisonReport fills a segment with no matching rows as zero instead of throwing", async () => {
  const runReport = async () => ({ headers: [], rows: [], rowCount: 0 });

  const report = await runComparisonReport({
    propertyId: "100",
    metrics: ["sessions"],
    segments: [
      { label: "New", dimensionFilter: { filter: { fieldName: "newVsReturning", stringFilter: { matchType: "EXACT", value: "new" } } } },
      { label: "Returning", dimensionFilter: { filter: { fieldName: "newVsReturning", stringFilter: { matchType: "EXACT", value: "returning" } } } }
    ],
    dateRange,
    token: "token",
    runReport
  });

  assert.deepEqual(report.rows, [["New", "0"], ["Returning", "0"]]);
});
