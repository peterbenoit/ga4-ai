export function createAuthController({
  getAccessToken,
  status,
  button,
  onConnected = async () => {}
}) {
  async function authenticate(interactive) {
    status.textContent = interactive
      ? "Connecting to Google Analytics…"
      : "Checking Google Analytics connection…";
    button.hidden = true;
    button.disabled = true;

    try {
      const token = await getAccessToken({ interactive });
      status.textContent = "Connected to Google Analytics.";
      await onConnected(token);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      status.textContent = `Google authentication failed: ${message}`;
      button.hidden = false;
      return false;
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener("click", () => authenticate(true));

  return {
    check() {
      return authenticate(false);
    }
  };
}
