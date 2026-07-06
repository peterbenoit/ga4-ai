import assert from "node:assert/strict";
import test from "node:test";

import { withAuthRetry } from "../src/auth-retry.js";

function unauthorized() {
  const error = new Error("GA4 API error (401): invalid credentials");
  error.status = 401;
  return error;
}

test("a 401 triggers exactly one refresh-and-retry, then succeeds", async () => {
  const calls = [];
  let attempt = 0;
  const fn = async (options) => {
    calls.push(options);
    attempt += 1;
    if (attempt === 1) {
      throw unauthorized();
    }
    return { ok: true };
  };
  const refreshCalls = [];
  const refreshToken = async (staleToken) => {
    refreshCalls.push(staleToken);
    return "fresh-token";
  };

  const wrapped = withAuthRetry(fn, refreshToken);
  const result = await wrapped({ token: "stale-token", propertyId: "100" });

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(refreshCalls, ["stale-token"]);
  assert.deepEqual(calls, [
    { token: "stale-token", propertyId: "100" },
    { token: "fresh-token", propertyId: "100" }
  ]);
});

test("a second 401 after refresh is not retried again", async () => {
  const fn = async () => {
    throw unauthorized();
  };
  const wrapped = withAuthRetry(fn, async () => "fresh-token");

  await assert.rejects(wrapped({ token: "stale-token" }), /GA4 API error \(401\)/);
});

test("non-401 errors are never retried", async () => {
  let attempts = 0;
  const fn = async () => {
    attempts += 1;
    throw new Error("GA4 API error (403): permission denied");
  };
  const wrapped = withAuthRetry(fn, async () => "fresh-token");

  await assert.rejects(wrapped({ token: "t" }), /403/);
  assert.equal(attempts, 1);
});
