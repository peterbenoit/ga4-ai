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

test("side panel exposes question translation controls and output", async () => {
  const html = await readFile(new URL("src/sidepanel.html", rootUrl), "utf8");

  assert.match(html, /id="question-form"/);
  assert.match(html, /id="question"[^>]*disabled/);
  assert.match(html, /id="translate-question"[^>]*disabled/);
  assert.match(html, /id="translation-status" role="status"/);
  assert.match(html, /id="translation-output"[^>]*hidden/);
  assert.match(html, /id="open-settings"[^>]*hidden/);
  assert.match(html, /id="report-table"[^>]*hidden/);
  assert.match(html, /id="report-chart"[^>]*hidden/);
  assert.match(html, /id="export-csv"[^>]*disabled/);
  assert.match(html, /id="export-chart"[^>]*disabled/);
  assert.match(html, /id="export-pdf"[^>]*disabled/);
  assert.match(html, /id="tab-history"/);
  assert.match(html, /id="history-list"/);
  assert.match(html, /id="clear-history"[^>]*disabled/);
  assert.match(html, /id="toggle-raw-table"[^>]*disabled/);
});

test("side panel raw table toggle starts hidden and is enabled once a report renders", async () => {
  const script = await readFile(new URL("src/sidepanel.js", rootUrl), "utf8");

  assert.match(script, /toggleRawTableButton\.addEventListener\("click"/);
  assert.match(script, /rawTableVisible = !rawTableVisible/);
  assert.match(script, /toggleRawTableButton\.disabled = false/);
});

test("side panel wires metadata into the query controller", async () => {
  const script = await readFile(new URL("src/sidepanel.js", rootUrl), "utf8");

  assert.match(script, /createQueryController/);
  assert.match(script, /translateQuestion/);
  assert.match(script, /queryController\.setContext/);
  assert.match(script, /runReport/);
  assert.match(script, /renderReport/);
  assert.match(script, /downloadCsv/);
  assert.match(script, /downloadChartImage/);
  assert.match(script, /downloadPdfSummary/);
  assert.match(script, /createHistoryStore/);
  assert.match(script, /createHistoryController/);
  assert.match(script, /onQuestionReady/);
  assert.match(script, /tabs\.select\("ask"\)/);
  assert.match(script, /openOptionsPage/);
});
