## MVP (mvp.va.gov) reporting gaps — post-v1

Driven by evaluating mvp.va.gov/pwa as the first real reporting target.

- [x] MVP-1: Property event dictionary. Injectable per-property context file
      (event names, key events, GTM-defined params) added to the translator
      prompt so NL questions map to this site's actual event taxonomy
      instead of guessed names. Manual JSON/MD file per property is fine.
- [ ] MVP-2: Join-funnel report. Home → /joinmvp → outbound join click.
      Evaluate runFunnelReport (Data API v1alpha) vs. a deterministic
      preset that stitches sequential runReport calls. Ship as a preset,
      not an NL feature.
- [ ] MVP-3: Promote Landing pages and Tech overview from "later candidates"
      to shipped presets (tech overview should surface browser share to
      correlate with the unsupported-browser warning).
- [ ] MVP-4: Audience-segment comparison. One question, two filtered
      requests (e.g. Researcher Hub paths vs everything else), composed
      into a single comparative answer. Un-defers the "compare across
      reports" backlog item, narrowly.
- [ ] MVP-5: Outbound click preset (event: click / link_domain) covering
      eauth.va.gov, veteranscrisisline.net, va.gov, youtube.com.
- [ ] MVP-6 (not extension code): measurement QA — confirm the dual GTM
      containers (GTM-M5WC82N / GTM-5LG8W55) aren't double-firing, confirm
      join/sign-in clicks are tagged, confirm the unsupported-browser
      modal fires a trackable event.

Ordering rationale: MVP-1 first because it makes every existing NL query more accurate for near-zero code; MVP-2 is the highest-value new capability; MVP-6 gates the accuracy of everything else and costs no extension work.



- GTM read access or tag/trigger creation
- Multi-user auth (OAuth verification, service accounts, delegated access) — note: exporting a file for Pete to share manually is in scope; a second person using the extension, or a hosted/shared link, is not
- Peraton team rollout
- VA customer-facing anything
- Navigation/UI-shortcut features (saved filters, sticky headers, exit page reports, etc.)
- Looker Studio embedding beyond a possible deep-link
- Embedding or scraping GA4's native Reports/Explorations UI or chart widgets inside the extension
- Scheduled or automated report delivery (email, Slack, recurring jobs) — saved report definitions are in scope, automating their delivery is not
