import type { BindingManifest } from '../../binding-manifest'
import type { NativeBridgeInterface } from '../bridge/protocol'
import type { STXDocument } from '../compiler/ir'
import { STXBridge } from '../bridge/protocol'
import { materializeNativeBindingTree } from './binding-tree'
import type { NativeBindingNode } from './binding-tree'
import { installCraftBridge, type CraftBridgeOptions } from './craft-bridge'
import { createNativeHost, type NativeHost } from './native-host'

interface SharedSignalsRuntime {
  hydrateHost: (root: unknown, setup: (() => Record<string, unknown>) | Record<string, unknown> | null, manifest: BindingManifest, nodes: Map<number, unknown>) => (() => void)
}

export interface SharedNativeScreen {
  host: NativeHost
  /** Resolve the native node that owns a generated component setup. */
  scopeRoot: (scopeId: string) => NativeBindingNode | null
  mount: (runtime: SharedSignalsRuntime, setup: (() => Record<string, unknown>) | null) => void
  unmount: () => void
}

/** Connect translated IR to the ordinary stx signals runtime and native bridge. */
export function prepareSharedNativeScreen(
  document: STXDocument,
  manifest: BindingManifest,
  bridge: NativeBridgeInterface,
  options: CraftBridgeOptions = {},
): SharedNativeScreen {
  let revision = 0
  // Bumped by every full render: a batch named for an older generation was
  // sent before that render, so its rejection says nothing about the tree now.
  let generation = 0
  const protocol = new STXBridge()
  protocol.initialize(bridge)
  installCraftBridge(protocol, bridge, globalThis as Record<string, any>, options)

  const host = createNativeHost({
    colorScheme: bridge.colorScheme === 'dark' ? 'dark' : 'light',
    send(operations) {
      const baseRevision = revision
      revision++
      protocol.mutate({
        version: 1,
        batchId: `mutation_${generation}_${revision}`,
        baseRevision,
        revision,
        operations,
      })
    },
  })
  protocol.on<any>('APPEARANCE', (message) => {
    const scheme = message.payload?.colorScheme
    if (scheme === 'light' || scheme === 'dark') {
      bridge.colorScheme = scheme
      host.setColorScheme(scheme)
    }
  })

  const tree = materializeNativeBindingTree(document, manifest, host)
  let dispose: (() => void) | null = null

  /*
   * The native side applies a batch whole or not at all, and each batch is
   * based on the revision before it. One rejected batch used to leave the
   * screen frozen for good: every later batch failed on REVISION_MISMATCH,
   * so no signal change reached the screen again. A rejection now redraws the
   * screen from the tree as the host holds it, ids and all, and the next
   * batches build on that.
   */
  protocol.on<any>('MUTATION_ERROR', (message) => {
    const payload = message.payload ?? {}
    const batch = String(payload.batchId ?? '')
    if (batch && !batch.startsWith(`mutation_${generation}_`))
      return
    console.error(`[stx native] the screen refused ${batch || 'a mutation batch'} (${payload.code ?? 'error'}: ${payload.message ?? ''}); redrawing it`)
    generation++
    revision = 0
    protocol.render(host.snapshot(tree.root))
  })

  protocol.on<any>('EVENT', (message) => {
    const handlerId = message.payload?.handlerId ?? message.payload?.handlerName
    if (typeof handlerId === 'string')
      host.dispatch(handlerId, message.payload?.nativeEvent)
  })

  return {
    host,
    scopeRoot(scopeId) {
      return tree.scopes.get(scopeId) ?? null
    },
    mount(runtime, setup) {
      dispose?.()
      // Native hosts reconcile the root node. The compiler envelope also
      // carries build metadata and scripts, but treating that envelope as a
      // node silently produces an empty fallback View in the UIKit host.
      dispose = runtime.hydrateHost(tree.root, setup, manifest, tree.nodes)
      // Bindings must be installed before the first render reaches the host.
      // Otherwise native lifecycle events see the source expression (for
      // example `modalRequested()`) instead of the handler id registered by
      // the shared runtime. Keep the initial render as the first bridge
      // message, then flush the hydrated values and handler ids immediately.
      protocol.render(document.root)
      host.flush()
    },
    unmount() {
      dispose?.()
      dispose = null
      protocol.dispose('screen-closed')
    },
  }
}

/**
 * The app script: one context for the app's whole life, with no screen.
 *
 * What a phone app does whatever is on screen lives here: registering for
 * push and following a tapped notification, background refresh, keeping the
 * account's details fresh for the screens. The host runs it from the same
 * bundle as the screens, under the route `__app` (Craft's `nativeApp`), and
 * it gets the same `craft` bridge a screen does, minus drawing. The host's
 * app events - a notification tapped or received, a silent push, a
 * background refresh - arrive as the page's CustomEvents on its global
 * (`craftNotificationResponse`, `craftBackgroundRefresh`, ...), so code
 * shared with the page (`@stacksjs/mobile`) hears them unchanged.
 */
export type NativeAppMain = (craft: Record<string, any>) => void | (() => void) | Promise<void | (() => void)>

export interface SharedNativeApp {
  /** Run the app script's main function, once. */
  start: (main: NativeAppMain | { default?: NativeAppMain } | null | undefined) => void
  /** The app is going away: the main function's cleanup, then the bridge's. */
  unmount: () => void
}

/** The route a host names to run the app script rather than a screen. */
export const NATIVE_APP_ROUTE = '__app'

export function prepareNativeApp(bridge: NativeBridgeInterface, options: CraftBridgeOptions = {}): SharedNativeApp {
  const protocol = new STXBridge()
  protocol.initialize(bridge)
  const craft = installCraftBridge(protocol, bridge, globalThis as Record<string, any>, { ...options, routeName: options.routeName || NATIVE_APP_ROUTE })
  let cleanup: (() => void) | null = null
  let stopped = false
  const report = (error: unknown) => console.error(`[stx native] the app script failed: ${error instanceof Error ? error.stack || error.message : String(error)}`)
  const keep = (value: unknown) => {
    if (typeof value !== 'function') return
    if (stopped) (value as () => void)()
    else cleanup = value as () => void
  }
  return {
    start(main) {
      const run = typeof main === 'function' ? main : main?.default
      if (typeof run !== 'function') {
        console.error('[stx native] the app script exports no function to run')
        return
      }
      try {
        const answer = run(craft)
        if (answer && typeof (answer as Promise<unknown>).then === 'function') (answer as Promise<unknown>).then(keep, report)
        else keep(answer)
      }
      catch (error) {
        report(error)
      }
    },
    unmount() {
      stopped = true
      try {
        cleanup?.()
      }
      catch (error) {
        report(error)
      }
      cleanup = null
      // The host knows one reason for calls left open by a context it ends.
      protocol.dispose('screen-closed')
    },
  }
}
