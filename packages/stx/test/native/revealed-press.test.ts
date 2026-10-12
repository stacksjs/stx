/**
 * A press on a control an `:if` has just shown is the person's, not the
 * click that showed it: native events name the node they happened at, so the
 * runtime's guard against an opener's click reaching what it opened lets a
 * real press through at once (native-host.ts `eventAt`).
 */
import { describe, expect, it } from 'bun:test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'

async function pressedAt(template: string): Promise<boolean> {
  const root = await mkdtemp(path.join(tmpdir(), 'stx-repro-'))
  const file = path.join(root, 'Repro.stx')
  await Bun.write(file, `<script client>
const items = state([])
function mark() { globalThis.__hits = (globalThis.__hits || 0) + 1 }
onMount(() => { setTimeout(() => items.set([1, 2]), 0) })
</script>${template}`)
  const code = (await compileSharedScreenBundle(file)).code
  const nodes = new Map<string, any>()
  let receive: (raw: string) => void = () => {}
  const visit = (node: any): void => {
    nodes.set(node.id, node)
    for (const child of node.children || []) if (typeof child !== 'string') visit(child)
  }
  const scope: any = {
    setTimeout, clearTimeout, console,
    __stxNativeBridge: {
      platform: 'ios', capabilities: [],
      onMessage: (callback: typeof receive) => {
        receive = callback
      },
      postMessage: (raw: string) => {
        const message = JSON.parse(raw)
        if (message.payload?.document) visit(message.payload.document)
        for (const op of message.payload?.operations || []) {
          if (op.node) visit({ ...op.node, id: op.id })
          const node = nodes.get(op.id)
          if (node && op.patch) {
            node.events = { ...node.events, ...op.patch.events }
            node.props = { ...node.props, ...op.patch.props }
          }
        }
      },
    },
  }
  vm.runInNewContext(code, scope)
  // Pressed at once: inside the 50ms an opener's click is kept from what it opened.
  await Bun.sleep(20)
  const after = [...nodes.values()].find(n => n.props?.testID === 'after')
  receive(JSON.stringify({ type: 'EVENT', payload: { handlerId: after.events.onPress, nativeEvent: {} } }))
  await Bun.sleep(10)
  return scope.__hits === 1
}

describe('a press on what an :if has just shown', () => {
  it('reaches a row after a loop inside it', async () => {
    expect(await pressedAt(`<View><View :if="items().length"><View :for="item in items()" :key="item"><Text :text="String(item)" /></View><View testID="after" @click="mark()" /></View></View>`)).toBe(true)
  })

  it('reaches a row alone inside it', async () => {
    expect(await pressedAt(`<View><View :if="items().length"><View testID="after" @click="mark()" /></View></View>`)).toBe(true)
  })

  it('reaches a row after a loop that was always there', async () => {
    expect(await pressedAt(`<View><View :for="item in items()" :key="item"><Text :text="String(item)" /></View><View testID="after" @click="mark()" /></View>`)).toBe(true)
})
})
