import { callClaude } from "./anthropic-client.js";
import { TRANSLATOR_MODEL } from "./config.js";
import { validateReportRequest } from "./request-validator.js";

function buildSystemPrompt({ metadata, today, dateRange }) {
  const dateInstruction = dateRange
    ? `A date range has already been chosen in the UI: ${dateRange.startDate} to ${dateRange.endDate}. Always use exactly this as the first entry in dateRanges — never infer or ask about dates. If the question explicitly asks to compare against another period (e.g. "vs last year"), add a second dateRanges entry for that comparison period computed relative to the chosen range, and leave dimensions empty per the comparison rule below.`
    : `Resolve relative dates against the property timezone.`;

  return `You translate plain-language analytics questions into Google Analytics Data API runReport requests.

Return exactly one JSON object and no markdown.

Valid outcomes:
{"type":"query","request":{"dimensions":[{"name":"dimensionApiName"}],"metrics":[{"name":"metricApiName"}],"dateRanges":[{"startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"}],"dimensionFilter":{},"metricFilter":{},"limit":100}}
{"type":"clarification","question":"A specific follow-up question"}

Use clarification when a necessary campaign, segment, date, or comparison is missing. Do not guess.
Use only dimension and metric apiName values present in the metadata below.
When dateRanges has more than one entry (a comparison between two periods), leave dimensions empty. GA4 returns exactly one row per date range, in the order given, with no dimension breakdown. It cannot label which row is which period on its own, and combining a dimension breakdown with a period comparison in one request isn't supported here — if the question needs both, ask a clarifying question about which one matters more instead of guessing.
${dateInstruction}
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
  dateRange = null,
  apiKey,
  call = callClaude
}) {
  const system = buildSystemPrompt({ metadata, today, dateRange });
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
