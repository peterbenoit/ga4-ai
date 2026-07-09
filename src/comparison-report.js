export async function runComparisonReport({
  propertyId,
  metrics,
  segments,
  dateRange,
  token,
  runReport
}) {
  const results = await Promise.all(
    segments.map((segment) => runReport({
      propertyId,
      token,
      request: {
        metrics: metrics.map((name) => ({ name })),
        dateRanges: [dateRange],
        ...(segment.dimensionFilter ? { dimensionFilter: segment.dimensionFilter } : {})
      }
    }))
  );

  const rows = segments.map((segment, index) => {
    const values = metrics.map((_, metricIndex) => results[index].rows[0]?.[metricIndex] ?? "0");
    return [segment.label, ...values];
  });

  return {
    headers: ["Segment", ...metrics],
    rows,
    rowCount: rows.length
  };
}
