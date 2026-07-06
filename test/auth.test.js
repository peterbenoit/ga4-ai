import assert from "node:assert/strict";
import test from "node:test";

import { getGoogleAccessToken } from "../src/auth.js";

test("silent authentication requests a non-interactive token", async () => {
  const calls = [];
  const identity = {
    async getAuthToken(options) {
      calls.push(options);
      return { token: "token-value" };
    }
  };

  const token = await getGoogleAccessToken({ identity });

  assert.equal(token, "token-value");
  assert.deepEqual(calls, [{ interactive: false }]);
});

test("interactive authentication requests an interactive token", async () => {
  const calls = [];
  const identity = {
    async getAuthToken(options) {
      calls.push(options);
      return { token: "token-value" };
    }
  };

  await getGoogleAccessToken({ interactive: true, identity });

  assert.deepEqual(calls, [{ interactive: true }]);
});

test("authentication rejects when Chrome returns no token", async () => {
  const identity = {
    async getAuthToken() {
      return {};
    }
  };

  await assert.rejects(
    getGoogleAccessToken({ identity }),
    new Error("Google did not return an access token.")
  );
});

test("authentication preserves Chrome identity errors", async () => {
  const authError = new Error("OAuth2 request failed");
  const identity = {
    async getAuthToken() {
      throw authError;
    }
  };

  await assert.rejects(getGoogleAccessToken({ identity }), authError);
});

test("authentication fails clearly when the identity API is unavailable", async () => {
  await assert.rejects(
    getGoogleAccessToken({ identity: undefined }),
    new Error("Chrome identity API is unavailable.")
  );
});
