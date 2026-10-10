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
  const protocol = new STXBridge()
  protocol.initialize(bridge)
  installCraftBridge(protocol, bridge, globalThis as Record<string, any>, options)

  const host = createNativeHost({
    send(operations) {
      const baseRevision = revision
      revision++
      protocol.mutate({
        version: 1,
        batchId: `mutation_${revision}`,
        baseRevision,
        revision,
        operations,
      })
    },
  })
  const tree = materializeNativeBindingTree(document, manifest, host)
  let dispose: (() => void) | null = null

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
    },
  }
}
