Chart.js browser bundle vendored from `chart.js@4.5.1`.

Source file:
`node_modules/chart.js/dist/chart.umd.min.js`

Reason:
The Chrome extension runs without a bundler, so the side panel loads an
extension-local UMD build before `sidepanel.js`.
