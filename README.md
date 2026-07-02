# GA4 Query Assistant

A single-user Chrome extension for asking plain-language questions about GA4 data.

## Test

Run `npm test`.

## Load locally

1. Open `chrome://extensions` in Chrome.
2. Enable Developer mode.
3. Select **Load unpacked** and choose this repository.
4. Pin **GA4 Query Assistant** and click its toolbar icon to open the side panel.

The OAuth client ID is configuration, not a secret. Anthropic keys and OAuth tokens must not be committed; local file-based configuration belongs in an ignored `local-config.*` or `secrets.*` file.
