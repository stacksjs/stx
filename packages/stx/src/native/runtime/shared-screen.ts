import type { BindingManifest } from '../../binding-manifest'
import type { STXDocument } from '../compiler/ir'
import { materializeNativeBindingTree } from './binding-tree'
import { createNativeHost, type NativeHost } from './native-host'

interface NativeBridgeLike {
  postMessage: (message: string) => void
  onMessage: (receiver: (message: unknown) => void) => void
}

interface SharedSignalsRuntime {
  hydrateHost: (root: unknown, setup: (() => Record<string, unknown>) | Record<string, unknown> | null, manifest: BindingManifest, nodes: Map<number, unknown>) => unknown
}

export interface SharedNativeScreen {
  host: NativeHost
  mount: (runtime: SharedSignalsRuntime, setup: (() => Record<string, unknown>) | null) => void
}

/** Connect translated IR to the ordinary stx signals runtime and native bridge. */
export function prepareSharedNativeScreen(
  document: STXDocument,
  manifest: BindingManifest,
  bridge: NativeBridgeLike,
): SharedNativeScreen {
  let messageSequence = 0
  let revision = 0

  const send = (type: string, payload: unknown): void => {
    bridge.postMessage(JSON.stringify({
      id: `stx_${++messageSequence}`,
      type,
      timestamp: Date.now(),
      payload,
      source: 'js',
    }))
  }

  const host = createNativeHost({
    send(operations) {
      const baseRevision = revision
      revision++
      send('MUTATE', {
        version: 1,
        batchId: `mutation_${revision}`,
        baseRevision,
        revision,
        operations,
      })
    },
  })
  const tree = materializeNativeBindingTree(document, manifest, host)

  bridge.onMessage((incoming) => {
    const message = typeof incoming === 'string' ? JSON.parse(incoming) : incoming as any
    if (message?.type !== 'EVENT') return
    const handlerId = message.payload?.handlerId ?? message.payload?.handlerName
    if (typeof handlerId === 'string')
      host.dispatch(handlerId, message.payload?.nativeEvent)
  })

  return {
    host,
    mount(runtime, setup) {
      send('RENDER', { document, mode: 'replace' })
      runtime.hydrateHost(tree.root, setup, manifest, tree.nodes)
    },
  }
}
