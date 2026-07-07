function escapeCsvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildCsv(report) {
  return [report.headers, ...report.rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
}

export function downloadCsv({
  report,
  filename,
  documentRef = document,
  urlRef = URL,
  BlobCtor = Blob
}) {
  const blob = new BlobCtor([buildCsv(report)], { type: "text/csv;charset=utf-8" });
  const url = urlRef.createObjectURL(blob);
  const link = documentRef.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  urlRef.revokeObjectURL(url);
}

export function downloadChartImage({
  chart,
  filename,
  documentRef = document
}) {
  const link = documentRef.createElement("a");
  link.href = chart.toBase64Image();
  link.download = filename;
  link.click();
}
