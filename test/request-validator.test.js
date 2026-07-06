import assert from "node:assert/strict";
import test from "node:test";

import { validateReportRequest } from "../src/request-validator.js";

const metadata = {
  dimensions: [{ apiName: "country" }, { apiName: "date" }],
  metrics: [{ apiName: "activeUsers" }]
};

test("valid report request passes metadata validation", () => {
  const errors = validateReportRequest({
    dimensions: [{ name: "country" }],
    metrics: [{ name: "activeUsers" }],
    dateRanges: [{ startDate: "2026-06-01", endDate: "2026-06-30" }],
    dimensionFilter: { filter: { fieldName: "country", stringFilter: { value: "US" } } }
  }, metadata);

  assert.deepEqual(errors, []);
});

test("unknown dimensions and metrics are rejected", () => {
  const errors = validateReportRequest({
    dimensions: [{ name: "planet" }],
    metrics: [{ name: "visitors" }],
    dateRanges: [{ startDate: "2026-06-01", endDate: "2026-06-30" }]
  }, metadata);

  assert.deepEqual(errors, [
    "Unknown dimension: planet",
    "Unknown metric: visitors"
  ]);
});

test("nested filter field names are validated against the correct metadata type", () => {
  const errors = validateReportRequest({
    dimensions: [{ name: "date" }],
    metrics: [{ name: "activeUsers" }],
    dateRanges: [{ startDate: "2026-06-01", endDate: "2026-06-30" }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          { filter: { fieldName: "campaignName", stringFilter: { value: "Summer" } } }
        ]
      }
    },
    metricFilter: { filter: { fieldName: "sessions", numericFilter: {} } }
  }, metadata);

  assert.deepEqual(errors, [
    "Unknown dimension filter field: campaignName",
    "Unknown metric filter field: sessions"
  ]);
});

test("missing report essentials are rejected", () => {
  const errors = validateReportRequest({}, metadata);

  assert.deepEqual(errors, [
    "At least one metric is required.",
    "At least one date range is required."
  ]);
});
