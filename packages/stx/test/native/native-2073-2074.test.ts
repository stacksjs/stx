import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import vm from 'node:vm'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { createTempDir } from '../../src/temp-dir'

interface BridgeMessage {
  type: string
  payload: any
}

interface RunResult {
  messages: BridgeMessage[]
  scope: Record<string, any>
  settle: () => Promise<void>
}

async function runBundle(source: string): Promise<RunResult> {
  const root = createTempDir('stx-native-issues-')
  const file = path.join(root, 'Screen.stx')
  await Bun.write(file, source)
  const { code } = await compileSharedScreenBundle(file, { minify: true })
  const messages: BridgeMessage[] = []
  let receive: (raw: string) => void = () => {}
  const scope: Record<string, any> = {
    console,
    setTimeout,
    clearTimeout,
    Promise,
    Date,
    Map,
    Set,
    WeakMap,
    WeakSet,
    __stxNativeBridge: {
      platform: 'ios',
      capabilityProtocolVersion: 1,
      capabilities: [],
      postMessage(raw: string) {
        messages.push(JSON.parse(raw))
      },
      onMessage(callback: (raw: string) => void) {
        receive = callback
      },
    },
  }
  vm.runInNewContext(code, scope)
  const settle = async () => {
    for (let i = 0; i < 6; i++)
      await new Promise(resolve => setTimeout(resolve, 0))
  }
  await settle()
  // Keep the bridge callback alive in the harness: the runtime expects the
  // native side to be able to answer, even though these tests only inspect
  // outbound render and mutation messages.
  void receive
  return { messages, scope, settle }
}

function operations(messages: BridgeMessage[]): any[] {
  return messages
    .filter(message => message.type === 'MUTATE')
    .flatMap(message => message.payload.operations)
}

function findNode(document: any, predicate: (node: any) => boolean): any | null {
  if (!document || typeof document !== 'object') return null
  if (predicate(document)) return document
  for (const child of document.children ?? []) {
    const found = findNode(child, predicate)
    if (found) return found
  }
  return null
}

describe('native issue regressions', () => {
  it('applies :if visibility to standalone nodes and rows in the production bundle', async () => {
    const { messages } = await runBundle(`<script>
const rows = state([{ id: 1, show: true }, { id: 2, show: false }])
const flag = state(false)
</script>
<View>
  <Text :if="flag()" testID="outside-if">if-false</Text>
  <Text :show="flag()" testID="outside-show">show-false</Text>
  <Text :show="!flag()" testID="outside-show-true">show-true</Text>
  <View :for="row in rows()" :key="row.id">
    <Text :if="row.show" testID="inside-if">inside-if</Text>
    <Text :show="row.show" testID="inside-show">inside-show</Text>
  </View>
</View>`)

    const render = messages.find(message => message.type === 'RENDER')
    const outsideIf = findNode(render?.payload.document, node => node.props?.testID === 'outside-if')
    expect(outsideIf).not.toBeNull()

    const rowIfIds = new Set(
      operations(messages)
        .filter(operation => operation.op === 'createNode' && operation.node?.props?.testID === 'inside-if')
        .map(operation => operation.id),
    )
    expect(rowIfIds.size).toBe(2)

    const hiddenIfIds = new Set(
      operations(messages)
        .filter(operation => operation.op === 'updateNode' && operation.patch?.style?.display === 'none')
        .map(operation => operation.id),
    )
    expect(hiddenIfIds).toContain(outsideIf.id)
    expect([...rowIfIds].some(id => hiddenIfIds.has(id))).toBe(true)
  })

  it('sends dynamic MapPolyline geometry on mount and when the route changes', async () => {
    const { messages, scope, settle } = await runBundle(`<script>
const route = state([47, 11, 47.1, 11.2])
globalThis.__replaceRoute = () => route.set([48, 12, 48.1, 12.2])
</script>
<Map fitToBounds="true">
  <MapPolyline id="route" :geometry="route()" strokeColor="#111111" />
</Map>`)

    const initial = operations(messages).find(operation => operation.op === 'updateNode' && operation.patch?.props?.geometry)
    expect(initial?.patch.props.geometry).toEqual([47, 11, 47.1, 11.2])

    scope.__replaceRoute()
    await settle()
    const updates = operations(messages).filter(operation => operation.op === 'updateNode' && operation.patch?.props?.geometry)
    expect(updates.at(-1)?.patch.props.geometry).toEqual([48, 12, 48.1, 12.2])
  })
})
