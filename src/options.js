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
