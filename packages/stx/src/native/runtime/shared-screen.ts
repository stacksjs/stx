import type { BindingManifest } from '../../binding-manifest'
import type { NativeBridgeInterface } from '../bridge/protocol'
import type { STXDocument } from '../compiler/ir'
import { STXBridge } from '../bridge/protocol'
import { materializeNativeBindingTree } from './binding-tree'
import { installCraftBridge, type CraftBridgeOptions } from './craft-bridge'
import { createNativeHost, type NativeHost } from './native-host'

interface SharedSignalsRuntime {
  hydrateHost: (root: unknown, setup: (() => Record<string, unknown>) | Record<string, unknown> | null, manifest: BindingManifest, nodes: Map<number, unknown>) => (() => void)
}

export interface SharedNativeScreen {
  host: NativeHost
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
    mount(runtime, setup) {
      dispose?.()
      // Native hosts reconcile the root node. The compiler envelope also
      // carries build metadata and scripts, but treating that envelope as a
      // node silently produces an empty fallback View in the UIKit host.
      protocol.render(document.root)
      dispose = runtime.hydrateHost(tree.root, setup, manifest, tree.nodes)
    },
    unmount() {
      dispose?.()
      dispose = null
      protocol.dispose('screen-closed')
    },
  }
}
