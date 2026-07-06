function parseISODate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatISODate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function startOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export const DATE_RANGE_PRESETS = ["last7", "last30", "last90", "thisMonth", "lastMonth"];

export function resolvePresetRange(preset, todayIso) {
  const today = parseISODate(todayIso);

  switch (preset) {
    case "last7":
      return { startDate: formatISODate(addDays(today, -6)), endDate: formatISODate(today) };
    case "last30":
      return { startDate: formatISODate(addDays(today, -29)), endDate: formatISODate(today) };
    case "last90":
      return { startDate: formatISODate(addDays(today, -89)), endDate: formatISODate(today) };
    case "thisMonth":
      return { startDate: formatISODate(startOfMonth(today)), endDate: formatISODate(today) };
    case "lastMonth": {
      const lastDayOfPrevMonth = addDays(startOfMonth(today), -1);
      return {
        startDate: formatISODate(startOfMonth(lastDayOfPrevMonth)),
        endDate: formatISODate(lastDayOfPrevMonth)
      };
    }
    default:
      return null;
  }
}
