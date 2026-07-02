---
category: Engineering
tags: [ga4, chrome-extension, architecture, single-user]
---

# GA4 Query Assistant — Architecture (v1)

## Purpose

A single-user Chrome extension that lets Pete ask plain-language questions about GA4 data ("did my campaign work", "traffic from mars between these dates") and get a plain-language answer back, without navigating the GA4 UI.

This is scoped for one person, one Google identity, running locally. It is not a product, not multi-tenant, and not VA-facing.

## v1 Scope

**In scope:**
- Natural-language question in, plain-language answer out
- GA4 Data API access (`runReport`, `properties.getMetadata`)
- Property picker across the GA4 properties Pete has access to
- Two-stage LLM pipeline: question → structured GA4 request → results → answer, with the answer framed as a comparison/trend where the data supports it, not just a bare number
- Single-user OAuth via `chrome.identity`
- Direct Anthropic API calls from the extension using Pete's own API key
- Client-side chart rendering (no backend) for report results
- Export: CSV (data table), chart image (PNG/SVG), simple one-page PDF summary — all generated locally, downloaded, shared manually by Pete outside the extension
- Saved/named report definitions that can be re-run with a fresh date range, rather than re-typing the same question each time
- Every chart is paired with its underlying data table (exportable), not chart-only

**Explicitly out of scope for v1:**
- Multi-user access, Peraton team rollout, VA customer access — this includes anyone but Pete opening the extension itself. Exported files (CSV/chart/PDF) leaving the extension and being shared manually is fine; a shareable live link, hosted dashboard, or second person using the tool is not.
- GTM read access or tag creation
- Any navigation/UI-shortcut features (exit pages, sticky headers, saved filters, etc.)
- A backend/proxy server — everything runs client-side in the extension, including chart rendering and file export
- OAuth verification submission to Google (not needed at single-user scale)
- Looker Studio embedding (deep-link out only, if it happens at all in v1)
- Scheduled/recurring report delivery (email, Slack, etc.) — saved report *definitions* are in scope, automated *delivery* is not

## Components

```
┌─────────────────────────────┐
│  Extension UI (side panel)  │
│  - pipeline orchestrator    │
│  - question input           │
│  - answer display           │
│  - property picker          │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Query Translator             │
│  (Claude API call #1)         │
│  NL question + property        │
│  metadata → structured          │
│  GA4 runReport request          │
└──────────────┬────────────────┘
               │
               ▼
┌─────────────────────────────┐
│  GA4 Data API client           │
│  - properties.getMetadata      │
│  - runReport                    │
│  (uses cached OAuth token)      │
└──────────────┬────────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Answer Composer                │
│  (Claude API call #2)           │
│  raw report data → plain-       │
│  language answer                │
└──────────────┬────────────────┘
               │
               ▼
        Display in UI
               │
               ▼
┌─────────────────────────────┐
│  Chart / Export layer          │
│  (client-side, no backend)      │
│  - renders chart from rows      │
│  - CSV export                   │
│  - chart image export           │
│  - one-page PDF summary export  │
└─────────────────────────────┘
```

## Data Flow

