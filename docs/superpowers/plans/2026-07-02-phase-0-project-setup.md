# Phase 0 Project Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify the smallest loadable Manifest V3 side-panel extension, establish tests before feature logic, and resolve the pipeline lifecycle architecture.

**Architecture:** Chrome loads vanilla JavaScript directly with no build step. A minimal service worker enables toolbar-click side-panel behavior, while the side-panel page will own the future multi-call pipeline and cancel work when closed. Node's built-in test runner verifies the extension package contract without adding dependencies.

**Tech Stack:** Manifest V3, Chrome Side Panel API (Chrome 114+), vanilla JavaScript, HTML/CSS, `node:test`

---

## File Map

- Create `manifest.json`: MV3 package definition, OAuth client/scope, side panel, service worker, and narrow permissions.
- Create `src/background.js`: configure toolbar clicks to open the side panel.
- Create `src/sidepanel.html`: semantic side-panel shell with external assets only.
- Create `src/sidepanel.css`: minimal readable shell styling.
- Create `src/sidepanel.js`: mark the shell ready without feature logic.
- Create `package.json`: dependency-free `npm test` command.
- Create `test/manifest.test.js`: structural package and permission tests.
- Create `README.md`: purpose, test command, and unpacked-extension instructions.
- Modify `.gitignore`: exclude dependencies, coverage, local secrets/config, and visual-companion files.
- Modify `ARCHITECTURE.md`: resolve side panel and UI-context orchestration.
- Modify `REQUIREMENTS.md`: check only verified Phase 0 items.
- Preserve and include the existing `AGENTS.md`, `ARCHITECTURE.md`, and `REQUIREMENTS.md` user-authored relocation/updates in the documentation commit.

### Task 1: Establish the manifest contract with a failing test

**Files:**
- Create: `package.json`
- Create: `test/manifest.test.js`
- Test: `test/manifest.test.js`

- [ ] **Step 1: Create the dependency-free test command**

```json
{
  "name": "ga4-query-assistant",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Write the failing manifest contract test**

```js
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const rootUrl = new URL("../", import.meta.url);
const manifestUrl = new URL("manifest.json", rootUrl);

async function readManifest() {
  return JSON.parse(await readFile(manifestUrl, "utf8"));
}

test("manifest declares the Phase 0 MV3 package contract", async () => {
  const manifest = await readManifest();

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.minimum_chrome_version, "114");
  assert.equal(manifest.background.service_worker, "src/background.js");
  assert.equal(manifest.side_panel.default_path, "src/sidepanel.html");
  assert.equal(manifest.action.default_title, "Open GA4 Query Assistant");
  assert.deepEqual([...manifest.permissions].sort(), ["identity", "sidePanel", "storage"]);
  assert.deepEqual([...manifest.host_permissions].sort(), [
    "https://analyticsdata.googleapis.com/*",
    "https://api.anthropic.com/*"
  ]);
  assert.deepEqual(manifest.oauth2, {
    client_id: "442168594815-0rj9rl8i7m3tn4e1ibuckiv2vt8sf41r.apps.googleusercontent.com",
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"]
  });
  assert.equal("content_scripts" in manifest, false);
  assert.equal(manifest.permissions.includes("activeTab"), false);
  assert.equal("default_popup" in manifest.action, false);
});

test("every declared extension resource exists", async () => {
  const manifest = await readManifest();
  const declaredResources = [
    manifest.background.service_worker,
    manifest.side_panel.default_path,
    "src/sidepanel.css",
    "src/sidepanel.js"
  ];

  await Promise.all(declaredResources.map((path) => access(new URL(path, rootUrl))));
});

