function countFromResult(result) {
  const value = result.rows[0]?.[0];
  return Number(value ?? 0);
}

function dropOffLabel(previousCount, count) {
  if (previousCount === 0) {
    return "";
  }
  const rate = 100 * (1 - count / previousCount);
  return `${rate.toFixed(1)}%`;
}

export async function runFunnelReport({
  propertyId,
  steps,
  dateRange,
  token,
  runReport
}) {
  const results = await Promise.all(
    steps.map((step) => runReport({
      propertyId,
      token,
      request: {
        metrics: [{ name: step.metric ?? "activeUsers" }],
        dateRanges: [dateRange],
        ...(step.dimensionFilter ? { dimensionFilter: step.dimensionFilter } : {})
      }
    }))
  );

  const counts = results.map(countFromResult);
  const rows = steps.map((step, index) => [
    step.label,
    String(counts[index]),
    index === 0 ? "" : dropOffLabel(counts[index - 1], counts[index])
  ]);

  return {
    headers: ["Step", "Users", "Drop-off from previous step"],
    rows,
    rowCount: rows.length
  };
}
