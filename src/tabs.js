export function selectTab(tabIds, targetId) {
  if (!tabIds.includes(targetId)) {
    throw new Error(`Unknown tab id: ${targetId}`);
  }
  return tabIds.map((id) => ({ id, active: id === targetId }));
}

export function initTabs({ tabButtons, panels, onSelect = () => {} }) {
  const tabIds = tabButtons.map((button) => button.dataset.tab);

  function apply(targetId) {
    const states = selectTab(tabIds, targetId);

    for (const state of states) {
      const button = tabButtons.find((candidate) => candidate.dataset.tab === state.id);
      const panel = panels.find((candidate) => candidate.dataset.tabpanel === state.id);

      button.classList.toggle("is-active", state.active);
      button.setAttribute("aria-selected", String(state.active));
      button.tabIndex = state.active ? 0 : -1;
      panel.hidden = !state.active;
    }

    onSelect(targetId);
  }

  for (const button of tabButtons) {
    button.addEventListener("click", () => apply(button.dataset.tab));
  }

  apply(tabIds[0]);

  return { select: apply };
}