1. Pete opens the extension, picks (or defaults to last-used) a GA4 property.
2. Pete types a question.
3. Extension fetches (or uses cached) `properties.getMetadata` for the selected property — the real list of available dimensions and metrics.
4. Extension calls Claude with: the question, the metadata list, today's date, and a system prompt describing the `runReport` request shape. Claude returns a structured request (dimensions, metrics, date range, filters) as JSON.
5. Extension validates the returned request against the metadata list (reject/retry if it references a dimension or metric that doesn't exist).
6. Extension calls `runReport` against the GA4 Data API with the validated request and the cached OAuth token.
7. Extension calls Claude again with the question and the raw report rows, asking for a short plain-language answer plus the supporting numbers.
8. Answer displayed in the UI. Raw table available on toggle/expand for verification.

## Auth Model

- OAuth via `chrome.identity.getAuthToken`, using a Google Cloud OAuth client scoped to `https://www.googleapis.com/auth/analytics.readonly`.
- App stays in Google's "Testing" publish status. Since Pete is the only user, there's no 100-user cap issue and no verification submission needed — just add Pete's own account as a test user once.
- Token is cached by `chrome.identity` itself; extension calls `getAuthToken({interactive: true})` on first use and `{interactive: false}` for silent refresh afterward.
- No refresh token handling needed manually — `chrome.identity` manages this.

## Device Scope

- Confirmed: single machine only. No sync requirement.
- `chrome.storage.local` is sufficient for all state (API key, metadata cache, saved reports, history) — no need for `chrome.storage.sync`, no export/import feature for portability.
- If this changes later (second machine), revisit storage strategy then rather than building for it now.

## LLM Integration

- The side-panel extension page calls `api.anthropic.com/v1/messages` directly. The side panel is an extension context, so it avoids page CSP restrictions without relying on the background service worker to survive the full pipeline.
- Anthropic API key stored in `chrome.storage.local`, entered once via an options page. Never hardcoded, never committed.
- Two separate calls rather than one combined call:
  - **Call 1 (translate):** narrow, deterministic-leaning task — turn NL question into a structured API request. Use a tight system prompt with the actual metadata list injected, and ask for JSON-only output.
  - **Call 2 (compose):** turn raw numeric rows into a sentence-level answer. Looser, more conversational.
- Rationale for two calls instead of one: keeps the query-generation step easy to validate/debug independently of the answer-generation step, and keeps each prompt focused.

## Ambiguity Handling

- The translator step (Call 1) must be able to return "needs clarification" as a distinct outcome, not just a best-guess request. A vague question ("did my campaign work" with no campaign specified) should prompt Pete for the missing detail rather than the model silently picking one.
- This is different from the invalid-dimension retry in the Data Flow section — that's a correctness check against real metadata; this is a completeness check against the question itself.

## Date & Timezone Resolution

- Today's actual date is always passed into the translator prompt explicitly — never inferred by the model.
- Relative phrases ("last month," "this quarter," "between these dates") are resolved against the GA4 property's configured reporting timezone, not the browser's local timezone. Property timezone is available via `properties.getMetadata` (or `properties.get`) and should be fetched/cached alongside the dimension/metric list.

## Service Worker Lifecycle

- Resolved: the side-panel page owns the question → translate → execute → compose pipeline.
- The background service worker only configures toolbar-click side-panel behavior and handles future short event-driven work if required.
- Closing the side panel cancels any active pipeline. While a query is running, the UI must state that the panel needs to remain open.
- No keep-alive pings, alarms, offscreen document, or backend are used for pipeline orchestration.

## Chart Type Selection

- Chart type is chosen by data shape, not fixed: date-based dimension → line chart; categorical dimension → bar chart; single aggregate value → no chart, number only. This rule lives in the export/chart layer, applied after the report data returns, not decided by the LLM.
- Library: **Chart.js**. Canvas-based, so `chart.toBase64Image()` produces the PNG used for both the standalone chart-image export and the embedded image in the PDF export — no separate rendering/conversion step needed. Vanilla-JS friendly, no framework dependency.

## Model Selection

- **Translate call (Call 1):** `claude-sonnet-5`. Bounded extraction against a known schema (real dimensions/metrics from `properties.getMetadata`) — Sonnet's accuracy on field-mapping is worth the small premium over Haiku, since a wrong field means a retry loop.
- **Compose call (Call 2):** `claude-haiku-4-5-20251001`. Describing numbers already in hand is a simpler task; Haiku is fast and cheap, and there's no schema-matching risk at this step.
- Both model choices are hardcoded in one config location, not exposed as a runtime picker — no routing logic, no model-selection UI. Revisit a specific model only if a specific failure mode shows up in practice (e.g., translate call consistently mis-mapping fields → try Opus for that call specifically), not preemptively.
- `effort` parameter left at API default (`high`) unless a real accuracy or latency problem is observed.
- Opus 4.8 / Fable 5 intentionally not used — both steps here are bounded, well-defined tasks, not the open-ended multi-step reasoning those tiers are for.

## Storage (chrome.storage.local schema, draft)

```js
{
  anthropicApiKey: string,
  lastUsedPropertyId: string,
  propertyMetadataCache: {
    [propertyId]: { dimensions: [...], metrics: [...], fetchedAt: timestamp }
  },
  queryHistory: [ { question, request, answer, timestamp } ],  // optional, local only
  savedReports: [
    { name, question, requestTemplate, lastRunAt, lastAnswer }
    // requestTemplate stores the dimensions/metrics/filters; date range is
    // re-supplied (or relative, e.g. "last 30 days") each time it's re-run
  ]
}
```

## Manifest / Permissions (Manifest V3)

- `identity` — for OAuth
- `sidePanel` — for the persistent extension UI and pipeline context
- `storage` — for local key/cache storage
- Host permissions for `analyticsdata.googleapis.com` and `api.anthropic.com`
- No `activeTab`, no content scripts, no broad host permissions — this doesn't touch web pages

## Error Handling Considerations

- Metadata fetch failure → surface clearly, don't silently fall back to guessed dimension names
- Claude returns a request referencing an invalid dimension/metric → retry once with the error fed back, then fail visibly rather than silently dropping the filter
- GA4 API errors (invalid date range, quota, permission denied on property) → surface the raw error, don't paper over it with a vague "something went wrong"
- No answer should ever be shown without the underlying numbers available to check

## Open Questions

- Whether GA4 metadata should be refetched per session or cached longer (dimensions/metrics rarely change)
- Whether query history is worth persisting at all in v1, or just noise
- PDF export library choice (client-side, e.g. jsPDF or similar) — pick during Phase 6 implementation, not before
- GA4 Data API quota ceiling — not expected to be a real constraint at single-user usage levels, but worth a quick check of current limits before Phase 6 saved-report re-run testing

## Resolved

- Device scope: single machine, no sync/export-import needed (see Device Scope above)
- Sharing model: export files (CSV/chart/PDF), Pete distributes manually outside the extension — no hosted links, no second user
- Extension UI: side panel, not popup.
- Pipeline lifecycle: orchestrated by the side-panel page; closing the panel cancels active work (see Service Worker Lifecycle above).
- Chart library: Chart.js (see Chart Type Selection above)
- Model selection: Sonnet 5 for translate, Haiku 4.5 for compose, hardcoded — no runtime model picker (see Model Selection above)
