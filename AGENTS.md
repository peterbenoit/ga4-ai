# AGENTS.md — GA4 Query Assistant

Instructions for any agent (Claude Code or otherwise) working on this project.

## What this is

A single-user Chrome extension. Pete types a GA4 question in plain language, the extension turns it into a GA4 Data API request, runs it, and gives back a plain-language answer. Nothing more. See `ARCHITECTURE.md` and `REQUIREMENTS.md` — those two files are the source of truth, in that order. If a task isn't in `REQUIREMENTS.md`, don't build it; flag it and ask instead of assuming it's wanted.

## Ground rules

- **Scope discipline.** This is explicitly single-user, no backend, no GTM, no multi-tenant anything. If a change would require any of those, stop and ask before proceeding — don't quietly lay groundwork for a bigger version.
- **Tests from the start.** Every feature that has logic worth breaking (request validation, metadata caching, response parsing) gets a test written alongside it, not after. Don't defer testing to "later."
- **Plain JavaScript by default.** No framework (React, Vue, etc.) unless there's a concrete reason tied to actual UI complexity — this is a small extension, not an app. Manifest V3, vanilla JS/TS is the default assumption.
- **No secrets in code.** Anthropic API key and any tokens live in `chrome.storage.local`, entered via the options page. Never hardcoded, never logged, never included in commit history. Check `.gitignore` before committing anything new.
- **npm scoping.** If a new package is ever published (not expected for this project, but if it happens), use the `@peterbenoit` scope.
- **Direct communication.** No affirmations, no preamble padding ("Great question!", "I've made the following improvements..."). State what changed and why. Treat proposed code as a draft open to pushback, not a finished deliverable to defend.
- **Real errors, not smoothed-over ones.** If the GA4 API returns an error, or Claude returns something that doesn't validate, that fails loudly in the UI. No silent fallbacks, no guessed defaults standing in for a real failure.
- **Service worker lifecycle is a known risk, not an afterthought.** The question → translate → execute → compose pipeline is multiple sequential network calls, and MV3 background service workers die after ~30s idle. Resolve where this pipeline runs (UI-context page vs. background worker with keep-alive) before building Phase 3, per `REQUIREMENTS.md` Phase 0. Don't discover this via a dropped request during testing.
- **Model choice is fixed, not configurable.** Translate call uses `claude-sonnet-5`, compose call uses `claude-haiku-4-5-20251001` — see `ARCHITECTURE.md` Model Selection. No settings UI for model or effort level. If a specific call is clearly underperforming, that's a decision to bring back to Pete, not something to solve by adding a picker.
- **Don't reach for a backend.** If a task feels like it wants a server, that's a signal the task is out of scope for v1, not a signal to add infrastructure. Flag it instead. Charts and file exports (CSV/PNG/PDF) are all client-side generation — no server round-trip for any of it.
- **Charts always ship with their data.** Never render a chart without the underlying table available in the same view/export. This isn't optional polish — treat it like the accessibility habits already baked into Pete's other work.
- **Exports are for Pete to hand off, not for the extension to distribute.** No email sending, no upload-and-link, no scheduling. Generate the file, trigger a download, done.

## Working agreement

- Update `REQUIREMENTS.md` checkboxes as items are actually completed and verified — not when code is written, when it's confirmed working.
- If `ARCHITECTURE.md` needs to change because reality diverged from the plan, update the doc in the same change as the code, not after.
- Keep commits scoped to one phase/requirement at a time where practical.

## Not covered here

Skill/prompt conventions from Pete's broader `agent-config` repo may also apply depending on where this project lives relative to that setup. If this repo is symlinked into or alongside `agent-config`, defer to whatever global conventions are already established there for anything not specified above.
