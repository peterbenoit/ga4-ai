const ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta";
const DATA_API = "https://analyticsdata.googleapis.com/v1beta";

async function fetchJson(url, { token, fetchImpl }) {
  const response = await fetchImpl(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await response.json();

  if (!response.ok) {
    const message = body?.error?.message ?? "Unknown error";
    throw new Error(`GA4 API error (${response.status}): ${message}`);
  }

  return body;
}

export async function listAccessibleProperties({
  token,
  fetchImpl = globalThis.fetch
}) {
  const properties = [];
  let pageToken = "";

  do {
    const pageTokenQuery = pageToken
      ? `&pageToken=${encodeURIComponent(pageToken)}`
      : "";
    const page = await fetchJson(
      `${ADMIN_API}/accountSummaries?pageSize=200${pageTokenQuery}`,
      { token, fetchImpl }
    );

    for (const account of page.accountSummaries ?? []) {
      for (const property of account.propertySummaries ?? []) {
        properties.push({
          id: property.property.replace("properties/", ""),
          name: property.displayName,
          accountName: account.displayName
        });
      }
    }

    pageToken = page.nextPageToken ?? "";
  } while (pageToken);

  return properties;
}

export async function fetchPropertyMetadata({
  propertyId,
  token,
  fetchImpl = globalThis.fetch,
  now = Date.now
}) {
  const [metadata, property] = await Promise.all([
    fetchJson(`${DATA_API}/properties/${propertyId}/metadata`, { token, fetchImpl }),
    fetchJson(`${ADMIN_API}/properties/${propertyId}`, { token, fetchImpl })
  ]);

  return {
    dimensions: metadata.dimensions ?? [],
    metrics: metadata.metrics ?? [],
    timeZone: property.timeZone,
    fetchedAt: now()
  };
}
