import { strict as assert } from "node:assert";
import test from "node:test";
import { selectTab } from "../src/tabs.js";

test("selectTab marks only the target id active", () => {
  const states = selectTab(["ask", "property", "report"], "property");

  assert.deepEqual(states, [
    { id: "ask", active: false },
    { id: "property", active: true },
    { id: "report", active: false }
  ]);
});

test("selectTab rejects an id that isn't in the tab list", () => {
  assert.throws(() => selectTab(["ask", "property"], "saved"), /Unknown tab id/);
});
