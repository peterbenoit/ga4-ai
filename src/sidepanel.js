import { getGoogleAccessToken } from "./auth.js";
import { createAuthController } from "./auth-controller.js";
import { withAuthRetry } from "./auth-retry.js";
import { composeAnswer } from "./composer.js";
import { createDateRangePicker } from "./date-range-picker.js";
import flatpickr from "./vendor/flatpickr/index.js";
import {
  fetchPropertyMetadata,
  listAccessibleProperties,
  runReport
} from "./ga4-client.js";
import { createPropertyController } from "./property-controller.js";
import { createPropertyStore } from "./property-store.js";
import { createQueryController } from "./query-controller.js";
import { createHistoryController } from "./history-controller.js";
import { createHistoryStore } from "./history-store.js";
import { createSavedReportController } from "./saved-report-controller.js";
import { createSavedReportStore } from "./saved-report-store.js";
import { downloadChartImage, downloadCsv, downloadPdfSummary } from "./report-export.js";
import { renderReport as renderReportView } from "./report-renderer.js";
import { createSettingsStore } from "./settings-store.js";
import { initTabs } from "./tabs.js";
import { translateQuestion } from "./translator.js";

let googleToken = "";

async function refreshGoogleToken(staleToken) {
  googleToken = await getGoogleAccessToken({ interactive: false, staleToken });
  return googleToken;
}

const runReportWithRetry = withAuthRetry(runReport, refreshGoogleToken);
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
let lastQuestion = null;
const settingsStore = createSettingsStore();
const saveReportButton = document.querySelector("#save-report");
const exportCsvButton = document.querySelector("#export-csv");
const exportChartButton = document.querySelector("#export-chart");
const exportPdfButton = document.querySelector("#export-pdf");
const reportTable = document.querySelector("#report-table");
const toggleRawTableButton = document.querySelector("#toggle-raw-table");

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
    await historyStore.add({ question, request, answer });
    await historyController.refresh();
  },
  onResultReady(summary) {
    currentSummary = summary;
    exportPdfButton.disabled = false;
    lastQuestion = { question: summary.question, request: summary.request };
    saveReportButton.hidden = false;
    saveReportButton.disabled = false;
  },
  openOptions() {
    return chrome.runtime.openOptionsPage();
  }
});

const historyStore = createHistoryStore();
const historyController = createHistoryController({
  store: historyStore,
  list: document.querySelector("#history-list"),
  empty: document.querySelector("#history-empty"),
  clearButton: document.querySelector("#clear-history"),
  onUseQuestion(question) {
    queryController.setQuestion(question);
    tabs.select("ask");
  }
});

void historyController.initialize();

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

const propertyController = createPropertyController({
  listProperties: listAccessiblePropertiesWithRetry,
  fetchMetadata: fetchPropertyMetadataWithRetry,
  store: createPropertyStore(),
  select: propertySelect,
  refreshButton: document.querySelector("#refresh-metadata"),
  status: document.querySelector("#metadata-status"),
  createOption(property) {
    const option = document.createElement("option");
    option.value = property.id;
    option.textContent = `${property.name} — ${property.accountName}`;
    return option;
  },
  onMetadataReady({ propertyId, metadata }) {
    currentPropertyId = propertyId;
    updatePropertyChip();
    queryController.setContext({
      propertyId,
      metadata,
      token: googleToken
    });
  }
});

saveReportButton.addEventListener("click", async () => {
  if (!lastQuestion) {
    return;
  }
  const name = window.prompt("Name this saved report", lastQuestion.question);
  if (name === null) {
    return;
  }
  await savedReportStore.add({ name, question: lastQuestion.question, request: lastQuestion.request });
  await savedReportController.refresh();
});

const savedStatus = document.querySelector("#saved-status");
const savedReportStore = createSavedReportStore();
const savedReportController = createSavedReportController({
  store: savedReportStore,
  list: document.querySelector("#saved-list"),
  empty: document.querySelector("#saved-empty"),
  clearButton: document.querySelector("#clear-saved"),
  async onRerun(entry) {
    if (!currentPropertyId) {
      savedStatus.textContent = "Select a property before re-running a saved report.";
      return;
    }

    const dateRange = dateRangePicker.getRange();
    const request = {
      ...entry.request,
      dateRanges: dateRange ? [dateRange] : entry.request.dateRanges
    };

    savedStatus.textContent = "Running saved report…";
    try {
      const report = await runReportWithRetry({
        propertyId: currentPropertyId,
        request,
        token: googleToken
      });
      renderReport(report);
      tabs.select("report");
      savedStatus.textContent = `Report returned ${report.rowCount} ${report.rowCount === 1 ? "row" : "rows"}.`;

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
      savedStatus.textContent = error instanceof Error ? error.message : String(error);
    }
  }
});

void savedReportController.initialize();

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
