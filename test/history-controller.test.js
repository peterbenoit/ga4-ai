import assert from "node:assert/strict";
import test from "node:test";

import { createHistoryController } from "../src/history-controller.js";

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
  return {
    createElement
  };
}

test("history controller renders entries and can populate the Ask tab", async () => {
  const list = createElement();
  const empty = createElement();
  const clearButton = createElement("button");
  const selected = [];
  const controller = createHistoryController({
    store: {
      async list() {
        return [{ id: "1", question: "Users by country", timestamp: Date.UTC(2026, 6, 7) }];
      }
    },
    list,
    empty,
    clearButton,
    documentRef: createDocument(),
    onUseQuestion(question) {
      selected.push(question);
    }
  });

  await controller.initialize();
  const item = list.children[0];
  const useButton = item.children[1].children[0];
  await useButton.click();

  assert.equal(empty.hidden, true);
  assert.equal(clearButton.disabled, false);
  assert.equal(item.children[0].children[0].textContent, "Users by country");
  assert.deepEqual(selected, ["Users by country"]);
});

test("history controller renders saved answers when present", async () => {
  const list = createElement();
  const controller = createHistoryController({
    store: {
      async list() {
        return [{
          id: "1",
          question: "Users by country",
          answer: "The United States had the most active users.",
          timestamp: Date.UTC(2026, 6, 7)
        }];
      }
    },
    list,
    empty: createElement(),
    clearButton: createElement("button"),
    documentRef: createDocument()
  });

  await controller.initialize();

  assert.equal(
    list.children[0].children[0].children[1].textContent,
    "The United States had the most active users."
  );
});

test("history controller copies a question to the clipboard", async () => {
  const copied = [];
  const controller = createHistoryController({
    store: {
      async list() {
        return [{ id: "1", question: "How many users?", timestamp: 1 }];
      }
    },
    list: createElement(),
    empty: createElement(),
    clearButton: createElement("button"),
    documentRef: createDocument(),
    clipboard: {
      async writeText(value) {
        copied.push(value);
      }
    }
  });

  await controller.initialize();
  await controller.elements.list.children[0].children[1].children[1].click();

  assert.deepEqual(copied, ["How many users?"]);
});

test("history controller deletes one entry or clears all entries", async () => {
  const deleted = [];
  let entries = [
    { id: "1", question: "A", timestamp: 1 },
    { id: "2", question: "B", timestamp: 2 }
  ];
  const clearButton = createElement("button");
  const controller = createHistoryController({
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
