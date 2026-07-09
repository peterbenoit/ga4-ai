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

test("every body entry is either a non-empty string or a well-formed {term, detail} pair", () => {
  for (const tabId of TAB_IDS) {
    for (const item of HELP_CONTENT[tabId].body) {
      if (typeof item === "string") {
        assert.ok(item.length > 0, `${tabId}: empty string entry`);
      } else {
        assert.ok(item.term, `${tabId}: entry missing term`);
        assert.ok(item.detail, `${tabId}: entry missing detail for term "${item.term}"`);
      }
    }
  }
});
