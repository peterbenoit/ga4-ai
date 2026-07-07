function button({ documentRef, text, title, onClick }) {
  const element = documentRef.createElement("button");
  element.type = "button";
  element.className = "btn btn--ghost btn--sm";
  element.textContent = text;
  if (title) {
    element.title = title;
  }
  element.addEventListener("click", onClick);
  return element;
}

export function createPresetController({
  presets,
  container,
  documentRef = document,
  onRun = () => {}
}) {
  container.replaceChildren(
    ...presets.map((preset) => button({
      documentRef,
      text: preset.label,
      title: preset.description,
      onClick() {
        onRun(preset);
      }
    }))
  );

  return { elements: { container } };
}
