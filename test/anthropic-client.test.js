import assert from "node:assert/strict";
import test from "node:test";

import { callClaude } from "../src/anthropic-client.js";

function response(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    async json() {
      return body;
    }
  };
}

test("Claude request uses required headers and returns text content", async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return response({ content: [{ type: "text", text: "{\"type\":\"clarification\"}" }] });
  };

  const text = await callClaude({
    apiKey: "sk-ant-example",
    model: "claude-sonnet-5",
    system: "System prompt",
    user: "User prompt",
    fetchImpl
  });

  assert.equal(request.url, "https://api.anthropic.com/v1/messages");
  assert.equal(request.options.headers["x-api-key"], "sk-ant-example");
  assert.equal(request.options.headers["anthropic-version"], "2023-06-01");
  assert.equal(request.options.headers["anthropic-dangerous-direct-browser-access"], "true");
  assert.deepEqual(JSON.parse(request.options.body), {
    model: "claude-sonnet-5",
    max_tokens: 2048,
    system: "System prompt",
    messages: [{ role: "user", content: "User prompt" }]
  });
  assert.equal(text, "{\"type\":\"clarification\"}");
});

test("Claude API errors expose the real API message", async () => {
  const fetchImpl = async () => response(
    { error: { message: "invalid x-api-key" } },
    { ok: false, status: 401 }
  );

  await assert.rejects(
    callClaude({ apiKey: "bad", model: "model", system: "s", user: "u", fetchImpl }),
    new Error("Anthropic API error (401): invalid x-api-key")
  );
});

test("Claude response without text fails visibly", async () => {
  const fetchImpl = async () => response({ content: [] });

  await assert.rejects(
    callClaude({ apiKey: "key", model: "model", system: "s", user: "u", fetchImpl }),
    new Error("Anthropic returned no text content.")
  );
});
