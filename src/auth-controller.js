export function createAuthController({ getAccessToken, status, button }) {
  async function authenticate(interactive) {
    status.textContent = interactive
      ? "Connecting to Google Analytics…"
      : "Checking Google Analytics connection…";
    button.hidden = true;
    button.disabled = true;

    try {
      await getAccessToken({ interactive });
      status.textContent = "Connected to Google Analytics.";
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
