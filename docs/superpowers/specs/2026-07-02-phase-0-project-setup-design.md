# Phase 0 Project Setup Design

## Scope

Phase 0 creates the smallest loadable Manifest V3 Chrome extension skeleton and establishes the test workflow before feature code is added. It does not implement OAuth, GA4 API access, Anthropic API access, query translation, result composition, charts, exports, or saved reports.

## Architecture Decisions

- The extension uses a side panel, not a popup.
- The side panel is the application context and will orchestrate the future translate → validate → execute → compose pipeline.
- Closing the side panel cancels any active pipeline. The UI will clearly state that the panel must remain open while a query runs.
- The background service worker is intentionally minimal. It configures the toolbar action to open the side panel and does not own long-running requests.
- The implementation uses vanilla JavaScript without a framework, bundler, or build step.
- Tests use Node's built-in test runner, invoked through `npm test`, with no test framework dependency.

These decisions resolve the Manifest V3 service-worker lifecycle risk without adding keep-alive messaging, alarms, an offscreen document, or a backend.

## Phase 0 Components

### `manifest.json`

Declares Manifest V3, the side panel, the minimal background service worker, the OAuth scope, and only the permissions and host permissions required by the documented v1 architecture. It must not declare content scripts, `activeTab`, or broad host access.

### `src/background.js`

Enables opening the side panel from the extension toolbar action. It contains no auth, networking, storage, or pipeline logic.

### Side-panel shell

`src/sidepanel.html`, `src/sidepanel.css`, and `src/sidepanel.js` provide a CSP-compatible, loadable shell. JavaScript and CSS remain external. The shell identifies the extension and confirms that setup is complete, but does not include controls belonging to later phases.

### Project support files

- `README.md` states the project purpose and gives local test and unpacked-extension loading instructions.
- `package.json` defines `npm test` using `node --test` and declares no dependencies.
- `.gitignore` excludes dependencies, coverage, environment files, local secret/config files, and `.superpowers/` visual-companion artifacts.

### Structural tests

`test/manifest.test.js` verifies:

- Manifest V3 is used.
- The declared side-panel and service-worker files exist.
- The permission set is restricted to `identity`, `storage`, and `sidePanel`.
- Host access is restricted to the documented Google Analytics Data API and Anthropic API origins.
- No content scripts, `activeTab`, or broad host patterns are present.

## Documentation Changes

`ARCHITECTURE.md` will be updated in the same implementation change to:

- replace the popup-or-side-panel ambiguity with the side-panel decision;
- state that the multi-step pipeline runs in the side-panel page context;
- restrict the service worker to side-panel setup and short event-driven work;
- document cancellation when the side panel closes; and
- move these decisions from Open Questions to Resolved.

The fixed Claude model choices and Chart.js decisions already present in the architecture remain unchanged and are not implemented during Phase 0.

## Verification and Requirement Completion

Automated verification consists of a passing `npm test` run. Manual verification consists of loading the repository as an unpacked extension in Chrome, confirming there are no manifest or console errors, and confirming that clicking the toolbar action opens the side panel.

`REQUIREMENTS.md` checkboxes are updated only after the corresponding item is verified. The Google Cloud project, enabled GA4 Data API, OAuth client, and test-user items may be marked complete based on Pete's confirmation that they are already configured. Phase 1 auth checkboxes remain untouched.

## Error and Secret Handling

- This is a personal, single-user extension. Real keys may be stored in an ignored local configuration file when useful for local development or installation.
- No Anthropic key, OAuth token, or local credential is committed or added to Git history.
- Because the extension has no build step and cannot read `.env` directly, any file-based local configuration must use an ignored extension-readable format rather than a committed source file.
- OAuth access tokens remain managed by `chrome.identity`; embedding them would break refresh behavior and is not a stable configuration mechanism.
- The options-page flow for storing the Anthropic key in `chrome.storage.local` remains the v1 runtime design required by `REQUIREMENTS.md`.
- No API key or token is logged.
- Manifest or side-panel setup failures remain visible through Chrome's extension error reporting; the skeleton does not add fallback behavior that could conceal them.
- An OAuth client identifier, if required in the manifest during Phase 0, is configuration rather than a secret, but it must match the existing Chrome-extension OAuth client before manual verification can pass.

## Completion Criteria

Phase 0 is complete when:

1. The structural tests pass.
2. Chrome loads the unpacked extension without errors.
3. The toolbar action opens the side panel.
4. The pipeline location and lifecycle behavior are documented in `ARCHITECTURE.md`.
5. Only verified Phase 0 requirements are checked in `REQUIREMENTS.md`.
