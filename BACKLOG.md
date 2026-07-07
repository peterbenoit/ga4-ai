# Backlog

Ideas and known gaps that are explicitly **not** v1 work. See `REQUIREMENTS.md`
for what v1 actually is — don't build anything here without moving it there
first and confirming scope with Pete.

## OAuth "Testing" publish status

The extension's Google Cloud OAuth client stays in Testing status. Moving
to a verified/published app is unnecessary at single-user scale and out of
scope unless the single-user assumption changes.

## Deeper AI analysis beyond a one-line answer

Phase 5's Answer Composer (`src/composer.js`) turns one report's rows into a
short plain-language answer. Not yet scoped, and not assumed:

- Comparing/analyzing across more than one saved report or question in a
  single pass
- Multi-turn follow-up questions against an already-fetched report, without
  re-running `runReport`

Revisit only if the single-report answer proves insufficient in practice —
don't build ahead of that signal.

## Charts and graphs

Already tracked as in-scope v1 work — see `REQUIREMENTS.md` Phase 6
(Chart.js, chart type chosen by data shape, chart always paired with its
data table). Nothing new here; noting it so it doesn't get treated as an
open question.

## GA4 native report UI embedding

Do not attempt to embed, scrape, or recreate GA4's native Reports or
Explorations UI widgets inside the extension. The practical path is preset
Data API requests rendered with the extension's own table/chart layer, plus
deep links out to GA4 when Pete needs the native interface.

Preset reports shipped in Phase 6 (`presets.js` / `preset-controller.js`,
"Quick reports" row on the Ask tab): Traffic acquisition, User acquisition,
Pages and screens, Events, Key events / conversions, Realtime. Additional
preset candidates worth adding later if a real need comes up: Landing pages,
Demographics (country/city), Tech overview (device/browser).

## Report sharing beyond manual export

`ARCHITECTURE.md`'s Sharing Model is CSV/chart-image/PDF export, distributed
manually by Pete outside the extension — no hosted links, no in-app send.
If a need for anything beyond manual export comes up (e.g. emailing a PDF
directly from the extension), that's multi-user/backend-adjacent territory
and needs an explicit scope conversation before any code gets written.

## GA4 Question Reference as a living resource

`GA4_Question_Reference/` (xlsx + csv) is the working list of real questions
a VA customer is likely to ask, mapped to the GA4 report/dimensions/metrics
that answer them, plus a category of questions GA4 categorically can't
answer (PII, individual session replay, page speed, physics). This is now
referenced from `REQUIREMENTS.md` Phase 8 as the source of the "5 real
questions run end-to-end" manual test bank — keep it updated as new
customer questions come up, since it's cheaper to catch an unanswerable
question there than to have the translator hallucinate an answer for it.

Possible future refinement (not committed): teach the translator to
recognize a GA4-categorically-unanswerable question as a distinct outcome,
separate from the existing "needs clarification" outcome — right now an
unanswerable question would either get force-fit into a bad request or
fall into clarification, neither of which is quite right. Worth a look once
Phase 3 sees real usage against the harder rows in the reference sheet.
