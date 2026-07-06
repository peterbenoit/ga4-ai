export function createSettingsStore({
  storage = globalThis.chrome?.storage?.local
} = {}) {
  if (!storage) {
    throw new Error("Chrome local storage is unavailable.");
  }

  return {
    async getAnthropicApiKey() {
      const result = await storage.get("anthropicApiKey");
      return result.anthropicApiKey ?? "";
    },

    async setAnthropicApiKey(apiKey) {
      await storage.set({ anthropicApiKey: apiKey });
    }
  };
}
