## MVP (mvp.va.gov) reporting gaps — post-v1

Driven by evaluating mvp.va.gov/pwa as the first real reporting target.

- [x] MVP-1: Property event dictionary. Injectable per-property context file
      (event names, key events, GTM-defined params) added to the translator
      prompt so NL questions map to this site's actual event taxonomy
      instead of guessed names. Manual JSON/MD file per property is fine.
- [x] MVP-2: Join-funnel report. Home → /joinmvp → outbound join click.
      Shipped as the deterministic stitched-runReport preset
      (`src/funnel-report.js` / `join-funnel` in `src/presets.js`), not
      the v1alpha runFunnelReport endpoint. Outbound-click step filters on
      eventName "click" + linkDomain containing "eauth.va.gov", confirmed
      via GTM debug session.
- [x] MVP-3: Promote Landing pages and Tech overview from "later candidates"
      to shipped presets (tech overview should surface browser share to
      correlate with the unsupported-browser warning).
- [x] MVP-4: Audience-segment comparison. Shipped as deterministic
      comparison-kind presets (`src/comparison-report.js`, "Compare
      segments" row on the Ask tab), not an NL/translator feature — same
      precedent as MVP-2's funnel. Built-in pairs: Mobile vs. Desktop, New
      vs. Returning, Organic vs. Paid channel. `composeAnswer` needed no
      changes; it's already data-shape agnostic. Ad hoc named segments
      (e.g. "Researcher Hub vs everything else") are explicitly out of
      scope — would need Claude to invent an arbitrary pagePath filter,
      the same fragility risk MVP-2 avoided; revisit only if the 3
      built-in pairs prove insufficient, likely via a per-property named-
      segment dictionary extending MVP-1's pattern.
- [x] MVP-5: Outbound click preset (event: click / link_domain) covering
      eauth.va.gov, veteranscrisisline.net, va.gov, youtube.com.
- [x] MVP-6 (not extension code): measurement QA — confirmed the dual GTM
      containers (GTM-M5WC82N / GTM-5LG8W55) aren't double-firing, confirmed
      join/sign-in clicks are tagged, confirmed the unsupported-browser
      modal fires a trackable event.
- [~] MVP-7: Multi-section stakeholder PDF report. Bar is the sample Looker
      Studio exports in `Examples/Reports/`.
      - [x] Real ruled table rendering (`drawRuledTable` in
        `src/report-export.js`) with header-row repeat and pagination —
        replaces the old pipe-joined-text dump capped at 12 rows.
      - [x] Named templates (`src/templates.js`) that bundle several presets
        into one export via `runTemplateReport` (`src/template-runner.js`)
        and `downloadMultiSectionPdf` (`src/report-export.js`), with a
        "Bundled PDF reports" row on the Ask tab. Shipped: "Monthly
        stakeholder summary" (traffic acquisition, pages and screens, key
        events) and "Campaign wrap-up" (traffic acquisition, landing pages,
        outbound clicks).
      - [ ] KPI tiles with period-over-period deltas — depends on MVP-4
        comparison landing first.

Ordering rationale: MVP-1 first because it makes every existing NL query
more accurate for near-zero code; MVP-2 is the highest-value new
capability; MVP-6 gates the accuracy of everything else and costs no
extension work; MVP-7 is last because its KPI-tile piece depends on MVP-4.



- GTM read access or tag/trigger creation
- Multi-user auth (OAuth verification, service accounts, delegated access) — note: exporting a file for Pete to share manually is in scope; a second person using the extension, or a hosted/shared link, is not
- Peraton team rollout
- VA customer-facing anything
- Navigation/UI-shortcut features (saved filters, sticky headers, exit page reports, etc.)
- Looker Studio embedding beyond a possible deep-link
- Embedding or scraping GA4's native Reports/Explorations UI or chart widgets inside the extension
- Scheduled or automated report delivery (email, Slack, recurring jobs) — saved report definitions are in scope, automating their delivery is not
