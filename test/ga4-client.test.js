import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchPropertyMetadata,
  listAccessibleProperties,
  runReport,
  runRealtimeReport
} from "../src/ga4-client.js";

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    async json() {
      return body;
    }
  };
}

test("accessible properties are flattened across paginated account summaries", async () => {
  const requests = [];
  const pages = [
    {
      accountSummaries: [{
        account: "accounts/1",
        displayName: "Account One",
        propertySummaries: [{ property: "properties/100", displayName: "Site One" }]
      }],
      nextPageToken: "next page"
    },
    {
      accountSummaries: [{
        account: "accounts/2",
        displayName: "Account Two",
        propertySummaries: [{ property: "properties/200", displayName: "Site Two" }]
      }]
    }
  ];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return jsonResponse(pages.shift());
  };

  const properties = await listAccessibleProperties({ token: "secret", fetchImpl });

  assert.deepEqual(properties, [
    { id: "100", name: "Site One", accountName: "Account One" },
    { id: "200", name: "Site Two", accountName: "Account Two" }
  ]);
  assert.match(requests[0].url, /pageSize=200/);
  assert.match(requests[1].url, /pageToken=next%20page/);
  assert.equal(requests[0].options.headers.Authorization, "Bearer secret");
});

test("property metadata combines reporting fields with the property timezone", async () => {
  const fetchImpl = async (url) => {
    if (url === "https://analyticsdata.googleapis.com/v1beta/properties/100/metadata") {
      return jsonResponse({
        dimensions: [{ apiName: "country" }],
        metrics: [{ apiName: "activeUsers" }]
      });
    }

    if (url === "https://analyticsadmin.googleapis.com/v1beta/properties/100") {
      return jsonResponse({ timeZone: "America/New_York" });
    }

    throw new Error(`Unexpected URL: ${url}`);
  };

  const metadata = await fetchPropertyMetadata({
    propertyId: "100",
    token: "secret",
    fetchImpl,
    now: () => 1234
  });

  assert.deepEqual(metadata, {
    dimensions: [{ apiName: "country" }],
    metrics: [{ apiName: "activeUsers" }],
    timeZone: "America/New_York",
    fetchedAt: 1234
  });
});

test("GA4 API errors expose the real API message", async () => {
  const fetchImpl = async () => jsonResponse(
    { error: { message: "User does not have access" } },
    { ok: false, status: 403 }
  );

  await assert.rejects(
    listAccessibleProperties({ token: "secret", fetchImpl }),
    new Error("GA4 API error (403): User does not have access")
  );
});

test("GA4 API errors carry the HTTP status so callers can detect an expired token", async () => {
  const fetchImpl = async () => jsonResponse(
    { error: { message: "Invalid credentials" } },
    { ok: false, status: 401 }
  );

  await assert.rejects(
    listAccessibleProperties({ token: "secret", fetchImpl }),
    (error) => error.status === 401
  );
});

test("runReport posts the validated request and normalizes raw rows", async () => {
  let captured;
  const request = {
    dimensions: [{ name: "country" }],
    metrics: [{ name: "activeUsers" }],
    dateRanges: [{ startDate: "2026-06-01", endDate: "2026-06-30" }]
  };
  const raw = {
    dimensionHeaders: [{ name: "country" }],
    metricHeaders: [{ name: "activeUsers", type: "TYPE_INTEGER" }],
    rows: [{
      dimensionValues: [{ value: "United States" }],
      metricValues: [{ value: "12" }]
    }],
    rowCount: 1
  };
  const fetchImpl = async (url, options) => {
    captured = { url, options };
    return jsonResponse(raw);
  };

  const report = await runReport({
    propertyId: "100",
    request,
    token: "secret",
    fetchImpl
  });

  assert.equal(
    captured.url,
    "https://analyticsdata.googleapis.com/v1beta/properties/100:runReport"
  );
  assert.equal(captured.options.method, "POST");
  assert.deepEqual(JSON.parse(captured.options.body), request);
  assert.deepEqual(report, {
    headers: ["country", "activeUsers"],
    rows: [["United States", "12"]],
    rowCount: 1,
    raw
  });
});

test("runReport labels rows with a synthetic dateRange column for an unlabeled multi-range comparison", async () => {
  const request = {
    dimensions: [],
    metrics: [{ name: "activeUsers" }],
    dateRanges: [
      { startDate: "2026-06-01", endDate: "2026-06-30" },
      { startDate: "2025-06-01", endDate: "2025-06-30" }
    ]
  };
  const raw = {
    dimensionHeaders: [],
    metricHeaders: [{ name: "activeUsers" }],
    rows: [
      { dimensionValues: [], metricValues: [{ value: "150" }] },
      { dimensionValues: [], metricValues: [{ value: "120" }] }
    ],
    rowCount: 2
  };
  const fetchImpl = async () => jsonResponse(raw);

  const report = await runReport({ propertyId: "100", request, token: "secret", fetchImpl });

  assert.deepEqual(report.headers, ["dateRange", "activeUsers"]);
  assert.deepEqual(report.rows, [
    ["date_range_0", "150"],
    ["date_range_1", "120"]
  ]);
});

test("runReport leaves rows alone when GA4 already returns real dimension breakdowns", async () => {
  const request = {
    dimensions: [{ name: "country" }],
    metrics: [{ name: "activeUsers" }],
    dateRanges: [{ startDate: "2026-06-01", endDate: "2026-06-30" }]
  };
  const raw = {
    dimensionHeaders: [{ name: "country" }],
    metricHeaders: [{ name: "activeUsers" }],
    rows: [{ dimensionValues: [{ value: "United States" }], metricValues: [{ value: "12" }] }],
    rowCount: 1
  };
  const fetchImpl = async () => jsonResponse(raw);

  const report = await runReport({ propertyId: "100", request, token: "secret", fetchImpl });

  assert.deepEqual(report.headers, ["country", "activeUsers"]);
  assert.deepEqual(report.rows, [["United States", "12"]]);
});

test("runReport preserves an empty result as a non-error", async () => {
  const fetchImpl = async () => jsonResponse({
    dimensionHeaders: [{ name: "country" }],
    metricHeaders: [{ name: "activeUsers" }],
    rowCount: 0
  });

  const report = await runReport({
    propertyId: "100",
    request: {},
    token: "secret",
    fetchImpl
  });

  assert.deepEqual(report.rows, []);
  assert.equal(report.rowCount, 0);
});

test("runRealtimeReport posts to the realtime endpoint and normalizes raw rows", async () => {
  const raw = {
    dimensionHeaders: [{ name: "unifiedScreenName" }],
    metricHeaders: [{ name: "activeUsers" }],
    rows: [{ dimensionValues: [{ value: "/home" }], metricValues: [{ value: "4" }] }],
    rowCount: 1
  };
  let calledUrl;
  const fetchImpl = async (url) => {
    calledUrl = url;
    return jsonResponse(raw);
  };

  const report = await runRealtimeReport({
    propertyId: "100",
    request: { dimensions: [{ name: "unifiedScreenName" }], metrics: [{ name: "activeUsers" }] },
    token: "secret",
    fetchImpl
  });

  assert.equal(
    calledUrl,
    "https://analyticsdata.googleapis.com/v1beta/properties/100:runRealtimeReport"
  );
  assert.deepEqual(report.headers, ["unifiedScreenName", "activeUsers"]);
  assert.deepEqual(report.rows, [["/home", "4"]]);
  assert.equal(report.rowCount, 1);
});
