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

function addWrappedText({ pdf, text, x, y, maxWidth, lineHeight }) {
  const lines = pdf.splitTextToSize(text, maxWidth);
  pdf.text(lines, x, y);
  return y + (lines.length * lineHeight);
}

export function downloadPdfSummary({
  question,
  answer,
  report,
  chart = null,
  filename,
  PdfCtor
}) {
  const pdf = new PdfCtor();
  const margin = 14;
  const maxWidth = 182;
  let y = margin;

  pdf.setFontSize(16);
  pdf.text("GA4 Report Summary", margin, y);
  y += 10;

  pdf.setFontSize(11);
  pdf.text("Question", margin, y);
  y = addWrappedText({ pdf, text: question, x: margin, y: y + 6, maxWidth, lineHeight: 5 }) + 4;

  pdf.text("Answer", margin, y);
  y = addWrappedText({ pdf, text: answer, x: margin, y: y + 6, maxWidth, lineHeight: 5 }) + 4;

  if (chart) {
    pdf.text("Chart", margin, y);
    y += 4;
    pdf.addImage(chart.toBase64Image(), "PNG", margin, y, 182, 70);
    y += 78;
  }

  pdf.text("Data", margin, y);
  y += 6;
  pdf.setFontSize(8);
  pdf.text(report.headers.join(" | "), margin, y);
  y += 5;

  for (const row of report.rows.slice(0, 12)) {
    pdf.text(row.join(" | "), margin, y);
    y += 5;
  }

  if (report.rows.length > 12) {
    pdf.text(`Showing first 12 of ${report.rows.length} rows. Export CSV for the full table.`, margin, y);
  }

  pdf.save(filename);
}
