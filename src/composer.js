import { callClaude } from "./anthropic-client.js";
import { COMPOSER_MODEL } from "./config.js";

function buildSystemPrompt() {
  return `You write short, plain-language answers to Google Analytics questions using only the report data provided.

Never state a number that isn't in the data. Reference the specific supporting figures.
Where the rows support a comparison or trend (across dates, segments, or categories), describe that comparison rather than stating a single bare number.
If a "dateRange" column is present, its values (date_range_0, date_range_1, ...) identify which period each row belongs to — use the provided date range mapping to name the actual dates instead of repeating "date_range_0".
Reply with one or two sentences of plain text, no markdown, no JSON.`;
}

function buildUserMessage({ question, report, request }) {
  const dateRanges = request?.dateRanges ?? [];
  const dateRangeNote = dateRanges.length > 1
    ? `\nDate range mapping: ${dateRanges.map(({ startDate, endDate }, index) => `date_range_${index} = ${startDate} to ${endDate}`).join(", ")}`
    : "";

  return `Question: ${question}
Columns: ${JSON.stringify(report.headers)}
Rows: ${JSON.stringify(report.rows)}${dateRangeNote}`;
}

export async function composeAnswer({
  question,
  report,
  request,
  apiKey,
  call = callClaude
}) {
  const text = await call({
    apiKey,
    model: COMPOSER_MODEL,
    system: buildSystemPrompt(),
    user: buildUserMessage({ question, report, request })
  });

  return text.trim();
}
