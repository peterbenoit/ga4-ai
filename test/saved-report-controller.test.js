import assert from "node:assert/strict";
import test from "node:test";

import { createSavedReportController } from "../src/saved-report-controller.js";

function createElement(tagName = "div") {
  const handlers = {};
  return {
    tagName,
    children: [],
    dataset: {},
    hidden: false,
    disabled: false,
    className: "",
    textContent: "",
    append(...children) {
      this.children.push(...children);
    },
    replaceChildren(...children) {
      this.children = children;
    },
    addEventListener(event, handler) {
      handlers[event] = handler;
    },
    click() {
      return handlers.click?.({ preventDefault() {} });
    }
  };
}

function createDocument() {
  return { createElement };
}

test("saved report controller renders entries and triggers re-run", async () => {
  const list = createElement();
  const rerun = [];
  const controller = createSavedReportController({
    store: {
      async list() {
        return [{
          id: "1",
          name: "Weekly traffic",
          question: "Users by country last 7 days",
          request: {},
          timestamp: Date.UTC(2026, 6, 7)
        }];
      }
    },
    list,
    empty: createElement(),
    clearButton: createElement("button"),
    documentRef: createDocument(),
    onRerun(entry) {
      rerun.push(entry.id);
    }
  });

  await controller.initialize();
  const item = list.children[0];
  assert.equal(item.children[0].children[0].textContent, "Weekly traffic");
  assert.equal(item.children[0].children[1].textContent, "Users by country last 7 days");

  await item.children[1].children[0].click();
  assert.deepEqual(rerun, ["1"]);
});

test("saved report controller renames an entry", async () => {
  let entries = [{ id: "1", name: "Old name", question: "Q?", request: {}, timestamp: 1 }];
  const list = createElement();
  const controller = createSavedReportController({
    store: {
      async list() {
        return entries;
      },
      async rename(id, name) {
        entries = entries.map((entry) => (entry.id === id ? { ...entry, name } : entry));
      }
    },
    list,
    empty: createElement(),
    clearButton: createElement("button"),
    documentRef: createDocument(),
    windowRef: { prompt: () => "New name" }
  });

  await controller.initialize();
  await list.children[0].children[1].children[1].click();

  assert.equal(entries[0].name, "New name");
});

test("saved report controller deletes one entry or clears all entries", async () => {
  const deleted = [];
  let entries = [
    { id: "1", name: "A", question: "A?", request: {}, timestamp: 1 },
    { id: "2", name: "B", question: "B?", request: {}, timestamp: 2 }
  ];
  const clearButton = createElement("button");
  const controller = createSavedReportController({
    store: {
      async list() {
        return entries;
      },
      async delete(id) {
        deleted.push(id);
        entries = entries.filter((entry) => entry.id !== id);
      },
      async clear() {
        entries = [];
      }
    },
    list: createElement(),
    empty: createElement(),
    clearButton,
    documentRef: createDocument()
  });

  await controller.initialize();
  await controller.elements.list.children[0].children[1].children[2].click();

  assert.deepEqual(deleted, ["1"]);
  assert.equal(controller.elements.list.children.length, 1);

  await clearButton.click();

  assert.equal(controller.elements.list.children.length, 0);
  assert.equal(controller.elements.empty.hidden, false);
  assert.equal(clearButton.disabled, true);
});
