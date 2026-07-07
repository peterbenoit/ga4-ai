import { getGoogleAccessToken } from "./auth.js";
import { createAuthController } from "./auth-controller.js";
import { withAuthRetry } from "./auth-retry.js";
import { composeAnswer } from "./composer.js";
import { createDateRangePicker } from "./date-range-picker.js";
import flatpickr from "./vendor/flatpickr/index.js";
import { resolvePresetRange } from "./date-range.js";
import {
  fetchPropertyMetadata,
  listAccessibleProperties,
  runReport,
  runRealtimeReport
} from "./ga4-client.js";
import { createPresetController } from "./preset-controller.js";
import { PRESETS } from "./presets.js";
import { createPropertyController } from "./property-controller.js";
import { createPropertyStore } from "./property-store.js";
import { createQueryController, todayInTimeZone } from "./query-controller.js";
import { createHistoryController } from "./history-controller.js";
import { createHistoryStore } from "./history-store.js";
import { downloadChartImage, downloadCsv, downloadPdfSummary } from "./report-export.js";
import { renderReport as renderReportView } from "./report-renderer.js";
import { validateReportRequest } from "./request-validator.js";
import { createSettingsStore } from "./settings-store.js";
import { initTabs } from "./tabs.js";
import { translateQuestion } from "./translator.js";

let googleToken = "";

async function refreshGoogleToken(staleToken) {
  googleToken = await getGoogleAccessToken({ interactive: false, staleToken });
  return googleToken;
}

const runReportWithRetry = withAuthRetry(runReport, refreshGoogleToken);
const runRealtimeReportWithRetry = withAuthRetry(runRealtimeReport, refreshGoogleToken);
const fetchPropertyMetadataWithRetry = withAuthRetry(fetchPropertyMetadata, refreshGoogleToken);
const listAccessiblePropertiesWithRetry = withAuthRetry(listAccessibleProperties, refreshGoogleToken);

const tabs = initTabs({
  tabButtons: Array.from(document.querySelectorAll(".tab")),
  panels: Array.from(document.querySelectorAll(".tabpanel"))
});

let currentChart = null;
let currentReport = null;
let currentSummary = null;
let currentPropertyId = "";
let currentMetadata = null;
let lastHistoryEntry = null;
const settingsStore = createSettingsStore();
const pinReportButton = document.querySelector("#pin-report");
const exportCsvButton = document.querySelector("#export-csv");
const exportChartButton = document.querySelector("#export-chart");
const exportPdfButton = document.querySelector("#export-pdf");
const reportTable = document.querySelector("#report-table");
const toggleRawTableButton = document.querySelector("#toggle-raw-table");
const statRows = document.querySelector("#stat-rows");
const statColumns = document.querySelector("#stat-columns");

let rawTableVisible = false;

function applyRawTableVisibility() {
  reportTable.hidden = !rawTableVisible;
  toggleRawTableButton.textContent = rawTableVisible ? "Hide raw table" : "Show raw table";
}

toggleRawTableButton.addEventListener("click", () => {
  rawTableVisible = !rawTableVisible;
  applyRawTableVisibility();
});

function renderReport(report) {
  currentReport = report;
  statRows.textContent = String(report.rowCount);
  statColumns.textContent = String(report.headers.length);
  currentChart = renderReportView({
    report,
    table: reportTable,
    canvas: document.querySelector("#report-chart"),
    chartNote: document.querySelector("#report-chart-note"),
    previousChart: currentChart,
    createChart(canvas, config) {
      return new globalThis.Chart(canvas, config);
    }
  });
  exportCsvButton.disabled = false;
  exportChartButton.disabled = !currentChart;
  exportPdfButton.disabled = true;
  toggleRawTableButton.disabled = false;
  applyRawTableVisibility();
}

