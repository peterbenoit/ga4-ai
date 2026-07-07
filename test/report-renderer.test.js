import assert from "node:assert/strict";
import test from "node:test";

import { renderReport, selectChartConfig } from "../src/report-renderer.js";

function createTable() {
  return {
    hidden: true,
    children: [],
    replaceChildren(...children) {
      this.children = children;
    }
  };
}

function createDocument() {
  return {
    createElement(tagName) {
      return {
        tagName,
        children: [],
        append(...children) {
          this.children.push(...children);
        },
        set textContent(value) {
          this.text = value;
        },
        get textContent() {
          return this.text ?? "";
        }
      };
    }
  };
}

test("date dimension reports render as line charts", () => {
  const config = selectChartConfig({
    headers: ["date", "activeUsers"],
    rows: [
      ["20260701", "12"],
      ["20260702", "15"]
    ],
    rowCount: 2
  });

  assert.equal(config.type, "line");
  assert.deepEqual(config.data.labels, ["20260701", "20260702"]);
  assert.deepEqual(config.data.datasets[0].data, [12, 15]);
  assert.equal(config.data.datasets[0].label, "activeUsers");
});

test("categorical dimension reports render as bar charts", () => {
  const config = selectChartConfig({
    headers: ["country", "activeUsers"],
    rows: [
      ["United States", "120"],
      ["Canada", "25"]
    ],
    rowCount: 2
  });

  assert.equal(config.type, "bar");
  assert.deepEqual(config.data.labels, ["United States", "Canada"]);
  assert.deepEqual(config.data.datasets[0].data, [120, 25]);
});

test("single aggregate reports do not render a chart", () => {
  assert.equal(
    selectChartConfig({
      headers: ["activeUsers"],
      rows: [["120"]],
      rowCount: 1
    }),
    null
  );
});

test("renderReport always renders the table and toggles chart availability", () => {
  const table = createTable();
  const canvas = { hidden: true };
  const chartNote = { hidden: true, textContent: "" };
  const chartCalls = [];

  renderReport({
    report: {
      headers: ["country", "activeUsers"],
      rows: [["United States", "120"]],
      rowCount: 1
    },
    table,
    canvas,
    chartNote,
    documentRef: createDocument(),
    createChart(target, config) {
      chartCalls.push({ target, config });
      return { destroy() {} };
    }
  });

  assert.equal(table.hidden, false);
  assert.equal(canvas.hidden, false);
  assert.equal(chartNote.hidden, true);
  assert.equal(chartCalls.length, 1);
  assert.equal(chartCalls[0].config.type, "bar");
});

test("renderReport hides the chart when data shape does not support one", () => {
  const table = createTable();
  const canvas = { hidden: false };
  const chartNote = { hidden: true, textContent: "" };

  renderReport({
    report: {
      headers: ["activeUsers"],
      rows: [["120"]],
      rowCount: 1
    },
    table,
    canvas,
    chartNote,
    documentRef: createDocument(),
    createChart() {
      throw new Error("Chart should not be created.");
    }
  });

  assert.equal(table.hidden, false);
  assert.equal(canvas.hidden, true);
  assert.equal(chartNote.hidden, false);
  assert.equal(chartNote.textContent, "This report shape does not support a chart.");
});
