import assert from "node:assert/strict";
import test from "node:test";

import { PRESETS } from "../src/presets.js";
import { runTemplateReport } from "../src/template-runner.js";

const dateRange = { startDate: "2026-06-01", endDate: "2026-06-30" };

const metadata = {
  dimensions: [
    { apiName: "sessionDefaultChannelGroup" },
    { apiName: "pagePath" },
    { apiName: "eventName" },
    { apiName: "landingPage" },
    { apiName: "linkDomain" }
  ],
  metrics: [
    { apiName: "sessions" },
    { apiName: "activeUsers" },
    { apiName: "newUsers" },
    { apiName: "screenPageViews" },
    { apiName: "conversions" },
    { apiName: "eventCount" }
  ]
};

function reportStub(label) {
  return { headers: [label], rows: [[label]], rowCount: 1 };
}

test("runTemplateReport runs one runReport call per preset and labels each section", async () => {
  const calls = [];
  const runReport = async ({ request }) => {
    calls.push(request);
    return reportStub(`section-${calls.length}`);
  };

  const template = {
    id: "monthly-stakeholder-summary",
    label: "Monthly stakeholder summary",
    presetIds: ["traffic-acquisition", "pages-and-screens", "key-events"]
  };

  const sections = await runTemplateReport({
    template,
    presets: PRESETS,
    propertyId: "100",
    dateRange,
    metadata,
    token: "token",
    runReport
  });

  assert.equal(calls.length, 3);
  assert.deepEqual(sections.map((section) => section.label), [
    "Traffic acquisition",
    "Pages and screens",
    "Key events / conversions"
  ]);
  assert.equal(sections[0].report.headers[0], "section-1");
});

test("runTemplateReport throws on an unknown preset id instead of silently skipping it", async () => {
  const template = { id: "bad", label: "Bad template", presetIds: ["not-a-real-preset"] };

  await assert.rejects(
    () => runTemplateReport({
      template,
      presets: PRESETS,
      propertyId: "100",
      dateRange,
      metadata,
      token: "token",
      runReport: async () => reportStub("x")
    }),
    /unknown preset id/
  );
});

test("runTemplateReport rejects a preset the current property doesn't support", async () => {
  const sparseMetadata = { dimensions: [], metrics: [] };
  const template = {
    id: "monthly-stakeholder-summary",
    label: "Monthly stakeholder summary",
    presetIds: ["traffic-acquisition"]
  };

  await assert.rejects(
    () => runTemplateReport({
      template,
      presets: PRESETS,
      propertyId: "100",
      dateRange,
      metadata: sparseMetadata,
      token: "token",
      runReport: async () => reportStub("x")
    }),
    /doesn't support the "Monthly stakeholder summary" template/
  );
});

test("runTemplateReport rejects a template that bundles a non-report preset", async () => {
  const template = {
    id: "bad-kind",
    label: "Bad kind template",
    presetIds: ["realtime"]
  };

  await assert.rejects(
    () => runTemplateReport({
      template,
      presets: PRESETS,
      propertyId: "100",
      dateRange,
      metadata,
      token: "token",
      runReport: async () => reportStub("x")
    }),
    /can only bundle report-kind presets/
  );
});
