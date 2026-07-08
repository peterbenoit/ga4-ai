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
  function render(tabId) {
    const entry = content[tabId];
    titleEl.textContent = entry?.title ?? "Help";
    bodyEl.replaceChildren(
      ...(entry?.body ?? ["No help is available for this tab yet."]).map((paragraph) => {
        const p = documentRef.createElement("p");
        p.textContent = paragraph;
        return p;
      })
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
