function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

export function todayInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function createQueryController({
  translate,
  store,
  form,
  input,
  submitButton,
  settingsButton,
  status,
  output,
  openOptions,
  now = () => new Date()
}) {
  let metadata = null;

  settingsButton.addEventListener("click", () => openOptions());
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = input.value.trim();

    if (!question) {
      status.textContent = "Enter a GA4 question.";
      return;
    }
    if (!metadata) {
      status.textContent = "Select a property and load its metadata first.";
      return;
    }

    submitButton.disabled = true;
    settingsButton.hidden = true;
    output.hidden = true;
    status.textContent = "Translating question into a GA4 request…";

    try {
      const apiKey = await store.getAnthropicApiKey();
      if (!apiKey) {
        status.textContent = "Anthropic API key is not configured.";
        settingsButton.hidden = false;
        return;
      }

      const result = await translate({
        question,
        metadata,
        today: todayInTimeZone(now(), metadata.timeZone),
        apiKey
      });

      output.hidden = false;
      if (result.type === "clarification") {
        status.textContent = "Clarification needed.";
        output.textContent = result.question;
      } else {
        status.textContent = "GA4 request ready.";
        output.textContent = JSON.stringify(result.request, null, 2);
      }
    } catch (error) {
      status.textContent = errorMessage(error);
    } finally {
      submitButton.disabled = false;
    }
  });

  return {
    setMetadata(value) {
      metadata = value;
      input.disabled = false;
      submitButton.disabled = false;
    }
  };
}
