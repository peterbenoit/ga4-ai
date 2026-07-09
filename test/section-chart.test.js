import assert from "node:assert/strict";
import test from "node:test";

import { buildSectionChartImage } from "../src/section-chart.js";

function fakeDocument(canvases) {
  return {
    createElement(tagName) {
      assert.equal(tagName, "canvas");
      const canvas = {};
      canvases.push(canvas);
      return canvas;
    }
  };
}

test("buildSectionChartImage returns null and never creates a chart for an unchartable report", () => {
  const canvases = [];
  const created = [];

  const image = buildSectionChartImage({
    report: { headers: ["onlyOneColumn"], rows: [["x"]] },
    documentRef: fakeDocument(canvases),
    createChart(canvas, config) {
      created.push({ canvas, config });
      return { toBase64Image: () => "data:image/png;base64,x", destroy() {} };
    }
  });

  assert.equal(image, null);
  assert.equal(created.length, 0);
  assert.equal(canvases.length, 0);
});

test("buildSectionChartImage renders off-screen, captures the image, and tears the chart down", () => {
  const canvases = [];
  const destroyed = [];

  const image = buildSectionChartImage({
    report: { headers: ["channel", "sessions"], rows: [["Organic Search", "120"], ["Direct", "80"]] },
    documentRef: fakeDocument(canvases),
    createChart(canvas, config) {
      assert.equal(canvas.width, 500);
      assert.equal(canvas.height, 220);
      assert.equal(config.options.responsive, false);
      assert.equal(config.options.animation, false);
      return {
        toBase64Image: () => "data:image/png;base64,chart",
        destroy() {
          destroyed.push(true);
        }
      };
    }
  });

  assert.equal(image, "data:image/png;base64,chart");
  assert.equal(canvases.length, 1);
  assert.deepEqual(destroyed, [true]);
});