exportCsvButton.addEventListener("click", () => {
  if (!currentReport) {
    return;
  }

  downloadCsv({
    report: currentReport,
    filename: `ga4-report-${new Date().toISOString().slice(0, 10)}.csv`
  });
});

exportChartButton.addEventListener("click", () => {
  if (!currentChart) {
    return;
  }

  downloadChartImage({
    chart: currentChart,
    filename: `ga4-chart-${new Date().toISOString().slice(0, 10)}.png`
  });
});

exportPdfButton.addEventListener("click", () => {
  if (!currentSummary) {
    return;
  }

  downloadPdfSummary({
    ...currentSummary,
    chart: currentChart,
    filename: `ga4-summary-${new Date().toISOString().slice(0, 10)}.pdf`,
    PdfCtor: globalThis.jspdf.jsPDF
  });
});

const dateRangePicker = createDateRangePicker({
  presetSelect: document.querySelector("#date-preset"),
  customFields: document.querySelector("#date-range-custom"),
  startInput: document.querySelector("#date-start"),
  endInput: document.querySelector("#date-end"),
  flatpickrFactory: flatpickr
});

const queryController = createQueryController({
  translate: translateQuestion,
  runReport: runReportWithRetry,
  renderReport,
  compose: composeAnswer,
  store: settingsStore,
  form: document.querySelector("#question-form"),
  input: document.querySelector("#question"),
  submitButton: document.querySelector("#translate-question"),
  settingsButton: document.querySelector("#open-settings"),
  status: document.querySelector("#translation-status"),
  output: document.querySelector("#translation-output"),
  answer: document.querySelector("#answer-output"),
  getDateRange: dateRangePicker.getRange,
  async onQuestionReady({ question, request, answer }) {
    lastHistoryEntry = await historyStore.add({ question, request, answer });
    await historyController.refresh();
  },
  onQuestionStart() {
    lastHistoryEntry = null;
    pinReportButton.hidden = true;
    pinReportButton.disabled = true;
  },
  onResultReady(summary) {
    currentSummary = summary;
    exportPdfButton.disabled = false;
    if (lastHistoryEntry) {
      pinReportButton.hidden = false;
      pinReportButton.disabled = false;
    }
  },
  openOptions() {
    return chrome.runtime.openOptionsPage();
  }
});

const historyStatus = document.querySelector("#history-status");
const historyStore = createHistoryStore();
const historyController = createHistoryController({
  store: historyStore,
  list: document.querySelector("#history-list"),
  empty: document.querySelector("#history-empty"),
  clearButton: document.querySelector("#clear-history"),
  onUseQuestion(question) {
    queryController.setQuestion(question);
    tabs.select("ask");
  },
  async onRerun(entry) {
    if (!currentPropertyId) {
      historyStatus.textContent = "Select a property before re-running a pinned report.";
      return;
    }

    const dateRange = dateRangePicker.getRange();
    const request = {
      ...entry.request,
      dateRanges: dateRange ? [dateRange] : entry.request.dateRanges
    };

    historyStatus.textContent = "Running pinned report…";
    try {
      const report = await runReportWithRetry({
        propertyId: currentPropertyId,
        request,
        token: googleToken
      });
      renderReport(report);
      tabs.select("report");
      historyStatus.textContent = `Report returned ${report.rowCount} ${report.rowCount === 1 ? "row" : "rows"}.`;

      const apiKey = await settingsStore.getAnthropicApiKey();
      if (report.rowCount > 0 && apiKey) {
        const composedAnswer = await composeAnswer({
          question: entry.question,
          report,
          request,
          apiKey
        });
        currentSummary = { question: entry.question, answer: composedAnswer, report, request };
        exportPdfButton.disabled = false;
      }
    } catch (error) {
      historyStatus.textContent = error instanceof Error ? error.message : String(error);
    }
  }
});

void historyController.initialize();

