/**
 * Background service worker — the thin chrome adapter over the relay routing
 * core (stacksjs/stx#1747). Maps each connecting `chrome.runtime` port onto a
 * `RelayPort` and lets `createPortRelay` pair panels with content scripts.
 */
import type { RelayPort } from './relay'
import { createPortRelay } from './relay'

// eslint-disable-next-line ts/no-explicit-any
declare const chrome: any

const relay = createPortRelay()

// eslint-disable-next-line ts/no-explicit-any
chrome.runtime.onConnect.addListener((port: any) => {
  const adapter: RelayPort = {
    name: port.name,
    tabId: port.sender && port.sender.tab ? port.sender.tab.id : undefined,
    postMessage: msg => port.postMessage(msg),
    onMessage: handler => port.onMessage.addListener(handler),
    onDisconnect: handler => port.onDisconnect.addListener(handler),
  }
  relay.register(adapter)
})
