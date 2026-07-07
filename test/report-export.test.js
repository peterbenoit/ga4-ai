import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCsv,
  downloadChartImage,
  downloadCsv,
  downloadPdfSummary
} from "../src/report-export.js";

test("buildCsv exports headers and rows with CSV escaping", () => {
  const csv = buildCsv({
    headers: ["country", "activeUsers", "note"],
    rows: [
      ["United States", "120", "plain"],
      ["Canada", "25", "contains, comma"],
      ["France", "10", 'contains "quote"']
    ]
  });

  assert.equal(
    csv,
    'country,activeUsers,note\nUnited States,120,plain\nCanada,25,"contains, comma"\nFrance,10,"contains ""quote"""'
  );
});

test("buildCsv preserves an empty report as a header-only export", () => {
  assert.equal(buildCsv({ headers: ["country", "activeUsers"], rows: [] }), "country,activeUsers");
});

test("downloadCsv creates and revokes an object URL", () => {
  const clicked = [];
  const revoked = [];
  const anchors = [];
  const documentRef = {
    createElement(tagName) {
      assert.equal(tagName, "a");
      const anchor = {
        click() {
          clicked.push(this.download);
        }
      };
      anchors.push(anchor);
      return anchor;
    }
  };
  const urlRef = {
    createObjectURL(blob) {
      assert.equal(blob.type, "text/csv;charset=utf-8");
      return "blob:csv";
    },
    revokeObjectURL(url) {
      revoked.push(url);
    }
  };

  downloadCsv({
    report: { headers: ["activeUsers"], rows: [["120"]] },
    filename: "ga4-report.csv",
    documentRef,
    urlRef,
    BlobCtor: class BlobStub {
      constructor(parts, options) {
        this.parts = parts;
        this.type = options.type;
      }
    }
  });

  assert.equal(anchors[0].href, "blob:csv");
  assert.equal(anchors[0].download, "ga4-report.csv");
  assert.deepEqual(clicked, ["ga4-report.csv"]);
  assert.deepEqual(revoked, ["blob:csv"]);
});

test("downloadChartImage saves the chart PNG data URL", () => {
  const clicked = [];
  const anchors = [];
  const documentRef = {
    createElement(tagName) {
      assert.equal(tagName, "a");
      const anchor = {
        click() {
          clicked.push(this.download);
        }
      };
      anchors.push(anchor);
      return anchor;
    }
  };

  downloadChartImage({
    chart: {
      toBase64Image() {
        return "data:image/png;base64,abc123";
      }
    },
    filename: "ga4-chart.png",
    documentRef
  });

  assert.equal(anchors[0].href, "data:image/png;base64,abc123");
  assert.equal(anchors[0].download, "ga4-chart.png");
  assert.deepEqual(clicked, ["ga4-chart.png"]);
});

test("downloadPdfSummary writes question, answer, chart image, and table rows", () => {
  const calls = [];

  class PdfStub {
    constructor() {
      calls.push(["construct"]);
    }

    setFontSize(size) {
      calls.push(["setFontSize", size]);
    }

    text(value, x, y) {
      calls.push(["text", value, x, y]);
    }

    splitTextToSize(value, width) {
      calls.push(["splitTextToSize", value, width]);
      return [value];
    }

    addImage(image, format, x, y, width, height) {
      calls.push(["addImage", image, format, x, y, width, height]);
    }

    save(filename) {
      calls.push(["save", filename]);
    }
  }

  downloadPdfSummary({
    question: "Which countries sent users?",
    answer: "United States led with 120 active users.",
    report: {
      headers: ["country", "activeUsers"],
      rows: [
        ["United States", "120"],
        ["Canada", "25"]
      ]
    },
    chart: {
      toBase64Image() {
        return "data:image/png;base64,chart";
      }
    },
    filename: "ga4-summary.pdf",
    PdfCtor: PdfStub
  });

  assert.deepEqual(calls[0], ["construct"]);
  assert.ok(calls.some((call) => call[0] === "text" && call[1] === "GA4 Report Summary"));
  assert.ok(calls.some((call) => call[0] === "splitTextToSize" && call[1] === "Which countries sent users?"));
  assert.ok(calls.some((call) => call[0] === "splitTextToSize" && call[1] === "United States led with 120 active users."));
  assert.ok(calls.some((call) => call[0] === "addImage" && call[1] === "data:image/png;base64,chart" && call[2] === "PNG"));
  assert.ok(calls.some((call) => call[0] === "text" && call[1] === "country | activeUsers"));
  assert.ok(calls.some((call) => call[0] === "text" && call[1] === "United States | 120"));
  assert.deepEqual(calls.at(-1), ["save", "ga4-summary.pdf"]);
});
