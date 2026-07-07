function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}

function button({ documentRef, text, className = "btn btn--ghost btn--sm", onClick }) {
  const element = documentRef.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = text;
  element.addEventListener("click", onClick);
  return element;
}

export function createSavedReportController({
  store,
  list,
  empty,
  clearButton,
  documentRef = document,
  windowRef = globalThis.window,
  onRerun = () => {}
}) {
  async function render() {
    const entries = await store.list();
    list.replaceChildren();
    empty.hidden = entries.length > 0;
    clearButton.disabled = entries.length === 0;

    for (const entry of entries) {
      const item = documentRef.createElement("li");
      item.className = "history-item";

      const body = documentRef.createElement("div");
      body.className = "history-item__body";

      const name = documentRef.createElement("p");
      name.className = "history-item__question";
      name.textContent = entry.name;

      const question = documentRef.createElement("p");
      question.className = "history-item__answer";
      question.textContent = entry.question;

      const meta = documentRef.createElement("p");
      meta.className = "history-item__meta";
      meta.textContent = formatTimestamp(entry.timestamp);

      body.append(name, question, meta);

      const actions = documentRef.createElement("div");
      actions.className = "history-item__actions";
      actions.append(
        button({
          documentRef,
          text: "Re-run",
          className: "btn btn--primary btn--sm",
          onClick() {
            onRerun(entry);
          }
        }),
        button({
          documentRef,
          text: "Rename",
          onClick: async () => {
            const nextName = windowRef.prompt("Rename saved report", entry.name);
            if (nextName === null) {
              return;
            }
            await store.rename(entry.id, nextName);
            await render();
          }
        }),
        button({
          documentRef,
          text: "Delete",
          onClick: async () => {
            await store.delete(entry.id);
            await render();
          }
        })
      );

      item.append(body, actions);
      list.append(item);
    }
  }

  clearButton.addEventListener("click", async () => {
    await store.clear();
    await render();
  });

  return {
    elements: { list, empty, clearButton },
    initialize: render,
    refresh: render
  };
}
