/**
 * @stacksjs/stx-devtools-extension — the browser-extension side of Stacks
 * DevTools (stacksjs/stx#1747). Consumes the in-page `window.__stxDevtools`
 * introspection protocol via a postMessage bridge.
 *
 * This is the protocol + bridge layer (testable, framework-agnostic). The panel
 * UI, content script, and manifest live alongside it; see the README.
 */
export * from './inject'
export * from './protocol'
