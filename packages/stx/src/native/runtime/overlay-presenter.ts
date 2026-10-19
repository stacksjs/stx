import type { NativeNode } from './native-host'

/** Overlay policy stays in the shared runtime; this adapter presents native Modal nodes. */
export interface NativeOverlayEntry {
  id: string
  root: NativeNode | null
  modal: boolean
  zIndex?: number | null
  onRequestClose?: ((event?: unknown) => void) | null
}

interface OverlayHost {
  type: (node: NativeNode) => string | undefined
  setAttribute: (node: NativeNode, name: string, value: unknown) => void
  setStyle: (node: NativeNode, style: Record<string, unknown>) => void
  listen: (node: NativeNode, event: string, callback: (event?: unknown) => void) => void
}

export interface NativeOverlayPresenter {
  sync: (entries: NativeOverlayEntry[]) => void
  dispose: () => void
}

export function createNativeOverlayPresenter(host: OverlayHost): NativeOverlayPresenter {
  let current: NativeOverlayEntry[] = []
  const listening = new WeakSet<NativeNode>()

  function sync(entries: NativeOverlayEntry[]): void {
    // Validate the complete change before touching any displayed overlay.
    for (const entry of entries) {
      if (!entry.root || host.type(entry.root) !== 'Modal' || !entry.modal)
        throw new Error(`[stx:overlays] Native overlay "${entry.id}" requires a Modal root (data-native="Modal"). Anchored/non-modal popups require a host positioning capability.`)
    }
    const previous = current
    current = entries.slice()
    for (const entry of previous) {
      if (!current.some(next => next.root === entry.root)) host.setAttribute(entry.root!, 'visible', false)
    }
    for (const [index, entry] of current.entries()) {
      const root = entry.root!
      if (!listening.has(root)) {
        listening.add(root)
        host.listen(root, 'request-close', (event) => {
          const top = current.at(-1)
          // The renderer may deliver a stale close request for a covered layer.
          // A denied request must reassert visibility: native Modal temporarily
          // suppresses interaction while it waits for the JS dismissal answer.
          try {
            if (top?.root === root) top.onRequestClose?.(event)
          }
          finally {
            if (current.some(active => active.root === root)) host.setAttribute(root, 'visible', true)
          }
        })
      }
      host.setAttribute(root, 'visible', true)
      host.setStyle(root, { zIndex: (entry.zIndex ?? 1000) + index })
    }
  }

  return { sync, dispose() { current = [] } }
}
