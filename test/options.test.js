import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rootUrl = new URL("../", import.meta.url);

test("options page provides a password field for the Anthropic API key", async () => {
  const html = await readFile(new URL("src/options.html", rootUrl), "utf8");

  assert.match(html, /id="anthropic-api-key"[^>]*type="password"/);
  assert.match(html, /id="save-key"/);
  assert.match(html, /id="options-status" role="status"/);
});

test("options script stores the key without logging it", async () => {
  const script = await readFile(new URL("src/options.js", rootUrl), "utf8");

  assert.match(script, /setAnthropicApiKey/);
  assert.equal(script.includes("console."), false);
});
