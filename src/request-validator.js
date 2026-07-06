function collectFilterFields(expression, fields = []) {
  if (!expression || typeof expression !== "object") {
    return fields;
  }

  if (expression.filter?.fieldName) {
    fields.push(expression.filter.fieldName);
  }

  for (const child of expression.andGroup?.expressions ?? []) {
    collectFilterFields(child, fields);
  }
  for (const child of expression.orGroup?.expressions ?? []) {
    collectFilterFields(child, fields);
  }
  if (expression.notExpression) {
    collectFilterFields(expression.notExpression, fields);
  }

  return fields;
}

export function validateReportRequest(request, metadata) {
  const errors = [];
  const dimensionNames = new Set(metadata.dimensions.map(({ apiName }) => apiName));
  const metricNames = new Set(metadata.metrics.map(({ apiName }) => apiName));

  if (!Array.isArray(request.metrics) || request.metrics.length === 0) {
    errors.push("At least one metric is required.");
  }
  if (!Array.isArray(request.dateRanges) || request.dateRanges.length === 0) {
    errors.push("At least one date range is required.");
  }

  for (const { name } of request.dimensions ?? []) {
    if (!dimensionNames.has(name)) {
      errors.push(`Unknown dimension: ${name}`);
    }
  }

  if ((request.dateRanges ?? []).length > 1 && (request.dimensions ?? []).length > 0) {
    errors.push("A comparison with multiple dateRanges can't be combined with a dimension breakdown in one request — GA4 can't label which row belongs to which period in that case.");
  }
  for (const { name } of request.metrics ?? []) {
    if (!metricNames.has(name)) {
      errors.push(`Unknown metric: ${name}`);
    }
  }
  for (const fieldName of collectFilterFields(request.dimensionFilter)) {
    if (!dimensionNames.has(fieldName)) {
      errors.push(`Unknown dimension filter field: ${fieldName}`);
    }
  }
  for (const fieldName of collectFilterFields(request.metricFilter)) {
    if (!metricNames.has(fieldName)) {
      errors.push(`Unknown metric filter field: ${fieldName}`);
    }
  }

  return errors;
}
