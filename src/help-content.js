export const HELP_CONTENT = {
  ask: {
    title: "Ask",
    body: [
      "Type a question in plain English and this turns it into a real GA4 report, runs it, and gives you a one-line answer.",
      { term: "Quick reports", detail: "Pre-built questions (traffic sources, top pages, etc.) that skip the plain-English step and run immediately." },
      { term: "Compare segments", detail: "Runs two related quick reports at once — Mobile vs. Desktop, New vs. Returning, Organic vs. Paid — and shows them side by side in one table." },
      { term: "Bundled PDF reports", detail: "Runs a small set of quick reports in one pass and exports them as a single multi-page PDF, meant for handing off to a stakeholder without exporting each report one at a time." },
      { term: "Date range", detail: "Controls which time period the question or quick report covers. \"Let the question decide\" means: if you ask something like \"last month\", it figures the dates out itself." },
      "You need a property selected on the Property tab and an Anthropic API key saved (⚙ Settings) before this will work."
    ]
  },
  property: {
    title: "Property",
    body: [
      { term: "GA4 property", detail: "One website or app being tracked in Google Analytics — pick which one you're asking questions about here." },
      { term: "Metadata", detail: "The list of things this property can report on. \"Dimensions\" are ways to slice data (page path, country, device); \"metrics\" are the numbers themselves (sessions, active users). The counts shown are just how many of each — you don't need to read the full lists." },
      { term: "Refresh metadata", detail: "Re-fetches that list from Google in case something changed recently, like a new event starting to fire. Otherwise it's cached, so you're not re-fetching it every time." },
      { term: "Reporting timezone", detail: "The timezone GA4 uses to decide what counts as \"today\" or \"yesterday\" for this property — matters when a question mentions relative dates." }
    ]
  },
  report: {
    title: "Report",
    body: [
      "This tab shows the result of the last question, quick report, or comparison you ran — the raw data, a chart, and buttons to export it.",
      { term: "Rows and Columns", detail: "Describe the result you just got back — how big the answer was. Different from the Property tab's Dimensions/Metrics counts, which describe everything the property could report on, not what came back this time." },
      { term: "Chart", detail: "Not every report shape makes sense as a chart (e.g. comparing two time periods side by side) — when that happens you'll see a note instead, but the data table is always there." },
      { term: "Export", detail: "Saves what's on screen right now. CSV: the raw numbers. Chart PNG: just the image. PDF summary: question, answer, chart, and table together, meant for handing off." }
    ]
  },
  history: {
    title: "History",
    body: [
      "Every question you've asked is logged here automatically, so you can find and reuse it instead of retyping it.",
      { term: "📌 Pin", detail: "Pin a report from the Report tab to give it a name and keep it here permanently. Pinned reports can be re-run instantly with a fresh date range, without going back through the Ask tab." },
      { term: "Clear", detail: "Wipes the unpinned history list. Pinned reports are kept separately and aren't affected." }
    ]
  }
};
