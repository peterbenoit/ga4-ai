export function createPropertyStore({
  storage = globalThis.chrome?.storage?.local
} = {}) {
  if (!storage) {
    throw new Error("Chrome local storage is unavailable.");
  }

  return {
    async getLastUsedPropertyId() {
      const result = await storage.get("lastUsedPropertyId");
      return result.lastUsedPropertyId ?? null;
    },

    async setLastUsedPropertyId(propertyId) {
      await storage.set({ lastUsedPropertyId: propertyId });
    },

    async getCachedMetadata(propertyId) {
      const result = await storage.get("propertyMetadataCache");
      return result.propertyMetadataCache?.[propertyId] ?? null;
    },

    async setCachedMetadata(propertyId, metadata) {
      const result = await storage.get("propertyMetadataCache");
      await storage.set({
        propertyMetadataCache: {
          ...(result.propertyMetadataCache ?? {}),
          [propertyId]: metadata
        }
      });
    },

    async getEventDictionary(propertyId) {
      const result = await storage.get("propertyEventDictionaries");
      return result.propertyEventDictionaries?.[propertyId] ?? "";
    },

    async setEventDictionary(propertyId, text) {
      const result = await storage.get("propertyEventDictionaries");
      await storage.set({
        propertyEventDictionaries: {
          ...(result.propertyEventDictionaries ?? {}),
          [propertyId]: text
        }
      });
    }
  };
}
