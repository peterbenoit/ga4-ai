---
category: Engineering
tags: [ga4, chrome-extension, requirements, single-user]
---

# GA4 Query Assistant — Requirements (v1)

Single source of truth for what v1 does and doesn't include. See `ARCHITECTURE.md` for the how. Check items off as they're built and verified, not just written.

## Phase 0 — Project Setup

- [x] Repo/folder created, README stub with one-line project purpose
- [x] Manifest V3 skeleton (background service worker, no content scripts)
- [x] Decision made and documented on where the multi-step pipeline runs (UI-context page vs. background worker + keep-alive) — before Phase 3 is built, not discovered during testing
- [x] `.gitignore` covers API keys, `.env`, any local config
- [x] Test runner set up before any feature code is written
- [x] Google Cloud project created, GA4 Data API enabled
- [x] OAuth client (Chrome extension type) created, Pete added as test user

## Phase 1 — Auth

- [x] `chrome.identity.getAuthToken` wired up, interactive on first use
- [x] Silent token refresh path works without re-prompting
- [x] Token failure state is visible in the UI, not silent
- [ ] Verified: works after browser restart without re-auth

## Phase 2 — GA4 Metadata & Property Picker

- [x] Google Analytics Admin API enabled in the Google Cloud project
- [x] `properties.getMetadata` call implemented and returns real dimensions/metrics
- [x] List of accessible GA4 properties fetched and shown in a picker
- [x] Last-used property persisted and defaulted on next open
- [x] Metadata cached locally with a fetch timestamp
- [x] Manual "refresh metadata" action available (in case dimensions/metrics change)

## Phase 3 — Query Translation (NL → GA4 request)

- [x] Model set to `claude-sonnet-5`, hardcoded in one config location (no runtime picker)
- [x] System prompt built describing `runReport` request shape
- [x] Property's real metadata injected into the prompt context, including property timezone
- [x] Today's actual date passed explicitly into the prompt (never inferred by the model)
- [x] Relative date phrases resolved against property timezone, not browser local time
- [x] Claude call returns JSON-only structured request
- [x] Claude call can return a distinct "needs clarification" outcome for vague/ambiguous questions, separate from a malformed request
- [x] Clarification outcome surfaces a specific follow-up prompt to Pete, not a generic error
- [x] Returned request validated against actual available dimensions/metrics
- [x] Invalid request triggers one retry with the validation error fed back
- [x] Second failure surfaces clearly to Pete rather than guessing

## Phase 4 — Query Execution

- [x] `runReport` call implemented against GA4 Data API
- [x] Handles empty result sets gracefully (distinct from errors)
- [x] Handles GA4 API errors (bad date range, permission denied, quota) with real error text shown
- [x] Raw result rows available for inspection, not just the summarized answer

## Phase 5 — Answer Composition

- [x] Model set to `claude-haiku-4-5-20251001`, hardcoded in one config location (no runtime picker)
- [x] Claude call turns raw rows into a short plain-language answer
- [x] Answer includes or links to the supporting numbers (no unverifiable claims)
- [x] Where the data supports it, answer frames a comparison/trend (vs. prior period, vs. another segment) rather than a bare number
- [x] Handles "no data matches" as a real answer, not a hallucinated one
- [x] The exact request (dimensions/metrics/date range/filters) that produced an answer is retrievable later, not just the sentence

## Phase 6 — Charts, Export & Saved Reports

- [x] Chart rendering via Chart.js (canvas-based) for report results where the data shape supports a chart (time series, category comparison)
- [x] Chart type chosen by data shape via a fixed rule (date dimension → line, category → bar, single aggregate → number only, no chart) — not left to the LLM to decide
- [x] Every chart has its data table available alongside it — never chart-only
- [x] CSV export of the raw data table
- [x] Chart image export (PNG via Chart.js's `toBase64Image()`)
- [x] One-page PDF export combining the question, the answer, the chart (reusing the same PNG), and the data table
- [x] Local question history: record completed questions and allow use, copy, delete one, or clear all
- [ ] Named/saved report definitions: save a question (with its dimensions/metrics/filters) for re-running later
- [ ] Saved reports can be re-run with a fresh date range without retyping the original question
- [ ] Saved report list visible and manageable (rename, delete) in the UI
- [ ] No scheduled/automated delivery of any kind — re-running is manual, triggered by Pete
- [ ] Preset GA4 reports: deterministic Data API request templates for common GA4 UI-style reports, rendered locally rather than embedded from GA4

## Phase 7 — Extension UI

- [ ] Question input
- [ ] Answer display area
- [ ] Property picker visible and functional
- [ ] Options page for entering/updating Anthropic API key
- [ ] Loading state while translate → execute → compose pipeline runs
- [x] Toggle to view raw report table
- [ ] Export buttons (CSV / chart image / PDF) visible on any result that has them available
- [x] History panel: view previous questions, populate Ask tab, copy, delete one, clear all
- [ ] Saved-reports panel: view, re-run, rename, delete

## Phase 8 — Testing

- [ ] Unit tests for request validation logic (invalid dimension/metric rejected)
- [ ] Unit tests for the metadata caching logic
- [ ] Manual test: at least 5 real questions run end-to-end and answers checked against GA4 UI directly — pull from `GA4_Question_Reference/` (real VA-customer questions mapped to the GA4 reports/dimensions/metrics that answer them); include at least one row from its "Unanswerable by GA4" category to confirm the translator clarifies/fails visibly instead of guessing
- [ ] Manual test: revoke OAuth access, confirm re-auth flow works cleanly
- [ ] Manual test: exported CSV opens cleanly in Excel/Sheets, exported PDF is legible, exported chart image isn't cut off or blank

## Phase 9 — Polish / Error Handling

- [ ] No feature added past this list without updating this list first
- [ ] API key never logged, never included in error messages shown in UI
- [ ] Extension works with zero console errors on a clean load

## Non-Functional

- [ ] No content scripts, no `activeTab`, no broad host permissions
- [ ] No backend/proxy server introduced
- [ ] No multi-user, no VA-facing, no GTM work in this pass — those go in a separate future requirements doc if pursued

## Explicitly Deferred (not v1, don't build)

- GTM read access or tag/trigger creation
- Multi-user auth (OAuth verification, service accounts, delegated access) — note: exporting a file for Pete to share manually is in scope; a second person using the extension, or a hosted/shared link, is not
- Peraton team rollout
- VA customer-facing anything
- Navigation/UI-shortcut features (saved filters, sticky headers, exit page reports, etc.)
- Looker Studio embedding beyond a possible deep-link
- Embedding or scraping GA4's native Reports/Explorations UI or chart widgets inside the extension
- Scheduled or automated report delivery (email, Slack, recurring jobs) — saved report definitions are in scope, automating their delivery is not
