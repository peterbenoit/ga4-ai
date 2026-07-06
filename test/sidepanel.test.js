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
