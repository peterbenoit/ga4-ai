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

export function createHistoryController({
  store,
  list,
  empty,
  clearButton,
  documentRef = document,
  windowRef = globalThis.window,
  clipboard = navigator.clipboard,
  onUseQuestion = () => {},
  onRerun = () => {}
}) {
  async function render() {
    const entries = await store.list();
    list.replaceChildren();
    empty.hidden = entries.length > 0;
    clearButton.disabled = entries.length === 0;

    const pinned = entries.filter((entry) => entry.pinned);
    const recent = entries.filter((entry) => !entry.pinned);

    for (const entry of [...pinned, ...recent]) {
      const item = documentRef.createElement("li");
      item.className = "history-item";

      const body = documentRef.createElement("div");
      body.className = "history-item__body";

      const title = documentRef.createElement("p");
      title.className = "history-item__question";
      title.textContent = entry.pinned ? `📌 ${entry.name}` : entry.question;

      const children = [title];

      if (entry.pinned) {
        const question = documentRef.createElement("p");
        question.className = "history-item__answer";
        question.textContent = entry.question;
        children.push(question);
      } else if (entry.answer) {
        const answer = documentRef.createElement("p");
        answer.className = "history-item__answer";
        answer.textContent = entry.answer;
        children.push(answer);
      }

      const meta = documentRef.createElement("p");
      meta.className = "history-item__meta";
      meta.textContent = formatTimestamp(entry.timestamp);
      children.push(meta);

      body.append(...children);

      const actions = documentRef.createElement("div");
      actions.className = "history-item__actions";

      if (entry.pinned) {
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
              const nextName = windowRef.prompt("Rename pinned report", entry.name);
              if (nextName === null) {
                return;
              }
              await store.rename(entry.id, nextName);
              await render();
            }
          }),
          button({
            documentRef,
            text: "Unpin",
            onClick: async () => {
              await store.unpin(entry.id);
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
      } else {
        actions.append(
          button({
            documentRef,
            text: "Use",
            onClick() {
              onUseQuestion(entry.question);
            }
          }),
          button({
            documentRef,
            text: "Pin",
            onClick: async () => {
              const name = windowRef.prompt("Pin this report as", entry.question);
              if (name === null) {
                return;
              }
              await store.pin(entry.id, name);
              await render();
            }
          }),
          button({
            documentRef,
            text: "Copy",
            onClick() {
              return clipboard.writeText(entry.question);
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
      }

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
