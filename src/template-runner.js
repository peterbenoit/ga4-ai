import { validateReportRequest } from "./request-validator.js";

export async function runTemplateReport({
  template,
  presets,
  propertyId,
  dateRange,
  metadata,
  token,
  runReport
}) {
  const steps = template.presetIds.map((id) => {
    const preset = presets.find((entry) => entry.id === id);
    if (!preset) {
      throw new Error(`Template "${template.label}" references unknown preset id "${id}".`);
    }
    if (preset.kind !== "report") {
      throw new Error(`Template "${template.label}" can only bundle report-kind presets; "${preset.label}" is a ${preset.kind}.`);
    }
    return preset;
  });

  const requests = steps.map((preset) => preset.request(dateRange, metadata));

  const validationErrors = steps.flatMap((preset, index) =>
    validateReportRequest(requests[index], metadata).map((error) => `${preset.label}: ${error}`));

  if (validationErrors.length > 0) {
    throw new Error(`This property doesn't support the "${template.label}" template: ${validationErrors.join("; ")}`);
  }

  const reports = await Promise.all(
    requests.map((request) => runReport({ propertyId, token, request }))
  );

  return steps.map((preset, index) => ({ label: preset.label, report: reports[index] }));
}
