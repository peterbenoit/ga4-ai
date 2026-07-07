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
  clipboard = navigator.clipboard,
  onUseQuestion = () => {}
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

      const question = documentRef.createElement("p");
      question.className = "history-item__question";
      question.textContent = entry.question;

      const children = [question];
      if (entry.answer) {
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
