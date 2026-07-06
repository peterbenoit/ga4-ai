import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rootUrl = new URL("../", import.meta.url);

test("side panel exposes visible authentication status and connect action", async () => {
  const html = await readFile(new URL("src/sidepanel.html", rootUrl), "utf8");

  assert.match(html, /id="auth-status" role="status"/);
  assert.match(html, /id="connect-google"[^>]*hidden/);
  assert.match(html, />Connect Google Analytics<\/button>/);
});

test("side panel initializes the authentication controller", async () => {
  const script = await readFile(new URL("src/sidepanel.js", rootUrl), "utf8");

  assert.match(script, /getGoogleAccessToken/);
  assert.match(script, /createAuthController/);
  assert.match(script, /controller\.check\(\)/);
});

test("side panel exposes the property picker and metadata refresh action", async () => {
  const html = await readFile(new URL("src/sidepanel.html", rootUrl), "utf8");

  assert.match(html, /<select id="property-select"[^>]*disabled/);
  assert.match(html, /id="refresh-metadata"[^>]*hidden/);
  assert.match(html, /id="metadata-status" role="status"/);
});

test("side panel initializes property loading after authentication", async () => {
  const script = await readFile(new URL("src/sidepanel.js", rootUrl), "utf8");

  assert.match(script, /createPropertyController/);
  assert.match(script, /listAccessibleProperties/);
  assert.match(script, /fetchPropertyMetadata/);
  assert.match(script, /onConnected/);
});
