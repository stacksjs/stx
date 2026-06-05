/**
 * Page-injected DevTools bridge (stacksjs/stx#1747).
 *
 * Runs in the inspected page's world. Listens for protocol requests relayed onto
 * the page `window` (by the content script), answers each from
 * `window.__stxDevtools` via the pure `handleDevtoolsRequest`, and posts the
 * response back. The extension panel never sees `__stxDevtools` directly — only
 * the serialized responses crossing this boundary.
 */
import type { DevtoolsRequest, DevtoolsResponse, StxDevtoolsApi } from './protocol'
import { handleDevtoolsRequest, STX_DEVTOOLS_CHANNEL } from './protocol'

interface BridgeMessage {
  channel?: string
  direction?: 'request' | 'response'
  request?: DevtoolsRequest
  response?: DevtoolsResponse
}

/** A minimal window-like target so this is testable without a real DOM. */
export interface BridgeTarget {
  addEventListener: (type: 'message', handler: (event: { data: unknown }) => void) => void
  removeEventListener: (type: 'message', handler: (event: { data: unknown }) => void) => void
  postMessage: (message: unknown, targetOrigin?: string) => void
  // eslint-disable-next-line ts/no-explicit-any
  __stxDevtools?: StxDevtoolsApi | any
}

/**
 * Install the bridge on `target` (defaults to the real `window`). Returns a
 * disposer that removes the listener.
 */
export function installDevtoolsBridge(target?: BridgeTarget): () => void {
  // eslint-disable-next-line ts/no-explicit-any
  const win = (target || (globalThis as any).window) as BridgeTarget
  const onMessage = (event: { data: unknown }) => {
    const data = event.data as BridgeMessage
    // Only answer our own request messages — ignore everything else on the page.
    if (!data || data.channel !== STX_DEVTOOLS_CHANNEL || data.direction !== 'request' || !data.request)
      return
    const response = handleDevtoolsRequest(win.__stxDevtools, data.request)
    win.postMessage({ channel: STX_DEVTOOLS_CHANNEL, direction: 'response', response }, '*')
  }
  win.addEventListener('message', onMessage)
  return () => win.removeEventListener('message', onMessage)
}
