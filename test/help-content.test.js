import assert from "node:assert/strict";
import test from "node:test";

import { HELP_CONTENT } from "../src/help-content.js";

const TAB_IDS = ["ask", "property", "report", "history"];

test("every tab has help content with a title and at least one paragraph", () => {
  for (const tabId of TAB_IDS) {
    const entry = HELP_CONTENT[tabId];
    assert.ok(entry, `missing help content for tab: ${tabId}`);
    assert.ok(entry.title, `missing title for tab: ${tabId}`);
    assert.ok(Array.isArray(entry.body) && entry.body.length > 0, `missing body for tab: ${tabId}`);
  }
});
