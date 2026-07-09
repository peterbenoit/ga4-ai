# Persona: VA Digital Stakeholder

## Scope Note

This is a stakeholder persona for the kinds of VA-facing questions Pete needs to answer with GA4 data. It does **not** change the product scope: the extension is still single-user, Pete-only, no VA customer login, no shared dashboard, no backend, and no automated delivery.

Use this persona to guide prompt tuning, manual test questions, report wording, saved-report naming, and export expectations. Do not use it as a reason to add multi-user workflows or VA-facing UI.

## Snapshot

- **Persona name:** VA Digital Stakeholder
- **Primary need:** Understand what is happening on a VA website and whether campaigns, pages, and calls to action are working.
- **Likely role:** VA product owner, communications lead, content strategist, digital services manager, campaign lead, or program stakeholder responsible for web performance.
- **Relationship to the extension:** Indirect. They ask Pete questions or receive exports from Pete; they do not operate the Chrome extension.
- **Analytics skill level:** Low to moderate. They may know terms like "traffic," "visitors," "campaign," "downloads," and "conversions," but may not understand GA4 concepts like dimensions, metrics, session source, key events, engagement rate, or attribution.
- **Decision cadence:** Weekly during campaigns, monthly for routine reporting, ad hoc after launches or stakeholder questions.

## Job To Be Done

When a VA stakeholder has a question about site or campaign performance, they need a clear answer backed by numbers so they can decide what to report, adjust, fix, or investigate next without becoming a GA4 expert.

## Core Responsibilities

- Report whether a campaign drove the intended traffic or action.
- Explain site performance to leadership or partner teams in plain language.
- Spot whether important pages are being found and used.
- Identify where visitors came from: search, referral, email, paid, social, direct, or other channels.
- Understand whether visitors completed desired actions such as form starts, form submissions, downloads, outbound clicks, or other tracked events.
- Monitor launch impact for new pages, campaigns, announcements, or content updates.
- Bring defensible numbers into meetings, status reports, briefs, and follow-up decisions.
- Know when GA4 cannot answer the question and a different source is needed.

## Goals

- Get a quick answer without opening GA4 or building a report manually.
- Know what changed and whether that change matters.
- Compare performance across time periods, channels, campaigns, pages, or device types.
- Separate real performance signals from noise, missing tracking, or vague campaign naming.
- Leave with a small set of numbers they can cite.
- Understand the caveats in normal language.
- Avoid overclaiming when the available data is incomplete.

## Typical Questions

### Site Traffic

- How many visitors came to the site last month?
- Where is traffic coming from?
- Which websites are sending referral traffic?
- How much traffic came from Google Search?
- Did traffic spike or drop after a launch?
- Which landing pages are bringing people in?

### Campaign Performance

- Did the campaign increase traffic?
- Which campaign drove the most visits?
- How is our email campaign performing?
- Are people from the campaign completing the intended action?
- Are campaign visitors staying on the site or leaving quickly?
- Why are campaign numbers lower than expected?

### Content Performance

- Which pages are most viewed?
- Are people using the new page?
- Which pages have weak engagement?
- Are visitors finding PDF downloads or outbound links?
- What pages do people visit after landing on the homepage?

### Engagement And Actions

- What percentage of sessions were engaged?
- Are people clicking the main call to action?
- Are people completing the form or process?
- Where do people drop off?
- Are search visitors behaving differently than direct visitors?

### Audience And Technical Context

- What devices are people using?
- Are mobile users having a worse experience than desktop users?
- What browsers or operating systems matter for testing?
- What locations or languages are represented in the audience?

## What "Good" Looks Like To Them

A good answer is short, plain, and usable in a meeting. It includes:

- The direct answer first.
- The date range.
- The property or site being analyzed.
- The key number or top few rows.
- A comparison when useful, such as prior period or another channel.
- A clear caveat if tracking, tagging, or definitions limit the answer.
- A table or export Pete can hand off.

Example shape:

> Email campaign traffic was modest: 412 sessions from email during May, representing 6% of all sessions. Those visitors were more engaged than average, with a 61% engagement rate compared with 48% sitewide. The numbers depend on campaign links being tagged with email UTM values.

## Plain-English Concepts They Need

These explanations should influence UI copy, answer composition, and follow-up prompts.

- **Users:** Approximate people who visited the site. Useful for audience size.
- **Sessions:** Visits. One person can have more than one session.
- **Channel:** The broad way someone arrived, such as organic search, email, referral, paid search, social, or direct.
- **Source / medium:** A more specific label for where traffic came from and how it got there, such as `google / organic` or `newsletter / email`.
- **Campaign:** A tagged marketing or communications effort. Campaign reports only work well when links use consistent campaign tags.
- **Landing page:** The first page someone saw in a visit. Useful for knowing where people enter the site.
- **Engaged session:** A visit where the person stayed long enough, viewed enough, or completed an important action for GA4 to count it as engaged.
- **Engagement rate:** The share of visits GA4 counted as engaged. Useful as a rough quality signal, not a complete satisfaction measure.
- **Key event / conversion:** An important tracked action, such as a form submission or download. It only appears if GA4 has been configured to track it.
- **Event:** Something GA4 records, such as page views, clicks, downloads, scrolls, or form actions. Events depend on site tracking setup.
- **Attribution:** GA4's way of assigning credit to traffic sources or campaigns. It can explain contribution, but it is not the same as proving causation.

