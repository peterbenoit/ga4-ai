import assert from "node:assert/strict";
import test from "node:test";

import { PRESETS } from "../src/presets.js";

const dateRange = { startDate: "2026-06-01", endDate: "2026-06-30" };

test("every preset has a unique id, a label, and a kind of report, realtime, funnel, or comparison", () => {
  const ids = new Set();

  for (const preset of PRESETS) {
    assert.ok(preset.id, "preset must have an id");
    assert.equal(ids.has(preset.id), false, `duplicate preset id: ${preset.id}`);
    ids.add(preset.id);
    assert.ok(preset.label);
    assert.ok(preset.description);
    assert.ok(["report", "realtime", "funnel", "comparison"].includes(preset.kind));
    if (preset.kind === "funnel") {
      assert.ok(Array.isArray(preset.steps) && preset.steps.length > 0, preset.id);
    } else if (preset.kind === "comparison") {
      assert.ok(Array.isArray(preset.metrics) && preset.metrics.length > 0, preset.id);
      assert.ok(Array.isArray(preset.segments) && preset.segments.length === 2, preset.id);
      for (const segment of preset.segments) {
        assert.ok(segment.label, preset.id);
        assert.ok(segment.dimensionFilter, preset.id);
      }
    } else {
      assert.equal(typeof preset.request, "function");
    }
  }
});

test("join-funnel preset has no pending steps now that the outbound-click filter is configured", () => {
  const joinFunnel = PRESETS.find((preset) => preset.id === "join-funnel");

  assert.ok(joinFunnel);
  assert.equal(joinFunnel.steps.some((step) => step.pending), false);
});

test("join-funnel preset's outbound-click step filters to click events on the eauth.va.gov link domain", () => {
  const joinFunnel = PRESETS.find((preset) => preset.id === "join-funnel");
  const outboundStep = joinFunnel.steps.find((step) => step.label === "Outbound join click");

  const [eventFilter, domainFilter] = outboundStep.dimensionFilter.andGroup.expressions;
  assert.equal(eventFilter.filter.fieldName, "eventName");
  assert.equal(eventFilter.filter.stringFilter.value, "click");
  assert.equal(domainFilter.filter.fieldName, "linkDomain");
  assert.equal(domainFilter.filter.stringFilter.matchType, "CONTAINS");
  assert.equal(domainFilter.filter.stringFilter.value, "eauth.va.gov");
});

test("report-kind presets require a metric and a date range", () => {
  for (const preset of PRESETS.filter((entry) => entry.kind === "report")) {
    const request = preset.request(dateRange);

    assert.ok(Array.isArray(request.metrics) && request.metrics.length > 0, preset.id);
    assert.deepEqual(request.dateRanges, [dateRange], preset.id);
  }
});

test("key-events preset uses conversions when the property has no keyEvents metric", () => {
  const keyEvents = PRESETS.find((preset) => preset.id === "key-events");
  const metadata = { metrics: [{ apiName: "conversions" }] };

  const request = keyEvents.request(dateRange, metadata);

  assert.deepEqual(request.metrics, [{ name: "conversions" }]);
  assert.equal(request.orderBys[0].metric.metricName, "conversions");
});

test("key-events preset prefers keyEvents when the property's metadata has it", () => {
  const keyEvents = PRESETS.find((preset) => preset.id === "key-events");
  const metadata = { metrics: [{ apiName: "keyEvents" }, { apiName: "conversions" }] };

  const request = keyEvents.request(dateRange, metadata);

  assert.deepEqual(request.metrics, [{ name: "keyEvents" }]);
  assert.equal(request.orderBys[0].metric.metricName, "keyEvents");
});

test("key-events preset falls back to conversions when no metadata is supplied", () => {
  const keyEvents = PRESETS.find((preset) => preset.id === "key-events");

  const request = keyEvents.request(dateRange);

  assert.deepEqual(request.metrics, [{ name: "conversions" }]);
});

test("landing-pages preset dimensions on landingPage and orders by sessions", () => {
  const landingPages = PRESETS.find((preset) => preset.id === "landing-pages");
  const request = landingPages.request(dateRange);

  assert.deepEqual(request.dimensions, [{ name: "landingPage" }]);
  assert.equal(request.orderBys[0].metric.metricName, "sessions");
});

test("tech-overview preset dimensions on deviceCategory and browser", () => {
  const techOverview = PRESETS.find((preset) => preset.id === "tech-overview");
  const request = techOverview.request(dateRange);

  assert.deepEqual(request.dimensions, [{ name: "deviceCategory" }, { name: "browser" }]);
  assert.equal(request.orderBys[0].metric.metricName, "sessions");
});

test("outbound-clicks preset filters to click events on the four tracked domains", () => {
  const outboundClicks = PRESETS.find((preset) => preset.id === "outbound-clicks");
  const request = outboundClicks.request(dateRange);

  assert.deepEqual(request.dimensions, [{ name: "linkDomain" }]);

  const [eventFilter, domainFilter] = request.dimensionFilter.andGroup.expressions;
  assert.equal(eventFilter.filter.fieldName, "eventName");
  assert.equal(eventFilter.filter.stringFilter.value, "click");
  assert.equal(domainFilter.filter.fieldName, "linkDomain");
  assert.deepEqual(domainFilter.filter.inListFilter.values, [
    "eauth.va.gov",
    "veteranscrisisline.net",
    "va.gov",
    "youtube.com"
  ]);
});

test("realtime preset has no date range and uses realtime-only dimensions", () => {
  const realtime = PRESETS.find((preset) => preset.id === "realtime");
  const request = realtime.request();

  assert.equal(request.dateRanges, undefined);
  assert.deepEqual(request.dimensions, [{ name: "unifiedScreenName" }]);
});
