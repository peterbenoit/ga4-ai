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
  runReport = async () => {
    throw new Error("GA4 report execution is unavailable.");
  },
  renderReport = () => {},
  compose = async () => {
    throw new Error("Answer composition is unavailable.");
  },
  store,
  form,
  input,
  submitButton,
  settingsButton,
  status,
  output,
  answer,
  openOptions,
  getDateRange = () => null,
  onResultReady = () => {},
  onQuestionReady = () => {},
  now = () => new Date()
}) {
  let metadata = null;
  let propertyId = "";
  let token = "";

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
    answer.hidden = true;
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
        dateRange: getDateRange(),
        apiKey
      });

      output.hidden = false;
      if (result.type === "clarification") {
        status.textContent = "Clarification needed.";
        output.textContent = result.question;
      } else {
        output.textContent = JSON.stringify(result.request, null, 2);
        status.textContent = "Running GA4 report…";
        const report = await runReport({
          propertyId,
          request: result.request,
          token
        });
        renderReport(report);

        if (report.rowCount === 0) {
          status.textContent = "No data matches this request.";
        } else {
          status.textContent = "Composing answer…";
          try {
            const composedAnswer = await compose({ question, report, request: result.request, apiKey });
            answer.textContent = composedAnswer;
            answer.hidden = false;
            await onQuestionReady({ question, request: result.request, answer: composedAnswer });
            onResultReady({ question, answer: composedAnswer, report, request: result.request });
          } catch (composeError) {
            status.textContent = errorMessage(composeError);
            return;
          }
          status.textContent = `Report returned ${report.rowCount} ${report.rowCount === 1 ? "row" : "rows"}.`;
        }
      }
    } catch (error) {
      status.textContent = errorMessage(error);
    } finally {
      submitButton.disabled = false;
    }
  });

  return {
    setContext(value) {
      ({ metadata, propertyId, token } = value);
      input.disabled = false;
      submitButton.disabled = false;
    },

    setQuestion(question) {
      input.value = question;
      input.focus?.();
    }
  };
}
