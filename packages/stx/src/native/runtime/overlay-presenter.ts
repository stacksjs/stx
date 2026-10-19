import type { NativeNode } from './native-host'
import type { NativeFocusOptions } from './view-operations'

type FocusTarget = NativeNode | (() => NativeNode | null) | null

/** Overlay policy stays in the shared runtime; this adapter presents native Modal nodes. */
export interface NativeOverlayEntry {
  id: string
  root: NativeNode | null
  modal: boolean
  zIndex?: number | null
  panel?: FocusTarget
  initialFocus?: FocusTarget
  onRequestClose?: ((event?: unknown) => void) | null
}

interface OverlayHost {
  canFocus: boolean
  focus: (node: NativeNode, options: NativeFocusOptions) => Promise<true>
  descendants: (node: NativeNode) => NativeNode[]
  hasAutofocus: (node: NativeNode) => boolean
  isAvailable: (node: NativeNode) => boolean
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
  let focusing: AbortController | null = null

  function focusInitial(entry: NativeOverlayEntry): void {
    if (!host.canFocus) {
      if (entry.initialFocus)
        console.warn(`[stx:overlays] Native initialFocus for "${entry.id}" requires viewFocus support; focus was not moved.`)
      return
    }
    const controller = focusing = new AbortController()
    // Let all overlay effects for this turn settle: if two open together,
    // only the top layer may take focus. The host adapter checks cancellation
    // again before dispatching its asynchronous request.
    queueMicrotask(async () => {
      if (controller.signal.aborted || current.at(-1)?.root !== entry.root) return
      try {
        const resolve = (value: FocusTarget | undefined): NativeNode | null => typeof value === 'function' ? value() : value ?? null
        const panel = resolve(entry.panel) ?? entry.root!
        const explicit = resolve(entry.initialFocus)
        const candidates = [panel, ...host.descendants(panel)].filter(node => host.isAvailable(node))
        const target = explicit ?? candidates.find(node => host.hasAutofocus(node))
          ?? candidates.find(node => ['TextInput', 'Button', 'Pressable', 'Checkbox', 'Switch', 'Picker', 'Slider', 'Link'].includes(host.type(node) ?? ''))
          ?? (host.isAvailable(panel) ? panel : null)
        if (!target || !host.isAvailable(target)) {
          if (explicit)
            console.warn(`[stx:overlays] Native initialFocus for "${entry.id}" must reference a mounted, visible, enabled view; focus was not moved.`)
          return
        }
        await host.focus(target, { mode: host.type(target) === 'TextInput' ? 'keyboard' : 'accessibility', signal: controller.signal })
      }
      catch (error) {
        if (!controller.signal.aborted)
          console.warn(`[stx:overlays] Native focus failed for "${entry.id}": ${error instanceof Error ? error.message : String(error)}`)
      }
    })
  }

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
    const top = current.at(-1)
    if (top?.root !== previous.at(-1)?.root) {
      focusing?.abort()
      focusing = null
      // Revealing an already-open layer must retain the user's last focus;
      // Craft restores the opener when the covering Modal is dismissed.
      if (top && !previous.some(entry => entry.root === top.root)) focusInitial(top)
    }
  }

  return { sync, dispose() { focusing?.abort(); focusing = null; current = [] } }
}
