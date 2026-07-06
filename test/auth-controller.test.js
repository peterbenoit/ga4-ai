import assert from "node:assert/strict";
import test from "node:test";

import { createAuthController } from "../src/auth-controller.js";

function createElements() {
  let clickHandler;
  const status = { textContent: "" };
  const button = {
    disabled: false,
    hidden: false,
    addEventListener(event, handler) {
      assert.equal(event, "click");
      clickHandler = handler;
    },
    click() {
      return clickHandler();
    }
  };

  return { button, status };
}

test("initial check uses silent authentication and renders connected", async () => {
  const calls = [];
  const elements = createElements();
  const controller = createAuthController({
    ...elements,
    async getAccessToken(options) {
      calls.push(options);
      return "token-value";
    }
  });

  const connected = await controller.check();

  assert.equal(connected, true);
  assert.deepEqual(calls, [{ interactive: false }]);
  assert.equal(elements.status.textContent, "Connected to Google Analytics.");
  assert.equal(elements.button.hidden, true);
});

test("silent authentication failure remains visible and enables connect", async () => {
  const elements = createElements();
  const controller = createAuthController({
    ...elements,
    async getAccessToken() {
      throw new Error("OAuth2 request failed");
    }
  });

  const connected = await controller.check();

  assert.equal(connected, false);
  assert.equal(
    elements.status.textContent,
    "Google authentication failed: OAuth2 request failed"
  );
  assert.equal(elements.button.hidden, false);
  assert.equal(elements.button.disabled, false);
});

test("connect button uses interactive authentication", async () => {
  const calls = [];
  const elements = createElements();
  createAuthController({
    ...elements,
    async getAccessToken(options) {
      calls.push(options);
      return "token-value";
    }
  });

  await elements.button.click();

  assert.deepEqual(calls, [{ interactive: true }]);
  assert.equal(elements.status.textContent, "Connected to Google Analytics.");
  assert.equal(elements.button.hidden, true);
});

test("successful authentication passes the token to the connected handler", async () => {
  const elements = createElements();
  const tokens = [];
  const controller = createAuthController({
    ...elements,
    async getAccessToken() {
      return "token-value";
    },
    async onConnected(token) {
      tokens.push(token);
    }
  });

  await controller.check();

  assert.deepEqual(tokens, ["token-value"]);
});
