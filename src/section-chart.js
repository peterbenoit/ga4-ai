import { selectChartConfig } from "./report-renderer.js";

// Builds a standalone chart image for one report, for contexts (like a
// bundled multi-section PDF) with no on-screen canvas to grab an image
// from. Mirrors the config selectChartConfig already produces for the
// live Ask-tab chart, just rendered off-screen and torn down immediately.
export function buildSectionChartImage({
  report,
  createChart,
  documentRef = document,
  width = 500,
  height = 220
}) {
  const config = selectChartConfig(report);
  if (!config) {
    return null;
  }

  const canvas = documentRef.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const chart = createChart(canvas, {
    ...config,
    options: {
      ...config.options,
      responsive: false,
      animation: false
    }
  });

  const image = chart.toBase64Image();
  chart.destroy();
  return image;
}
