/**
 * Content script — the relay (stacksjs/stx#1747). Runs in the isolated
 * content-script world (has `chrome.runtime`, but NOT the page's
 * `window.__stxDevtools`). It:
 *   1. injects `inject.js` into the PAGE world so the bridge can read
 *      `window.__stxDevtools`;
 *   2. forwards protocol requests from the devtools panel onto the page
 *      (`window.postMessage`);
 *   3. forwards the bridge's responses from the page back to the panel.
 */
import type { DevtoolsRequest } from './protocol'
import { STX_DEVTOOLS_CHANNEL } from './protocol'

// eslint-disable-next-line ts/no-explicit-any
declare const chrome: any

// 1. Inject the page-world bridge.
const script = document.createElement('script')
script.src = chrome.runtime.getURL('inject.js')
;(document.head || document.documentElement).appendChild(script)
script.onload = () => script.remove()

// 2. Panel → page: forward requests from the extension onto the page.
const port = chrome.runtime.connect({ name: STX_DEVTOOLS_CHANNEL })
port.onMessage.addListener((request: DevtoolsRequest) => {
  window.postMessage({ channel: STX_DEVTOOLS_CHANNEL, direction: 'request', request }, '*')
})

// 3. Page → panel: forward the bridge's responses back to the extension.
window.addEventListener('message', (event: MessageEvent) => {
  const data = event.data
  if (data && data.channel === STX_DEVTOOLS_CHANNEL && data.direction === 'response')
    port.postMessage(data.response)
})
