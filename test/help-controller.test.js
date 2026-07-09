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
      return {
        textContent: "",
        className: "",
        children: [],
        append(...nodes) {
          this.children.push(...nodes);
        }
      };
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

test("a {term, detail} body entry renders as a labeled block with both parts, distinct from a plain-string paragraph", () => {
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
    content: {
      ask: {
        title: "Ask",
        body: [
          "Intro paragraph.",
          { term: "Quick reports", detail: "Pre-built questions that run immediately." }
        ]
      }
    },
    getActiveTabId: () => "ask",
    documentRef: createFakeDocument()
  });

  button.handlers.click();

  assert.equal(bodyEl.children.length, 2);
  const [intro, item] = bodyEl.children;
  assert.equal(intro.className, "help-note");
  assert.equal(intro.textContent, "Intro paragraph.");
  assert.equal(item.className, "help-item");
  assert.equal(item.children.length, 2);
  assert.equal(item.children[0].className, "help-item__term");
  assert.equal(item.children[0].textContent, "Quick reports");
  assert.equal(item.children[1].className, "help-item__detail");
  assert.equal(item.children[1].textContent, "Pre-built questions that run immediately.");
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
