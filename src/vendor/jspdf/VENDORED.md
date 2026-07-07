jsPDF browser bundle vendored from `jspdf@4.2.1`.

Source file:
`node_modules/jspdf/dist/jspdf.umd.min.js`

Reason:
The Chrome extension runs without a bundler, so the side panel loads an
extension-local UMD build before `sidepanel.js`.
