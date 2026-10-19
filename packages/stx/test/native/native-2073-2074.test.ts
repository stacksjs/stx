import { describe, expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

async function runBundle(source: string) {
  const { code } = await compileNativeScreen(source, { minify: true })
  const phone = mountNativeScreen(code, 'main', { globals: { setTimeout, clearTimeout } })
  const settle = async () => {
    for (let i = 0; i < 6; i++)
      await new Promise(resolve => setTimeout(resolve, 0))
  }
  await settle()
  return { messages: phone.messages, scope: phone.context, settle, operations: phone.operations }
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
    const { messages, operations } = await runBundle(`<script>
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
      operations()
        .filter(operation => operation.op === 'createNode' && operation.node?.props?.testID === 'inside-if')
        .map(operation => operation.id),
    )
    expect(rowIfIds.size).toBe(2)

    const hiddenIfIds = new Set(
      operations()
        .filter(operation => operation.op === 'updateNode' && operation.patch?.style?.display === 'none')
        .map(operation => operation.id),
    )
    expect(hiddenIfIds).toContain(outsideIf.id)
    expect([...rowIfIds].some(id => hiddenIfIds.has(id))).toBe(true)
  })

  it('sends dynamic MapPolyline geometry on mount and when the route changes', async () => {
    const { scope, settle, operations } = await runBundle(`<script>
const route = state([47, 11, 47.1, 11.2])
globalThis.__replaceRoute = () => route.set([48, 12, 48.1, 12.2])
</script>
<Map fitToBounds="true">
  <MapPolyline id="route" :geometry="route()" strokeColor="#111111" />
</Map>`)

    const initial = operations().find(operation => operation.op === 'updateNode' && operation.patch?.props?.geometry)
    expect(initial?.patch.props.geometry).toEqual([47, 11, 47.1, 11.2])

    scope.__replaceRoute()
    await settle()
    const updates = operations().filter(operation => operation.op === 'updateNode' && operation.patch?.props?.geometry)
    expect(updates.at(-1)?.patch.props.geometry).toEqual([48, 12, 48.1, 12.2])
  })
})
