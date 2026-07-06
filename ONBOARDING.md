# Onboarding — Connecting GA4 Navigator

The extension's OAuth client is in Google Cloud **Testing** publishing status.
Only Google accounts explicitly added as **Test users** on the OAuth consent
screen can authorize the extension. This isn't visible anywhere in the
extension UI, so it has to be handled by hand until the app moves out of
Testing mode (see BACKLOG.md).

## New user flow

Before installing, confirm:

1. **You have a GA4 property.** If you don't have GA4 access at all, that's
   a GA4/analytics setup problem, not an extension problem — get GA4 access
   first.
2. **An admin has added your Google account as a Test user.** This is the
   step nobody expects. Ask whoever manages the extension's Google Cloud
   project to add you (see Admin flow below) *before* you try to connect.
3. **You're signed into the right Google account in Chrome.** Work GA4
   access is often tied to a work profile, not your default/personal one.
   Check the account switcher in the top-right of Chrome.

Then:

4. Install the extension.
5. Click **Add Property**, then connect. If you see "Not approved to
   connect," you skipped step 2 — go ask your admin.

## Admin flow — adding a new user

1. Go to [Google Cloud Console](https://console.cloud.google.com/) →
   select the project that owns the extension's OAuth client.
2. Navigate to **Google Auth Platform → Audience**.
3. Under **Test users**, click **Add users**, enter the person's email.
4. Save.
5. Tell the user they're clear to connect.

## Known gap

There's no way for the extension to distinguish "you're not a test user"
from other Google-side sign-in failures 100% of the time — Google's
OAuth consent block for non-approved accounts happens in a Google-hosted
window the extension doesn't get details from. If a user gets stuck at the
Google consent screen itself (not the extension's own error message),
that's almost always a missing Test user entry.