pinReportButton.addEventListener("click", async () => {
  if (!lastHistoryEntry) {
    return;
  }
  const name = window.prompt("Pin this report as", lastHistoryEntry.question);
  if (name === null) {
    return;
  }
  await historyStore.pin(lastHistoryEntry.id, name);
  await historyController.refresh();
});

const presetStatus = document.querySelector("#preset-status");

async function runPreset(preset) {
  if (!currentPropertyId || !currentMetadata) {
    presetStatus.textContent = "Select a property and load its metadata first.";
    return;
  }

  const dateRange = dateRangePicker.getRange()
    ?? resolvePresetRange("last30", todayInTimeZone(new Date(), currentMetadata.timeZone));
  const request = preset.request(dateRange, currentMetadata);

  if (preset.kind === "report") {
    const errors = validateReportRequest(request, currentMetadata);
    if (errors.length > 0) {
      presetStatus.textContent = `This property doesn't support "${preset.label}": ${errors.join("; ")}`;
      return;
    }
  }

  presetStatus.textContent = `Running ${preset.label}…`;
  try {
    const run = preset.kind === "realtime" ? runRealtimeReportWithRetry : runReportWithRetry;
    const report = await run({ propertyId: currentPropertyId, request, token: googleToken });
    renderReport(report);
    tabs.select("report");
    presetStatus.textContent = `Report returned ${report.rowCount} ${report.rowCount === 1 ? "row" : "rows"}.`;

    if (report.rowCount === 0) {
      return;
    }

    const apiKey = await settingsStore.getAnthropicApiKey();
    if (!apiKey) {
      return;
    }

    const composedAnswer = await composeAnswer({ question: preset.label, report, request, apiKey });
    currentSummary = { question: preset.label, answer: composedAnswer, report, request };
    exportPdfButton.disabled = false;
    lastHistoryEntry = await historyStore.add({ question: preset.label, request, answer: composedAnswer });
    pinReportButton.hidden = false;
    pinReportButton.disabled = false;
    await historyController.refresh();
  } catch (error) {
    presetStatus.textContent = error instanceof Error ? error.message : String(error);
  }
}

createPresetController({
  presets: PRESETS,
  container: document.querySelector("#preset-list"),
  onRun: runPreset
});

const propertySelect = document.querySelector("#property-select");
const propertyChip = document.querySelector("#toolbar-property-chip");

function updatePropertyChip() {
  const selectedOption = propertySelect.selectedOptions[0];
  if (!selectedOption || selectedOption.disabled) {
    propertyChip.textContent = "Property: none selected";
    return;
  }

  const [propertyName] = selectedOption.textContent.split(" — ");
  propertyChip.textContent = `Property: ${propertyName}`;
  propertyChip.title = selectedOption.textContent;
}

propertySelect.addEventListener("change", updatePropertyChip);

const propertyStore = createPropertyStore();

const propertyController = createPropertyController({
  listProperties: listAccessiblePropertiesWithRetry,
  fetchMetadata: fetchPropertyMetadataWithRetry,
  store: propertyStore,
  select: propertySelect,
  refreshButton: document.querySelector("#refresh-metadata"),
  status: document.querySelector("#metadata-status"),
  createOption(property) {
    const option = document.createElement("option");
    option.value = property.id;
    option.textContent = `${property.name} — ${property.accountName}`;
    return option;
  },
  async onMetadataReady({ propertyId, metadata }) {
    currentPropertyId = propertyId;
    currentMetadata = metadata;
    updatePropertyChip();
    const eventDictionary = await propertyStore.getEventDictionary(propertyId);
    queryController.setContext({
      propertyId,
      metadata,
      token: googleToken,
      eventDictionary
    });
  }
});

const controller = createAuthController({
  getAccessToken: getGoogleAccessToken,
  status: document.querySelector("#auth-status"),
  button: document.querySelector("#connect-google"),
  onConnected(token) {
    googleToken = token;
    return propertyController.initialize(token);
  }
});

void controller.check();
