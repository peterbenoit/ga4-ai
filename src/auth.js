export async function getGoogleAccessToken({
  interactive = false,
  staleToken = null,
  identity = globalThis.chrome?.identity
} = {}) {
  if (!identity?.getAuthToken) {
    throw new Error("Chrome identity API is unavailable.");
  }

  if (staleToken) {
    await identity.removeCachedAuthToken?.({ token: staleToken });
  }

  const result = await identity.getAuthToken({ interactive });
  const token = typeof result === "string" ? result : result?.token;

  if (!token) {
    throw new Error("Google did not return an access token.");
  }

  return token;
}
