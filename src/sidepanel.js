import { getGoogleAccessToken } from "./auth.js";
import { createAuthController } from "./auth-controller.js";
import { composeAnswer } from "./composer.js";
import {
  fetchPropertyMetadata,
  listAccessibleProperties,
  runReport
} from "./ga4-client.js";
import { createPropertyController } from "./property-controller.js";
import { createPropertyStore } from "./property-store.js";
import { createQueryController } from "./query-controller.js";
import { createSettingsStore } from "./settings-store.js";
import { initTabs } from "./tabs.js";
import { translateQuestion } from "./translator.js";

let googleToken = "";

initTabs({
  tabButtons: Array.from(document.querySelectorAll(".tab")),
  panels: Array.from(document.querySelectorAll(".tabpanel"))
});

function renderReport(report) {
  const table = document.querySelector("#report-table");
  const caption = document.createElement("caption");
  caption.textContent = "GA4 report data";
  const head = document.createElement("thead");
  const headerRow = document.createElement("tr");

  for (const header of report.headers) {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = header;
    headerRow.append(cell);
  }
  head.append(headerRow);

  const body = document.createElement("tbody");
  for (const row of report.rows) {
    const tableRow = document.createElement("tr");
    for (const value of row) {
      const cell = document.createElement("td");
      cell.textContent = value;
      tableRow.append(cell);
    }
    body.append(tableRow);
  }

  table.replaceChildren(caption, head, body);
  table.hidden = false;
}

const queryController = createQueryController({
  translate: translateQuestion,
  runReport,
  renderReport,
  compose: composeAnswer,
  store: createSettingsStore(),
  form: document.querySelector("#question-form"),
  input: document.querySelector("#question"),
  submitButton: document.querySelector("#translate-question"),
  settingsButton: document.querySelector("#open-settings"),
  status: document.querySelector("#translation-status"),
  output: document.querySelector("#translation-output"),
  answer: document.querySelector("#answer-output"),
  openOptions() {
    return chrome.runtime.openOptionsPage();
  }
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

const propertyController = createPropertyController({
  listProperties: listAccessibleProperties,
  fetchMetadata: fetchPropertyMetadata,
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
    updatePropertyChip();
    queryController.setContext({
      propertyId,
      metadata,
      token: googleToken
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
