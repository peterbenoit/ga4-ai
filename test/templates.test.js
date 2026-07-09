import assert from "node:assert/strict";
import test from "node:test";

import { PRESETS } from "../src/presets.js";
import { REPORT_TEMPLATES } from "../src/templates.js";

test("every template has a unique id, label, description, and only references report-kind presets", () => {
  const ids = new Set();
  const presetIds = new Set(PRESETS.filter((preset) => preset.kind === "report").map((preset) => preset.id));

  for (const template of REPORT_TEMPLATES) {
    assert.ok(template.id);
    assert.equal(ids.has(template.id), false, `duplicate template id: ${template.id}`);
    ids.add(template.id);
    assert.ok(template.label);
    assert.ok(template.description);
    assert.ok(Array.isArray(template.presetIds) && template.presetIds.length > 0, template.id);

    for (const presetId of template.presetIds) {
      assert.ok(presetIds.has(presetId), `${template.id} references unknown or non-report preset id "${presetId}"`);
    }
  }
});
