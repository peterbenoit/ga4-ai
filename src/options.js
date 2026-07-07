import { createPropertyStore } from "./property-store.js";
import { createSettingsStore } from "./settings-store.js";

const store = createSettingsStore();
const form = document.querySelector("#api-key-form");
const input = document.querySelector("#anthropic-api-key");
const status = document.querySelector("#options-status");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const apiKey = input.value.trim();

  if (!apiKey) {
    status.textContent = "Enter an Anthropic API key.";
    return;
  }

  await store.setAnthropicApiKey(apiKey);
  input.value = "";
  status.textContent = "Anthropic API key saved.";
});

const existingKey = await store.getAnthropicApiKey();
status.textContent = existingKey
  ? "An Anthropic API key is saved. Enter a new key to replace it."
  : "No Anthropic API key is saved.";

const propertyStore = createPropertyStore();
const eventDictionaryForm = document.querySelector("#event-dictionary-form");
const eventDictionaryPropertyId = document.querySelector("#event-dictionary-property-id");
const eventDictionaryText = document.querySelector("#event-dictionary-text");
const eventDictionaryStatus = document.querySelector("#event-dictionary-status");
const loadEventDictionaryButton = document.querySelector("#load-event-dictionary");

loadEventDictionaryButton.addEventListener("click", async () => {
  const propertyId = eventDictionaryPropertyId.value.trim();

  if (!propertyId) {
    eventDictionaryStatus.textContent = "Enter a GA4 property ID first.";
    return;
  }

  eventDictionaryText.value = await propertyStore.getEventDictionary(propertyId);
  eventDictionaryStatus.textContent = eventDictionaryText.value
    ? `Loaded the saved event dictionary for property ${propertyId}.`
    : `No event dictionary saved yet for property ${propertyId}.`;
});

eventDictionaryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const propertyId = eventDictionaryPropertyId.value.trim();

  if (!propertyId) {
    eventDictionaryStatus.textContent = "Enter a GA4 property ID first.";
    return;
  }

  await propertyStore.setEventDictionary(propertyId, eventDictionaryText.value.trim());
  eventDictionaryStatus.textContent = `Event dictionary saved for property ${propertyId}.`;
});
