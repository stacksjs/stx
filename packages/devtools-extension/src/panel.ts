/**
 * Panel UI (skeleton). Sends protocol requests and renders the responses as JSON
 * so the end-to-end pipeline (panel → relay → page bridge → __stxDevtools) is
 * verifiable the moment the extension loads. The rich UI — component-tree view,
 * an interactive reactive graph, the query timeline — is the remaining work and
 * is a thin client of the same `request()` below.
 */
import type { DevtoolsRequest, DevtoolsRequestType, DevtoolsResponse } from './protocol'
import { createPanelController } from './panel-controller'
import { createPoller } from './poller'
import { STX_DEVTOOLS_CHANNEL } from './protocol'

// eslint-disable-next-line ts/no-explicit-any
declare const chrome: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

let nextId = 1
const pending = new Map<number, (res: DevtoolsResponse) => void>()

// Transport: a port to the inspected tab, keyed by tabId. (The background relay
// that bridges this port to the tab's content-script port is the remaining
// wiring — see the README.)
const port = chrome.runtime.connect({ name: `${STX_DEVTOOLS_CHANNEL}:panel:${chrome.devtools.inspectedWindow.tabId}` })
port.onMessage.addListener((res: DevtoolsResponse) => {
  const resolve = pending.get(res.id)
  if (resolve) {
    pending.delete(res.id)
    resolve(res)
  }
})

/** Send a protocol request and resolve with its response. */
export function request(type: DevtoolsRequestType, payload?: Record<string, unknown>): Promise<DevtoolsResponse> {
  const id = nextId++
  const req: DevtoolsRequest = { id, type, payload }
  return new Promise((resolve) => {
    pending.set(id, resolve)
    port.postMessage(req)
  })
}

const out = document.getElementById('out')
const bar = document.getElementById('bar')
const panel = createPanelController({ request, setHtml: html => { out.innerHTML = html } })

const VIEWS: DevtoolsRequestType[] = ['tree', 'graph', 'queries', 'ifTrace', 'stats', 'stores']
for (const view of VIEWS) {
  const b = document.createElement('button')
  b.textContent = view
  b.onclick = () => panel.show(view)
  bar.appendChild(b)
}

document.getElementById('enable').addEventListener('click', () => request('enable'))

// Filter the graph view by signal/scope name.
const filterInput = document.getElementById('filter') as { value: string, addEventListener: (e: string, h: () => void) => void }
filterInput.addEventListener('input', () => panel.setGraphFilter(filterInput.value))

// Click a scope id in the tree → drill into its inspector.
out.addEventListener('click', (e: { target?: { getAttribute?: (n: string) => string | null } }) => {
  const scopeId = e.target?.getAttribute?.('data-scope')
  if (scopeId)
    panel.inspectScope(scopeId)
})

// Live refresh: poll the current view ~1s while the toggle is on.
const poller = createPoller({ tick: () => panel.refresh(), intervalMs: 1000 })
const live = document.getElementById('live') as { checked: boolean, addEventListener: (e: string, h: () => void) => void }
live.addEventListener('change', () => { live.checked ? poller.start() : poller.stop() })
