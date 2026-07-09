import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCsv,
  downloadChartImage,
  downloadCsv,
  downloadMultiSectionPdf,
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
      this.internal = { pageSize: { getHeight: () => 297 } };
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

    rect(x, y, width, height) {
      calls.push(["rect", x, y, width, height]);
    }

    addPage() {
      calls.push(["addPage"]);
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
  assert.ok(calls.some((call) => call[0] === "text" && call[1] === "country"));
  assert.ok(calls.some((call) => call[0] === "text" && call[1] === "activeUsers"));
  assert.ok(calls.some((call) => call[0] === "text" && call[1] === "United States"));
  assert.ok(calls.some((call) => call[0] === "text" && call[1] === "120"));
  assert.ok(calls.some((call) => call[0] === "rect"), "table cells should be drawn with ruled borders");
  assert.deepEqual(calls.at(-1), ["save", "ga4-summary.pdf"]);
});

test("downloadPdfSummary paginates the table instead of capping at a fixed row count", () => {
  const calls = [];

  class PdfStub {
    constructor() {
      this.internal = { pageSize: { getHeight: () => 40 } };
    }

    setFontSize() {}
    text() {}

    splitTextToSize(value) {
      return [value];
    }

    addImage() {}

    rect() {}

    addPage() {
      calls.push("addPage");
    }

    save() {}
  }

  const rows = Array.from({ length: 30 }, (_, index) => [`Page ${index}`, String(index)]);

  downloadPdfSummary({
    question: "Which pages got views?",
    answer: "30 pages had views.",
    report: { headers: ["page", "views"], rows },
    filename: "ga4-summary.pdf",
    PdfCtor: PdfStub
  });

  assert.ok(calls.length > 0, "a 30-row table on a short page should trigger at least one addPage call");
});

test("downloadMultiSectionPdf writes the title, one heading and ruled table per section, and a page break between sections", () => {
  const calls = [];

  class PdfStub {
    constructor() {
      this.internal = { pageSize: { getHeight: () => 297 } };
    }

    setFontSize(size) {
      calls.push(["setFontSize", size]);
    }

    text(value, x, y) {
      calls.push(["text", value, x, y]);
    }

    rect(x, y, width, height) {
      calls.push(["rect", x, y, width, height]);
    }

    addPage() {
      calls.push(["addPage"]);
    }

    save(filename) {
      calls.push(["save", filename]);
    }
  }

  downloadMultiSectionPdf({
    title: "Monthly stakeholder summary",
    sections: [
      { label: "Traffic acquisition", report: { headers: ["channel", "sessions"], rows: [["Organic Search", "120"]] } },
      { label: "Pages and screens", report: { headers: ["pagePath", "views"], rows: [["/", "500"]] } }
    ],
    filename: "ga4-monthly-stakeholder-summary.pdf",
    PdfCtor: PdfStub
  });

  assert.ok(calls.some((call) => call[0] === "text" && call[1] === "Monthly stakeholder summary"));
  assert.ok(calls.some((call) => call[0] === "text" && call[1] === "Traffic acquisition"));
  assert.ok(calls.some((call) => call[0] === "text" && call[1] === "Pages and screens"));
  assert.equal(calls.filter((call) => call[0] === "addPage").length, 1, "should break page once between the two sections, not before the first");
  assert.deepEqual(calls.at(-1), ["save", "ga4-monthly-stakeholder-summary.pdf"]);
});
