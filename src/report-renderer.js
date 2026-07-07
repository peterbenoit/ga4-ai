const DATE_DIMENSIONS = new Set(["date", "dateHour", "dateHourMinute"]);

function toNumber(value) {
  const number = Number(String(value).replaceAll(",", ""));
  return Number.isFinite(number) ? number : 0;
}

function isDateDimension(header) {
  return DATE_DIMENSIONS.has(header);
}

export function selectChartConfig(report) {
  if (report.rows.length === 0 || report.headers.length < 2) {
    return null;
  }

  const [dimensionHeader, metricHeader] = report.headers;
  const chartType = isDateDimension(dimensionHeader) ? "line" : "bar";

  return {
    type: chartType,
    data: {
      labels: report.rows.map((row) => row[0]),
      datasets: [{
        label: metricHeader,
        data: report.rows.map((row) => toNumber(row[1])),
        borderColor: "#1a56db",
        backgroundColor: "rgba(26, 86, 219, 0.22)",
        tension: chartType === "line" ? 0.25 : 0
      }]
    },
    options: {
      animation: false,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  };
}

function buildTable({ report, documentRef }) {
  const caption = documentRef.createElement("caption");
  caption.textContent = "GA4 report data";
  const head = documentRef.createElement("thead");
  const headerRow = documentRef.createElement("tr");

  for (const header of report.headers) {
    const cell = documentRef.createElement("th");
    cell.scope = "col";
    cell.textContent = header;
    headerRow.append(cell);
  }
  head.append(headerRow);

  const body = documentRef.createElement("tbody");
  for (const row of report.rows) {
    const tableRow = documentRef.createElement("tr");
    for (const value of row) {
      const cell = documentRef.createElement("td");
      cell.textContent = value;
      tableRow.append(cell);
    }
    body.append(tableRow);
  }

  return [caption, head, body];
}

export function renderReport({
  report,
  table,
  canvas,
  chartNote,
  documentRef = document,
  createChart,
  previousChart = null
}) {
  table.replaceChildren(...buildTable({ report, documentRef }));
  table.hidden = false;

  previousChart?.destroy();
  const chartConfig = selectChartConfig(report);

  if (!chartConfig) {
    canvas.hidden = true;
    chartNote.textContent = "This report shape does not support a chart.";
    chartNote.hidden = false;
    return null;
  }

  canvas.hidden = false;
  chartNote.hidden = true;
  return createChart(canvas, chartConfig);
}
