import assert from "node:assert/strict";
import test from "node:test";

import { createPresetController } from "../src/preset-controller.js";

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
    title: "",
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
      return handlers.click?.();
    }
  };
}

function createDocument() {
  return { createElement };
}

test("preset controller renders one button per preset with its description as a tooltip", () => {
  const container = createElement();
  const presets = [
    { id: "a", label: "Traffic acquisition", description: "Sessions by channel." },
    { id: "b", label: "Realtime", description: "Active users right now." }
  ];

  createPresetController({ presets, container, documentRef: createDocument() });

  assert.equal(container.children.length, 2);
  assert.equal(container.children[0].textContent, "Traffic acquisition");
  assert.equal(container.children[0].title, "Sessions by channel.");
  assert.equal(container.children[1].textContent, "Realtime");
});

test("clicking a preset button invokes onRun with that preset", () => {
  const container = createElement();
  const presets = [{ id: "a", label: "Traffic acquisition", description: "Sessions by channel." }];
  const run = [];

  createPresetController({
    presets,
    container,
    documentRef: createDocument(),
    onRun(preset) {
      run.push(preset.id);
    }
  });

  container.children[0].click();

  assert.deepEqual(run, ["a"]);
});
