export function createHelpController({
  button,
  dialog,
  titleEl,
  bodyEl,
  closeButton,
  content,
  getActiveTabId,
  documentRef = document
}) {
  function renderEntry(entry) {
    if (typeof entry === "string") {
      const p = documentRef.createElement("p");
      p.className = "help-note";
      p.textContent = entry;
      return p;
    }

    const row = documentRef.createElement("div");
    row.className = "help-item";

    const term = documentRef.createElement("p");
    term.className = "help-item__term";
    term.textContent = entry.term;

    const detail = documentRef.createElement("p");
    detail.className = "help-item__detail";
    detail.textContent = entry.detail;

    row.append(term, detail);
    return row;
  }

  function render(tabId) {
    const entry = content[tabId];
    titleEl.textContent = entry?.title ?? "Help";
    bodyEl.replaceChildren(
      ...(entry?.body ?? ["No help is available for this tab yet."]).map(renderEntry)
    );
  }

  button.addEventListener("click", () => {
    render(getActiveTabId());
    dialog.showModal();
  });

  closeButton.addEventListener("click", () => {
    dialog.close();
  });

  return { render };
}
