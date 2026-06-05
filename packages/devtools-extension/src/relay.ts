/**
 * Background relay routing core (stacksjs/stx#1747). In MV3 a devtools-panel
 * port and the inspected tab's content-script port can't talk directly — the
 * background service worker pairs them by tab id and forwards messages both ways
 * (panel → page requests, page → panel responses).
 *
 * This is the pure routing logic over an abstract `RelayPort`, so it's unit-
 * testable without `chrome`. `background.ts` is the thin adapter that maps real
 * `chrome.runtime` ports onto it.
 */
import { STX_DEVTOOLS_CHANNEL } from './protocol'

export interface RelayPort {
  /** Port name: `stx-devtools` (content script) or `stx-devtools:panel:<tabId>`. */
  name: string
  /** Tab id — present on content-script ports (from `sender.tab.id`). */
  tabId?: number
  postMessage: (msg: unknown) => void
  onMessage: (handler: (msg: unknown) => void) => void
  onDisconnect: (handler: () => void) => void
}

const PANEL_NAME_RE = /^stx-devtools:panel:(\d+)$/

export interface PortRelay {
  /** Wire up a newly-connected port (content script or panel). */
  register: (port: RelayPort) => void
  /** Live panel ports by tab id (for assertions). */
  panels: Map<number, RelayPort>
  /** Live content-script ports by tab id (for assertions). */
  pages: Map<number, RelayPort>
}

export function createPortRelay(): PortRelay {
  const panels = new Map<number, RelayPort>()
  const pages = new Map<number, RelayPort>()

  function register(port: RelayPort): void {
    const panelMatch = PANEL_NAME_RE.exec(port.name)
    if (panelMatch) {
      const tabId = Number(panelMatch[1])
      panels.set(tabId, port)
      // panel → page (requests)
      port.onMessage((msg) => { pages.get(tabId)?.postMessage(msg) })
      port.onDisconnect(() => { panels.delete(tabId) })
      return
    }
    if (port.name === STX_DEVTOOLS_CHANNEL && typeof port.tabId === 'number') {
      const tabId = port.tabId
      pages.set(tabId, port)
      // page → panel (responses)
      port.onMessage((msg) => { panels.get(tabId)?.postMessage(msg) })
      port.onDisconnect(() => { pages.delete(tabId) })
    }
  }

  return { register, panels, pages }
}
