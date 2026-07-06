import assert from "node:assert/strict";
import test from "node:test";

import { resolvePresetRange } from "../src/date-range.js";

test("last7 spans the trailing 7 days inclusive of today", () => {
  assert.deepEqual(resolvePresetRange("last7", "2026-07-06"), {
    startDate: "2026-06-30",
    endDate: "2026-07-06"
  });
});

test("last30 spans the trailing 30 days inclusive of today", () => {
  assert.deepEqual(resolvePresetRange("last30", "2026-07-06"), {
    startDate: "2026-06-07",
    endDate: "2026-07-06"
  });
});

test("last90 spans the trailing 90 days inclusive of today", () => {
  assert.deepEqual(resolvePresetRange("last90", "2026-07-06"), {
    startDate: "2026-04-08",
    endDate: "2026-07-06"
  });
});

test("thisMonth spans the 1st of the current month through today", () => {
  assert.deepEqual(resolvePresetRange("thisMonth", "2026-07-06"), {
    startDate: "2026-07-01",
    endDate: "2026-07-06"
  });
});

test("lastMonth spans the full previous calendar month", () => {
  assert.deepEqual(resolvePresetRange("lastMonth", "2026-07-06"), {
    startDate: "2026-06-01",
    endDate: "2026-06-30"
  });
});

test("lastMonth crosses a year boundary correctly", () => {
  assert.deepEqual(resolvePresetRange("lastMonth", "2026-01-15"), {
    startDate: "2025-12-01",
    endDate: "2025-12-31"
  });
});

test("unknown or custom presets resolve to null", () => {
  assert.equal(resolvePresetRange("custom", "2026-07-06"), null);
  assert.equal(resolvePresetRange("", "2026-07-06"), null);
});
