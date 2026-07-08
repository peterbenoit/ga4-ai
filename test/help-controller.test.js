import assert from "node:assert/strict";
import test from "node:test";

import { createHelpController } from "../src/help-controller.js";

function createFakeElement() {
  const handlers = {};
  return {
    handlers,
    textContent: "",
    children: [],
    addEventListener(event, handler) {
      handlers[event] = handler;
    },
    replaceChildren(...nodes) {
      this.children = nodes;
    }
  };
}

function createFakeDocument() {
  return {
    createElement() {
      return { textContent: "" };
    }
  };
}

test("clicking the help button renders the active tab's content and opens the dialog", () => {
  const button = createFakeElement();
  const titleEl = createFakeElement();
  const bodyEl = createFakeElement();
  const closeButton = createFakeElement();
  let opened = false;
  const dialog = { showModal() { opened = true; }, close() {} };

  createHelpController({
    button,
    dialog,
    titleEl,
    bodyEl,
    closeButton,
    content: { report: { title: "Report", body: ["First paragraph.", "Second paragraph."] } },
    getActiveTabId: () => "report",
    documentRef: createFakeDocument()
  });

  button.handlers.click();

  assert.equal(titleEl.textContent, "Report");
  assert.equal(bodyEl.children.length, 2);
  assert.equal(opened, true);
});

test("a tab with no help content shows a fallback message instead of throwing", () => {
  const button = createFakeElement();
  const titleEl = createFakeElement();
  const bodyEl = createFakeElement();
  const closeButton = createFakeElement();
  const dialog = { showModal() {}, close() {} };

  createHelpController({
    button,
    dialog,
    titleEl,
    bodyEl,
    closeButton,
    content: {},
    getActiveTabId: () => "unknown",
    documentRef: createFakeDocument()
  });

  button.handlers.click();

  assert.equal(titleEl.textContent, "Help");
  assert.equal(bodyEl.children.length, 1);
});

test("the close button closes the dialog", () => {
  const button = createFakeElement();
  const titleEl = createFakeElement();
  const bodyEl = createFakeElement();
  const closeButton = createFakeElement();
  let closed = false;
  const dialog = { showModal() {}, close() { closed = true; } };

  createHelpController({
    button,
    dialog,
    titleEl,
    bodyEl,
    closeButton,
    content: {},
    getActiveTabId: () => "ask",
    documentRef: createFakeDocument()
  });

  closeButton.handlers.click();

  assert.equal(closed, true);
});
