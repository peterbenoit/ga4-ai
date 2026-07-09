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

function truncateCell(value, columnWidth) {
  const text = String(value);
  const maxChars = Math.max(6, Math.floor(columnWidth / 1.6));
  return text.length > maxChars ? `${text.slice(0, maxChars - 1)}…` : text;
}

function drawTableRow({ pdf, values, columnWidths, x, y, rowHeight }) {
  let cellX = x;
  for (const [index, value] of values.entries()) {
    const width = columnWidths[index];
    pdf.rect(cellX, y, width, rowHeight);
    pdf.text(truncateCell(value, width), cellX + 1.5, y + rowHeight - 2);
    cellX += width;
  }
}

// Ruled table with column-boundary pagination, replacing the earlier
// pipe-joined-text-capped-at-12-rows export. Header row repeats on every
// new page so a table split across pages stays readable on its own.
function drawRuledTable({ pdf, headers, rows, x, y, maxWidth, pageHeight, margin, rowHeight = 6 }) {
  const columnWidths = headers.map(() => maxWidth / headers.length);
  let cursorY = y;

  const drawHeader = () => {
    pdf.setFontSize(8);
    drawTableRow({ pdf, values: headers, columnWidths, x, y: cursorY, rowHeight });
    cursorY += rowHeight;
  };

  drawHeader();

  for (const row of rows) {
    if (cursorY + rowHeight > pageHeight - margin) {
      pdf.addPage();
      cursorY = margin;
      drawHeader();
    }
    drawTableRow({ pdf, values: row, columnWidths, x, y: cursorY, rowHeight });
    cursorY += rowHeight;
  }

  return cursorY;
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
  const pageHeight = pdf.internal.pageSize.getHeight();
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
  y += 4;
  if (y + 6 > pageHeight - margin) {
    pdf.addPage();
    y = margin;
  }

  drawRuledTable({ pdf, headers: report.headers, rows: report.rows, x: margin, y, maxWidth, pageHeight, margin });

  pdf.save(filename);
}