test("side panel loads only external CSS and JavaScript", async () => {
  const html = await readFile(new URL("src/sidepanel.html", rootUrl), "utf8");

  assert.match(html, /<link rel="stylesheet" href="sidepanel\.css">/);
  assert.match(html, /<script type="module" src="sidepanel\.js"><\/script>/);
  assert.equal(html.includes("<style"), false);
  assert.equal(/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), false);
});
```

- [ ] **Step 3: Run the test and verify the expected failure**

Run: `npm test`

Expected: FAIL with `ENOENT` for `manifest.json`. This proves the new test is active before the extension package exists.

### Task 2: Implement the minimal loadable extension package

**Files:**
- Create: `manifest.json`
- Create: `src/background.js`
- Create: `src/sidepanel.html`
- Create: `src/sidepanel.css`
- Create: `src/sidepanel.js`
- Test: `test/manifest.test.js`

- [ ] **Step 1: Create the exact Manifest V3 definition**

```json
{
  "manifest_version": 3,
  "name": "GA4 Query Assistant",
  "version": "0.1.0",
  "description": "Ask plain-language questions about GA4 data.",
  "minimum_chrome_version": "114",
  "action": {
    "default_title": "Open GA4 Query Assistant"
  },
  "background": {
    "service_worker": "src/background.js",
    "type": "module"
  },
  "side_panel": {
    "default_path": "src/sidepanel.html"
  },
  "permissions": [
    "identity",
    "sidePanel",
    "storage"
  ],
  "host_permissions": [
    "https://analyticsdata.googleapis.com/*",
    "https://api.anthropic.com/*"
  ],
  "oauth2": {
    "client_id": "442168594815-0rj9rl8i7m3tn4e1ibuckiv2vt8sf41r.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/analytics.readonly"
    ]
  }
}
```

- [ ] **Step 2: Create the minimal service worker**

```js
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Unable to configure side panel behavior.", error));
```

- [ ] **Step 3: Create the CSP-compatible side-panel HTML**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>GA4 Query Assistant</title>
    <link rel="stylesheet" href="sidepanel.css">
    <script type="module" src="sidepanel.js"></script>
  </head>
  <body>
    <main>
      <p class="eyebrow">GA4 Query Assistant</p>
      <h1>Project setup complete</h1>
      <p>The query workflow will be added in the next phases.</p>
      <p id="status" role="status">Loading extension shell…</p>
    </main>
  </body>
</html>
```

- [ ] **Step 4: Create the side-panel stylesheet**

```css
:root {
  color-scheme: light dark;
  font-family: system-ui, sans-serif;
}

body {
  margin: 0;
}

main {
  margin-inline: auto;
  max-width: 40rem;
  padding: 1.5rem;
}

.eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  font-size: 1.5rem;
  line-height: 1.2;
}
```

- [ ] **Step 5: Create the side-panel readiness script**

```js
const status = document.querySelector("#status");

status.textContent = "Extension shell ready.";
```

- [ ] **Step 6: Run the tests and verify the package contract passes**

Run: `npm test`

Expected: 3 tests pass, 0 fail.

- [ ] **Step 7: Commit the tested package skeleton**

```bash
git add package.json test/manifest.test.js manifest.json src/background.js src/sidepanel.html src/sidepanel.css src/sidepanel.js
git commit -m "Set up Manifest V3 side panel skeleton"
```

### Task 3: Add repository hygiene and local setup documentation

**Files:**
- Modify: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Expand `.gitignore` without removing the existing macOS rule**

```gitignore
.DS_Store
node_modules/
coverage/
.env
.env.*
!.env.example
local-config.*
secrets.*
.superpowers/
```

- [ ] **Step 2: Create the README**

```markdown
# GA4 Query Assistant

A single-user Chrome extension for asking plain-language questions about GA4 data.

## Test

Run `npm test`.

## Load locally

1. Open `chrome://extensions` in Chrome.
2. Enable Developer mode.
3. Select **Load unpacked** and choose this repository.
4. Pin **GA4 Query Assistant** and click its toolbar icon to open the side panel.

The OAuth client ID is configuration, not a secret. Anthropic keys and OAuth tokens must not be committed; local file-based configuration belongs in an ignored `local-config.*` or `secrets.*` file.
```

- [ ] **Step 3: Verify ignored local files and tests**

Run: `git check-ignore .env local-config.js secrets.json .superpowers/example`

Expected: all four ignored paths print.

Run: `npm test`

Expected: 3 tests pass, 0 fail.

- [ ] **Step 4: Commit repository setup files**

```bash
git add .gitignore README.md
git commit -m "Document local extension setup"
```

### Task 4: Resolve architecture and preserve the user-authored documentation updates

**Files:**
- Modify: `AGENTS.md`
- Modify: `ARCHITECTURE.md`
- Modify: `REQUIREMENTS.md`
- Delete through relocation already performed by user: `docs/ARCHITECTURE.md`
- Delete through relocation already performed by user: `docs/REQUIREMENTS.md`

- [ ] **Step 1: Update the Components diagram terminology**

Replace the first box in the Components diagram with this exact box. Keep the translator, GA4 client, composer, and chart/export boxes unchanged.

```text
┌─────────────────────────────┐
│  Extension UI (side panel)  │
│  - pipeline orchestrator    │
│  - question input           │
│  - answer display           │
│  - property picker          │
└──────────────┬──────────────┘
```

- [ ] **Step 2: Replace the first LLM Integration bullet with the approved context**

```markdown
- The side-panel extension page calls `api.anthropic.com/v1/messages` directly. The side panel is an extension context, so it avoids page CSP restrictions without relying on the background service worker to survive the full pipeline.
```

- [ ] **Step 3: Replace Service Worker Lifecycle with the resolved behavior**

```markdown
## Service Worker Lifecycle

