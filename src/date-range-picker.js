import { resolvePresetRange } from "./date-range.js";

export function createDateRangePicker({
  presetSelect,
  customFields,
  startInput,
  endInput,
  flatpickrFactory,
  now = () => new Date()
}) {
  let customRange = null;

  function todayIso() {
    return now().toISOString().slice(0, 10);
  }

  function syncCustomVisibility() {
    customFields.hidden = presetSelect.value !== "custom";
  }

  flatpickrFactory(startInput, {
    dateFormat: "Y-m-d",
    onChange([date]) {
      customRange = { ...customRange, startDate: date?.toISOString().slice(0, 10) ?? null };
    }
  });

  flatpickrFactory(endInput, {
    dateFormat: "Y-m-d",
    onChange([date]) {
      customRange = { ...customRange, endDate: date?.toISOString().slice(0, 10) ?? null };
    }
  });

  presetSelect.addEventListener("change", syncCustomVisibility);
  syncCustomVisibility();

  return {
    getRange() {
      if (presetSelect.value === "") {
        return null;
      }

      if (presetSelect.value === "custom") {
        return customRange?.startDate && customRange?.endDate ? customRange : null;
      }

      return resolvePresetRange(presetSelect.value, todayIso());
    }
  };
}
