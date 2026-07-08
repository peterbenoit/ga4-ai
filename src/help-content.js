export const HELP_CONTENT = {
  ask: {
    title: "Ask",
    body: [
      "Type a question in plain English (\"how many visitors came from Google last month\") and this turns it into a real GA4 report, runs it, and gives you a one-line answer.",
      "The \"Quick reports\" buttons above the question box skip the plain-English step entirely — they're pre-built questions (traffic sources, top pages, etc.) that just run immediately.",
      "\"Date range\" controls which time period the question or quick report covers. \"Let the question decide\" means: if you ask something like \"last month\", it'll figure the dates out itself.",
      "You need a property selected on the Property tab and an Anthropic API key saved (⚙ Settings) before this will work."
    ]
  },
  property: {
    title: "Property",
    body: [
      "A \"GA4 property\" is one website/app being tracked in Google Analytics — pick which one you're asking questions about here.",
      "\"Metadata\" is the list of things that property can report on: \"Dimensions\" are ways to slice data (e.g. page path, country, device), \"Metrics\" are the numbers themselves (e.g. sessions, active users). The counts shown are just how many of each this property supports — you don't need to read the full lists.",
      "\"Refresh metadata\" re-fetches that list from Google in case something changed recently (a new event started firing, etc.). Otherwise it's cached so you're not re-fetching it every time.",
      "\"Reporting timezone\" is the timezone GA4 uses to decide what counts as \"today\" or \"yesterday\" for this property — matters when a question mentions relative dates."
    ]
  },
  report: {
    title: "Report",
    body: [
      "This tab shows the result of the last question or quick report you ran — the raw data, a chart, and buttons to export it.",
      "\"Rows\" and \"Columns\" describe the result you just got back (how big the answer was) — this is different from the Property tab's Dimensions/Metrics counts, which describe everything the property *could* report on, not what came back this time.",
      "Not every report shape makes sense as a chart (e.g. comparing two time periods side by side) — when that happens you'll see a note instead of a chart, but the data table is always there.",
      "Export buttons save what's on screen right now: CSV (the raw numbers), Chart PNG (just the image), PDF summary (question + answer + chart + table together, meant for handing off)."
    ]
  },
  history: {
    title: "History",
    body: [
      "Every question you've asked is logged here automatically, so you can find and reuse it instead of retyping it.",
      "\"📌 Pin\" a report from the Report tab to give it a name and keep it here permanently — pinned reports can be re-run instantly with a fresh date range, without going back through the Ask tab.",
      "\"Clear\" wipes the unpinned history list. Pinned reports are kept separately and aren't affected."
    ]
  }
};
