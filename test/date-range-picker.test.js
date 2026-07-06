import assert from "node:assert/strict";
import test from "node:test";

import { createDateRangePicker } from "../src/date-range-picker.js";

function createHarness() {
  const handlers = {};
  const presetSelect = {
    value: "",
    addEventListener(event, handler) {
      handlers[event] = handler;
    }
  };
  const customFields = { hidden: true };
  const flatpickrCalls = [];
  const flatpickrFactory = (input, options) => {
    flatpickrCalls.push({ input, options });
  };

  return {
    presetSelect,
    customFields,
    startInput: {},
    endInput: {},
    flatpickrFactory,
    flatpickrCalls,
    changePreset(value) {
      presetSelect.value = value;
      handlers.change();
    }
  };
}

test("no preset selected means no explicit date range (falls back to NL inference)", () => {
  const h = createHarness();
  const picker = createDateRangePicker({ ...h, now: () => new Date("2026-07-06T12:00:00Z") });

  assert.equal(picker.getRange(), null);
});

test("selecting a preset resolves a concrete range without touching the custom inputs", () => {
  const h = createHarness();
  const picker = createDateRangePicker({ ...h, now: () => new Date("2026-07-06T12:00:00Z") });

  h.changePreset("last30");

  assert.deepEqual(picker.getRange(), { startDate: "2026-06-07", endDate: "2026-07-06" });
  assert.equal(h.customFields.hidden, true);
});

test("selecting custom reveals the date fields and waits for both dates before returning a range", () => {
  const h = createHarness();
  const picker = createDateRangePicker({ ...h, now: () => new Date("2026-07-06T12:00:00Z") });

  h.changePreset("custom");
  assert.equal(h.customFields.hidden, false);
  assert.equal(picker.getRange(), null);

  const startOnChange = h.flatpickrCalls[0].options.onChange;
  const endOnChange = h.flatpickrCalls[1].options.onChange;

  startOnChange([new Date("2026-06-01T00:00:00Z")]);
  assert.equal(picker.getRange(), null);

  endOnChange([new Date("2026-06-30T00:00:00Z")]);
  assert.deepEqual(picker.getRange(), { startDate: "2026-06-01", endDate: "2026-06-30" });
});
