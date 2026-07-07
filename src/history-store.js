const MAX_UNPINNED_ENTRIES = 50;

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

  async function save(entries) {
    await storage.set({ queryHistory: entries });
  }

  function trim(entries) {
    let unpinnedSeen = 0;
    return entries.filter((entry) => {
      if (entry.pinned) {
        return true;
      }
      unpinnedSeen += 1;
      return unpinnedSeen <= MAX_UNPINNED_ENTRIES;
    });
  }

  return {
    list,

    async add({ question, request, answer }) {
      const entry = {
        id: idFactory(),
        question,
        request,
        answer,
        timestamp: now(),
        pinned: false,
        name: null
      };
      const entries = await list();
      await save(trim([entry, ...entries]));
      return entry;
    },

    async pin(id, name) {
      const entries = await list();
      await save(
        entries.map((entry) => (entry.id === id
          ? { ...entry, pinned: true, name: name?.trim() || entry.question }
          : entry))
      );
    },

    async unpin(id) {
      const entries = await list();
      await save(trim(entries.map((entry) => (entry.id === id
        ? { ...entry, pinned: false, name: null }
        : entry))));
    },

    async rename(id, name) {
      const trimmed = name?.trim();
      if (!trimmed) {
        return;
      }
      const entries = await list();
      await save(entries.map((entry) => (entry.id === id ? { ...entry, name: trimmed } : entry)));
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