## Data They Trust

- Clear counts: users, sessions, views, event counts, downloads, form submissions.
- Simple rankings: top pages, top channels, top campaigns, top referral sources.
- Direct comparisons: this month vs. last month, campaign period vs. prior period, mobile vs. desktop.
- Tables that match the chart in the same export.
- Notes that explain when campaign tags or event tracking affect confidence.

## Data They May Misread

- Treating "users" as exact people rather than an analytics estimate.
- Treating "direct" traffic as a meaningful source instead of often meaning "GA4 could not identify the source."
- Treating low campaign traffic as campaign failure when links may not have been tagged.
- Assuming GA4 can identify individual visitors, names, emails, or exact journeys.
- Assuming engagement rate proves satisfaction.
- Assuming a traffic increase was caused by a campaign without comparing timing, channels, and other possible sources.
- Assuming GA4 can answer page speed, accessibility compliance, content quality, or offline behavior questions by itself.

## Common Pain Points

- GA4 language is too technical and changes from older Universal Analytics terms.
- Campaign tagging is inconsistent across emails, social posts, paid ads, and partner links.
- Important actions may not be tracked as events or key events.
- Stakeholders ask broad questions like "did it work?" without naming the campaign, action, or date range.
- Leadership wants one answer, but the data needs caveats.
- GA4 can show what happened on the site, but not always why it happened.
- Manual GA4 reports are hard to reproduce and explain.

## Clarification Triggers

The assistant should ask a follow-up instead of guessing when the stakeholder question is missing:

- The campaign name, channel, source, medium, or tagged URL.
- The date range or launch date.
- The site, GA4 property, or page path.
- The desired action, such as form submit, download, call-to-action click, or outbound click.
- The comparison baseline, such as prior period, previous year, or another campaign.
- The audience segment, such as mobile users, organic search visitors, email visitors, or referral visitors.

Examples:

- "Did our campaign work?" needs the campaign name, date range, and intended action.
- "Are people using the page?" needs the page URL or title and the date range.
- "Did more people apply?" needs the tracked event or form completion that represents applying.

## Unanswerable Or Out-Of-Scope Questions

This persona commonly asks questions that sound reasonable but GA4 cannot answer cleanly. The extension should fail visibly or ask for clarification instead of inventing an answer.

- Who exactly visited the site?
- What is a visitor's name, email, claim number, or personal identity?
- Did a specific veteran complete a task?
- What did someone do before they arrived from an untracked external system?
- Why did a person feel confused or satisfied?
- Is the page Section 508 compliant?
- Is the page fast or slow for users in a full performance-engineering sense?
- Did offline outreach cause a web visit without campaign tagging or another connecting signal?
- Did a campaign cause an outcome outside the tracked website journey?

## Report And Export Expectations

- Exported files should be self-contained enough for Pete to send manually.
- Every chart must include the underlying table.
- Tables should use readable labels rather than GA4 field names where possible.
- PDF summaries should include the question, answer, date range, property/site, chart if available, table, and caveats.
- CSV exports should preserve the raw rows so Pete can validate or rework the numbers.
- No live links, hosted dashboards, scheduled emails, or VA customer access.

## Product Implications

- Keep answers direct and short, then show the supporting numbers.
- Prefer plain labels like "Where visitors came from" over "Session default channel group" in user-facing copy.
- When GA4 terminology appears, explain it in one sentence the first time it matters.
- Treat campaign questions as high-risk for ambiguity because campaign tracking depends on UTM tagging.
- Treat key-event questions as high-risk for ambiguity because the desired action must be tracked first.
- Make "no data found" distinct from "tracking may be missing" and from "GA4 cannot answer this."
- Saved/pinned reports should use stakeholder-readable names, such as "Monthly traffic by channel" or "Email campaign sessions and actions."
- Preset reports should support the most common stakeholder needs: traffic acquisition, user acquisition, pages and screens, events, key events/conversions, and realtime monitoring.

## Manual Test Seeds

Use these to expand the `GA4_Question_Reference/` bank or exercise translator behavior:

- How many visitors came to the site during the campaign?
- Which channels drove the most campaign traffic?
- Did email visitors complete the form more often than other visitors?
- Which pages did campaign visitors land on first?
- Did traffic increase after the launch date?
- Which referral sites sent the most traffic?
- Are mobile visitors engaging less than desktop visitors?
- Which downloads happened most often during the campaign?
- Did the campaign drive more engaged sessions than the previous month?
- Can we identify which individual veterans clicked the link? Expected result: GA4 cannot answer.

## Success Criteria For This Persona

- Pete can translate vague VA stakeholder questions into answerable GA4 questions faster.
- The assistant asks for missing campaign, date, page, or action details instead of guessing.
- Exports can be handed to a stakeholder without Pete rewriting GA4 jargon.
- The tool remains Pete-only while still reflecting the reality of VA stakeholder reporting needs.
