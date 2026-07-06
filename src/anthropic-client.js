const MESSAGES_URL = "https://api.anthropic.com/v1/messages";

export async function callClaude({
  apiKey,
  model,
  system,
  user,
  fetchImpl = globalThis.fetch
}) {
  const response = await fetchImpl(MESSAGES_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: user }]
    })
  });
  const body = await response.json();

  if (!response.ok) {
    const message = body?.error?.message ?? "Unknown error";
    throw new Error(`Anthropic API error (${response.status}): ${message}`);
  }

  const text = body.content
    ?.filter(({ type }) => type === "text")
    .map(({ text: value }) => value)
    .join("");

  if (!text) {
    throw new Error("Anthropic returned no text content.");
  }

  return text;
}