- Resolved: the side-panel page owns the question → translate → execute → compose pipeline.
- The background service worker only configures toolbar-click side-panel behavior and handles future short event-driven work if required.
- Closing the side panel cancels any active pipeline. While a query is running, the UI must state that the panel needs to remain open.
- No keep-alive pings, alarms, offscreen document, or backend are used for pipeline orchestration.
```

- [ ] **Step 4: Resolve the side-panel Open Question**

Remove the `Side panel vs. popup UI` bullet from Open Questions. Add these bullets to Resolved:

```markdown
- Extension UI: side panel, not popup.
- Pipeline lifecycle: orchestrated by the side-panel page; closing the panel cancels active work (see Service Worker Lifecycle above).
```

- [ ] **Step 5: Review the complete documentation diff**

Run: `git diff --check`

Expected: no whitespace errors.

Run: `git diff -- AGENTS.md ARCHITECTURE.md REQUIREMENTS.md docs/ARCHITECTURE.md docs/REQUIREMENTS.md`

Expected: the diff includes the user's root relocation, fixed model choices, Chart.js decision, and the new side-panel lifecycle resolution. It must not remove or rewrite those user-authored decisions.

- [ ] **Step 6: Commit the documentation relocation and architecture decision**

```bash
git add AGENTS.md ARCHITECTURE.md REQUIREMENTS.md docs/ARCHITECTURE.md docs/REQUIREMENTS.md
git commit -m "Resolve side panel pipeline architecture"
```

### Task 5: Verify Phase 0 and update only confirmed requirements

**Files:**
- Modify: `REQUIREMENTS.md`
- Test: `test/manifest.test.js`

- [ ] **Step 1: Run automated verification from a clean command**

Run: `npm test`

Expected: 3 tests pass, 0 fail.

- [ ] **Step 2: Inspect the final package and secret boundary**

Run: `git diff --check`

Expected: no whitespace errors.

Run: `git status --short`

Expected: only intentional uncommitted files appear.

Run: `rg -n -uu -g '!/.git/**' -g '!docs/superpowers/**' -g '!.superpowers/**' 'sk-ant-|ya29\.|Bearer ' .`

Expected: no matches.

- [ ] **Step 3: Perform manual Chrome verification**

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked** and select the repository root.
4. Confirm Chrome reports no manifest or extension errors.
5. Click the extension toolbar action and confirm the GA4 Query Assistant side panel opens.
6. Open the service-worker and side-panel consoles and confirm both are error-free.
7. Compare the loaded extension ID with the item/application ID configured for OAuth client `442168594815-0rj9rl8i7m3tn4e1ibuckiv2vt8sf41r.apps.googleusercontent.com`. If they differ, do not mark the OAuth client item verified; capture the stable extension key or create a matching Chrome-extension OAuth client before Phase 1.

Expected: extension loads, toolbar click opens the side panel, both consoles are clean, and the OAuth client is associated with the loaded extension ID.

- [ ] **Step 4: Update verified Phase 0 checkboxes**

Mark these complete after Steps 1–3 succeed:

```markdown
- [x] Repo/folder created, README stub with one-line project purpose
- [x] Manifest V3 skeleton (background service worker, no content scripts)
- [x] Decision made and documented on where the multi-step pipeline runs (UI-context page vs. background worker + keep-alive) — before Phase 3 is built, not discovered during testing
- [x] `.gitignore` covers API keys, `.env`, any local config
- [x] Test runner set up before any feature code is written
- [x] Google Cloud project created, GA4 Data API enabled
- [x] OAuth client (Chrome extension type) created, Pete added as test user
```

If the OAuth extension ID comparison fails, leave only the final OAuth checkbox unchecked. If Pete's earlier confirmation does not cover the test-user status, leave that combined checkbox unchecked rather than inferring it.

- [ ] **Step 5: Run final verification after the checkbox edit**

Run: `npm test`

Expected: 3 tests pass, 0 fail.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 6: Commit verified Phase 0 completion**

```bash
git add REQUIREMENTS.md
git commit -m "Mark verified Phase 0 requirements complete"
```

- [ ] **Step 7: Record final repository state**

Run: `git status --short --branch`

Expected: no unexpected files are staged or modified.

Run: `git log -5 --oneline --decorate`

Expected: the branch contains the Phase 0 package, setup documentation, architecture resolution, and verified requirements commits.
