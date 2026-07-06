# Vendored: flatpickr

Version: 4.6.13 (matches `flatpickr` in `package.json`/`package-lock.json`)
Source: https://github.com/flatpickr/flatpickr
License: MIT (see below)

## Why vendored instead of imported from node_modules

Manifest V3 extensions can't load remote/CDN scripts, and this project has no
bundler — everything loads directly via `<script type="module">`. These are
the ESM build files copied out of `node_modules/flatpickr/dist/esm/` (index
entry point plus its actual transitive imports only, not the full locale/
plugin set flatpickr ships), plus the prebuilt `flatpickr.min.css`.

flatpickr's own ESM build uses extensionless imports (`from "./types/options"`),
which bundlers resolve but native browser ES modules do not — Chrome refuses
them with a 404. Every `import` line in these vendored files has been patched
to add an explicit `.js` extension. This is the one deviation from a literal
file copy; everything else is unmodified upstream source.

## Updating

1. `npm install flatpickr@<version>`
2. Re-copy `node_modules/flatpickr/dist/esm/index.js` and re-check its
   `import` lines for anything new — copy over any newly-added transitive
   dependency file, preserving the relative directory structure.
3. Add a `.js` extension to every relative `import`/`export ... from` line in
   every copied file (including transitively-copied ones) — this step is easy
   to forget and the failure mode is a silent 404 with no console error in
   some environments, not an obvious crash.
4. Re-copy `node_modules/flatpickr/dist/flatpickr.min.css`.
5. Bump the version noted above.

## License

MIT License (c) Gregory Petrosyan. Full text:
https://github.com/flatpickr/flatpickr/blob/master/LICENSE.md
