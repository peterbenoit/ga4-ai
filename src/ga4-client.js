const ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta";
const DATA_API = "https://analyticsdata.googleapis.com/v1beta";

async function fetchJson(url, {
  token,
  fetchImpl,
  method = "GET",
  body
}) {
  const response = await fetchImpl(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "content-type": "application/json" } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message ?? "Unknown error";
    const error = new Error(`GA4 API error (${response.status}): ${message}`);
    error.status = response.status;
    throw error;
  }

  return data;
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

export async function runReport({
  propertyId,
  request,
  token,
  fetchImpl = globalThis.fetch
}) {
  const raw = await fetchJson(
    `${DATA_API}/properties/${propertyId}:runReport`,
    { token, fetchImpl, method: "POST", body: request }
  );
  const isUnlabeledComparison = (request.dateRanges?.length ?? 0) > 1
    && (raw.dimensionHeaders ?? []).length === 0;

  const headers = [
    ...(isUnlabeledComparison ? ["dateRange"] : []),
    ...(raw.dimensionHeaders ?? []).map(({ name }) => name),
    ...(raw.metricHeaders ?? []).map(({ name }) => name)
  ];
  const rows = (raw.rows ?? []).map((row, index) => [
    ...(isUnlabeledComparison ? [`date_range_${index}`] : []),
    ...(row.dimensionValues ?? []).map(({ value }) => value),
    ...(row.metricValues ?? []).map(({ value }) => value)
  ]);

  return {
    headers,
    rows,
    rowCount: raw.rowCount ?? rows.length,
    raw
  };
}
