import { getGoogleAccessToken } from "./auth.js";
import { createAuthController } from "./auth-controller.js";
import { fetchPropertyMetadata, listAccessibleProperties } from "./ga4-client.js";
import { createPropertyController } from "./property-controller.js";
import { createPropertyStore } from "./property-store.js";

const propertyController = createPropertyController({
  listProperties: listAccessibleProperties,
  fetchMetadata: fetchPropertyMetadata,
  store: createPropertyStore(),
  select: document.querySelector("#property-select"),
  refreshButton: document.querySelector("#refresh-metadata"),
  status: document.querySelector("#metadata-status"),
  createOption(property) {
    const option = document.createElement("option");
    option.value = property.id;
    option.textContent = `${property.name} — ${property.accountName}`;
    return option;
  }
});

const controller = createAuthController({
  getAccessToken: getGoogleAccessToken,
  status: document.querySelector("#auth-status"),
  button: document.querySelector("#connect-google"),
  onConnected(token) {
    return propertyController.initialize(token);
  }
});

void controller.check();
