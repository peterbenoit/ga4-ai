import assert from "node:assert/strict";
import test from "node:test";

import { fetchPropertyMetadata, listAccessibleProperties } from "../src/ga4-client.js";

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
