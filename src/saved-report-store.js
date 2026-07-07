function defaultIdFactory() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function createSavedReportStore({
  storage = globalThis.chrome?.storage?.local,
  idFactory = defaultIdFactory,
  now = Date.now
} = {}) {
  if (!storage) {
    throw new Error("Chrome local storage is unavailable.");
  }

  async function list() {
    const result = await storage.get("savedReports");
    return result.savedReports ?? [];
  }

  async function save(entries) {
    await storage.set({ savedReports: entries });
  }

  return {
    list,

    async add({ name, question, request }) {
      const entry = {
        id: idFactory(),
        name: name?.trim() || question,
        question,
        request,
        timestamp: now()
      };
      const entries = await list();
      await save([entry, ...entries]);
      return entry;
    },

    async rename(id, name) {
      const trimmed = name?.trim();
      if (!trimmed) {
        return;
      }
      const entries = await list();
      await save(
        entries.map((entry) => (entry.id === id ? { ...entry, name: trimmed } : entry))
      );
    },

    async delete(id) {
      const entries = await list();
      await save(entries.filter((entry) => entry.id !== id));
    },

    async clear() {
      await save([]);
    }
  };
}
