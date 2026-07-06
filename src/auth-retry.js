export function withAuthRetry(fn, refreshToken) {
  return async (options) => {
    try {
      return await fn(options);
    } catch (error) {
      if (error?.status !== 401) {
        throw error;
      }

      const freshToken = await refreshToken(options.token);
      return await fn({ ...options, token: freshToken });
    }
  };
}
