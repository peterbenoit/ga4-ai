export async function getGoogleAccessToken({
  interactive = false,
  identity = globalThis.chrome?.identity
} = {}) {
  if (!identity?.getAuthToken) {
    throw new Error("Chrome identity API is unavailable.");
  }

  const result = await identity.getAuthToken({ interactive });
  const token = typeof result === "string" ? result : result?.token;

  if (!token) {
    throw new Error("Google did not return an access token.");
  }

  return token;
}
