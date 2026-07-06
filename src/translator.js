import { callClaude } from "./anthropic-client.js";
import { TRANSLATOR_MODEL } from "./config.js";
import { validateReportRequest } from "./request-validator.js";

function buildSystemPrompt({ metadata, today }) {
  return `You translate plain-language analytics questions into Google Analytics Data API runReport requests.

Return exactly one JSON object and no markdown.

Valid outcomes:
{"type":"query","request":{"dimensions":[{"name":"dimensionApiName"}],"metrics":[{"name":"metricApiName"}],"dateRanges":[{"startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"}],"dimensionFilter":{},"metricFilter":{},"limit":100}}
{"type":"clarification","question":"A specific follow-up question"}

Use clarification when a necessary campaign, segment, date, or comparison is missing. Do not guess.
Use only dimension and metric apiName values present in the metadata below.
Resolve relative dates against the property timezone.
Today: ${today}
Property timezone: ${metadata.timeZone}
Dimensions: ${JSON.stringify(metadata.dimensions)}
Metrics: ${JSON.stringify(metadata.metrics)}`;
}

function inspectOutcome(text, metadata) {
  let outcome;

  try {
    outcome = JSON.parse(text);
  } catch (error) {
    return { error: `Malformed JSON: ${error.message}`, malformed: true };
  }

  if (outcome?.type === "clarification" && typeof outcome.question === "string" && outcome.question.trim()) {
    return { outcome };
  }

  if (outcome?.type !== "query" || !outcome.request || typeof outcome.request !== "object") {
    return { error: "Response must be a query or clarification outcome." };
  }

  const errors = validateReportRequest(outcome.request, metadata);
  return errors.length > 0
    ? { error: errors.join("; ") }
    : { outcome };
}

export async function translateQuestion({
  question,
  metadata,
  today,
  apiKey,
  call = callClaude
}) {
  const system = buildSystemPrompt({ metadata, today });
  let user = question;
  let lastInspection;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const text = await call({
      apiKey,
      model: TRANSLATOR_MODEL,
      system,
      user
    });
    lastInspection = inspectOutcome(text, metadata);

    if (lastInspection.outcome) {
      return lastInspection.outcome;
    }

    user = `Original question: ${question}\nYour previous response was invalid: ${text}\nValidation error: ${lastInspection.error}\nReturn corrected JSON only.`;
  }

  if (lastInspection.malformed) {
    throw new Error(`Claude returned malformed JSON after retry: ${lastInspection.error}`);
  }

  throw new Error(
    `Claude returned an invalid GA4 request after retry: ${lastInspection.error}`
  );
}
