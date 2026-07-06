import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const rootUrl = new URL("../", import.meta.url);
const manifestUrl = new URL("manifest.json", rootUrl);

async function readManifest() {
  return JSON.parse(await readFile(manifestUrl, "utf8"));
}

test("manifest declares the Phase 0 MV3 package contract", async () => {
  const manifest = await readManifest();

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.minimum_chrome_version, "114");
  assert.equal(manifest.background.service_worker, "src/background.js");
  assert.equal(manifest.side_panel.default_path, "src/sidepanel.html");
  assert.equal(manifest.action.default_title, "Open GA4 Query Assistant");
  assert.deepEqual([...manifest.permissions].sort(), ["identity", "sidePanel", "storage"]);
  assert.deepEqual([...manifest.host_permissions].sort(), [
    "https://analyticsdata.googleapis.com/*",
    "https://api.anthropic.com/*"
  ]);
  assert.deepEqual(manifest.oauth2, {
    client_id: "156681170189-1hmgo0ob70iblo6agil20hml97u5t06b.apps.googleusercontent.com",
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"]
  });
  assert.equal("content_scripts" in manifest, false);
  assert.equal(manifest.permissions.includes("activeTab"), false);
  assert.equal("default_popup" in manifest.action, false);
});

test("every declared extension resource exists", async () => {
  const manifest = await readManifest();
  const declaredResources = [
    manifest.background.service_worker,
    manifest.side_panel.default_path,
    "src/sidepanel.css",
    "src/sidepanel.js"
  ];

  await Promise.all(declaredResources.map((path) => access(new URL(path, rootUrl))));
});

test("side panel loads only external CSS and JavaScript", async () => {
  const html = await readFile(new URL("src/sidepanel.html", rootUrl), "utf8");

  assert.match(html, /<link rel="stylesheet" href="sidepanel\.css">/);
  assert.match(html, /<script type="module" src="sidepanel\.js"><\/script>/);
  assert.equal(html.includes("<style"), false);
  assert.equal(/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), false);
});
