import { callClaude } from "./anthropic-client.js";
import { COMPOSER_MODEL } from "./config.js";

function buildSystemPrompt() {
  return `You write short, plain-language answers to Google Analytics questions using only the report data provided.

Never state a number that isn't in the data. Reference the specific supporting figures.
Where the rows support a comparison or trend (across dates, segments, or categories), describe that comparison rather than stating a single bare number.
Reply with one or two sentences of plain text, no markdown, no JSON.`;
}

function buildUserMessage({ question, report }) {
  return `Question: ${question}
Columns: ${JSON.stringify(report.headers)}
Rows: ${JSON.stringify(report.rows)}`;
}

export async function composeAnswer({
  question,
  report,
  apiKey,
  call = callClaude
}) {
  const text = await call({
    apiKey,
    model: COMPOSER_MODEL,
    system: buildSystemPrompt(),
    user: buildUserMessage({ question, report })
  });

  return text.trim();
}
