const MAX_HISTORY_ENTRIES = 50;

function defaultIdFactory() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function createHistoryStore({
  storage = globalThis.chrome?.storage?.local,
  idFactory = defaultIdFactory,
  now = Date.now
} = {}) {
  if (!storage) {
    throw new Error("Chrome local storage is unavailable.");
  }

  async function list() {
    const result = await storage.get("queryHistory");
    return result.queryHistory ?? [];
  }

  return {
    list,

    async add({ question, request, answer }) {
      const entry = {
        id: idFactory(),
        question,
        request,
        answer,
        timestamp: now()
      };
      const entries = await list();
      await storage.set({
        queryHistory: [entry, ...entries].slice(0, MAX_HISTORY_ENTRIES)
      });
      return entry;
    },

    async delete(id) {
      const entries = await list();
      await storage.set({
        queryHistory: entries.filter((entry) => entry.id !== id)
      });
    },

    async clear() {
      await storage.set({ queryHistory: [] });
    }
  };
}
