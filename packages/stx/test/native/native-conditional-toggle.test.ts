import { afterEach, describe, expect, it } from 'bun:test'
import path from 'node:path'
import { compileScreenSource } from '../../src/native/compiler/render-screen'
import { prepareSharedNativeScreen } from '../../src/native/runtime/shared-screen'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants } from '../../test-utils/dom-runtime-shim'

declare const window: any

interface ModelNode { id: string, type: string, text: string[], children: string[], parent: string | null, events: Record<string, string> }

/**
 * The native side as strict as Craft's CraftNativeMutation: a batch applies
 * whole or not at all, on the revision before it; anchors are never views, an
 * index is checked against the views a parent holds, removing a node drops
 * its subtree, and updating a node it does not hold is an error.
 */
function strictNativeSide(reply: (message: unknown) => void) {
  let nodes = new Map<string, ModelNode>()
  let root: string | null = null
  let revision = 0
  let refuseNext = false
  const errors: any[] = []

  function importNode(value: any, parent: string | null, into: Map<string, ModelNode>): string {
    const id = String(value.id)
    const children = Array.isArray(value.children) ? value.children : []
    into.set(id, { id, type: value.type, text: children.filter((c: unknown) => typeof c === 'string'), children: [], parent, events: { ...value.events } })
    into.get(id)!.children = children.filter((c: unknown) => c && typeof c === 'object').map((c: any) => importNode(c, id, into))
    return id
  }
  function subtree(id: string, from: Map<string, ModelNode>): string[] {
    const node = from.get(id)
    return node ? [id, ...node.children.flatMap(child => subtree(child, from))] : []
  }
  function fail(batchId: string, code: string, message: string) {
    errors.push({ batchId, code, message })
    reply({ type: 'MUTATION_ERROR', payload: { batchId, code, message, version: 1 } })
  }

  return {
    errors,
    refuseNextBatch() { refuseNext = true },
    receive(message: any) {
      if (message.type === 'RENDER') {
        const next = new Map<string, ModelNode>()
        root = importNode(message.payload.document, null, next)
        nodes = next
        revision = 0
        return
      }
      if (message.type !== 'MUTATE')
        return
      const { batchId, baseRevision, operations } = message.payload
      if (refuseNext) {
        refuseNext = false
        return fail(batchId, 'INVALID_BATCH', 'refused for the test')
      }
      if (baseRevision !== revision)
        return fail(batchId, 'REVISION_MISMATCH', `baseRevision must equal the current revision ${revision}`)
      const next = new Map([...nodes].map(([id, node]) => [id, { ...node, children: [...node.children], text: [...node.text], events: { ...node.events } }]))
      for (const op of operations) {
        if (op.op === 'createNode') {
          next.set(op.id, { id: op.id, type: op.node.type, text: (op.node.children ?? []).filter((c: unknown) => typeof c === 'string'), children: [], parent: null, events: { ...op.node.events } })
        }
        else if (op.op === 'insertChild' || op.op === 'moveChild') {
          const parent = next.get(op.parentId)
          const child = next.get(op.childId)
          if (!parent || !child)
            return fail(batchId, 'UNKNOWN_NODE', `node ${parent ? op.childId : op.parentId} does not exist`)
          if (op.op === 'moveChild')
            parent.children = parent.children.filter(id => id !== op.childId)
          if (op.index < 0 || op.index > parent.children.length)
            return fail(batchId, 'INVALID_INDEX', `index must be between 0 and ${parent.children.length}`)
          parent.children.splice(op.index, 0, op.childId)
          child.parent = op.parentId
        }
        else if (op.op === 'removeNode') {
          const node = next.get(op.id)
          if (!node)
            return fail(batchId, 'UNKNOWN_NODE', `node ${op.id} does not exist`)
          if (node.parent)
            next.get(node.parent)!.children = next.get(node.parent)!.children.filter(id => id !== op.id)
          for (const gone of subtree(op.id, next)) next.delete(gone)
        }
        else if (op.op === 'updateNode') {
          const node = next.get(op.id)
          if (!node)
            return fail(batchId, 'UNKNOWN_NODE', `node ${op.id} does not exist`)
          if (op.patch.children)
            node.text = op.patch.children.filter((c: unknown) => typeof c === 'string')
          if (op.patch.events)
            Object.assign(node.events, op.patch.events)
        }
      }
      nodes = next
      revision = message.payload.revision
    },
    /** The text on screen, in order. */
    text(): string[] {
      const walk = (id: string): string[] => {
        const node = nodes.get(id)
        return node ? [...node.text, ...node.children.flatMap(walk)] : []
      }
      return root ? walk(root) : []
    },
    handlerFor(label: string): string | undefined {
      for (const node of nodes.values()) {
        if (node.events.onPress && node.children.some(child => nodes.get(child)?.text.includes(label)))
          return node.events.onPress
        if (node.events.onPress && node.text.includes(label))
          return node.events.onPress
      }
      return undefined
    },
  }
}

async function mountScreen(source: string) {
  const compiled = await compileScreenSource(source, path.join(import.meta.dir, 'ConditionalToggle.stx'))
  let receive: (raw: string) => void = () => {}
  const native = strictNativeSide(message => receive(JSON.stringify(message)))
  const screen = prepareSharedNativeScreen(compiled.document, compiled.manifest, {
    platform: 'ios',
    capabilityProtocolVersion: 1,
    capabilities: [],
    postMessage: (raw: string) => native.receive(JSON.parse(raw)),
    onMessage: (callback: (raw: string) => void) => { receive = callback },
  } as any)
  installNodeConstants()
  window.__stx_host = screen.host
  new Function(generateSignalsRuntimeDev())()
  new Function(compiled.setup!.code)()
  screen.mount(window.stx, window.__stx_latestSetup)
  const settle = async () => {
    for (let i = 0; i < 5; i++) {
      screen.host.flush()
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }
  await settle()
  return { screen, native, settle, press: (label: string) => receive(JSON.stringify({ type: 'EVENT', payload: { handlerId: native.handlerFor(label), nativeEvent: {} } })) }
}

describe('native :if branches on a strict native side', () => {
  afterEach(() => {
    delete window.__stx_host
    delete (globalThis as any).__toggle
  })

  it('shows the other branch, nested in another :if, and shows the first again', async () => {
    const { native, settle } = await mountScreen(`<script client>
const data = state(null)
const waiting = state(true)
globalThis.__toggle = () => waiting.set(!waiting())
</script>
<View>
  <Text>Today</Text>
  <View :if="!data">
    <EmptyState :if="waiting" variant="bare" title="Loading your day" description="One moment." />
    <EmptyState :if="!waiting" variant="bare" title="Not available" description="Try again." />
  </View>
</View>`)
    expect(native.text()).toEqual(['Today', 'Loading your day', 'One moment.'])

    ;(globalThis as any).__toggle()
    await settle()
    expect(native.errors).toEqual([])
    expect(native.text()).toEqual(['Today', 'Not available', 'Try again.'])

    ;(globalThis as any).__toggle()
    await settle()
    expect(native.errors).toEqual([])
    expect(native.text()).toEqual(['Today', 'Loading your day', 'One moment.'])
  })

  it('keeps a re-shown branch\'s text current and its buttons pressable', async () => {
    const { native, settle, press } = await mountScreen(`<script client>
const shown = state(true)
const count = state(0)
globalThis.__toggle = () => shown.set(!shown())
function bump() { count.set(count() + 1) }
</script>
<View>
  <View :if="shown">
    <Text :text="'Count ' + count" />
    <Button @click="bump()">Add</Button>
  </View>
</View>`)
    expect(native.text()).toEqual(['Count 0', 'Add'])
    press('Add')
    await settle()
    expect(native.text()).toEqual(['Count 1', 'Add'])
    ;(globalThis as any).__toggle()
    await settle()
    expect(native.text()).toEqual([])
    ;(globalThis as any).__toggle()
    await settle()
    expect(native.text()).toEqual(['Count 1', 'Add'])
    // A press within 50ms of a branch appearing is the tap that opened it.
    await new Promise(resolve => setTimeout(resolve, 60))
    press('Add')
    await settle()
    expect(native.errors).toEqual([])
    expect(native.text()).toEqual(['Count 2', 'Add'])
  })

  it('presses a branch that was hidden before its first press', async () => {
    const { native, settle, press } = await mountScreen(`<script client>
const shown = state(true)
const count = state(0)
globalThis.__toggle = () => shown.set(!shown())
function bump() { count.set(count() + 1) }
</script>
<View>
  <View :if="shown">
    <Text :text="'Count ' + count" />
    <Button @click="bump()">Add</Button>
  </View>
</View>`)
    expect(native.text()).toEqual(['Count 0', 'Add'])
    ;(globalThis as any).__toggle()
    await settle()
    expect(native.text()).toEqual([])
    ;(globalThis as any).__toggle()
    await settle()
    expect(native.text()).toEqual(['Count 0', 'Add'])
    await new Promise(resolve => setTimeout(resolve, 60))
    press('Add')
    await settle()
    expect(native.errors).toEqual([])
    expect(native.text()).toEqual(['Count 1', 'Add'])
  })

  it('redraws a screen whose batch the native side refused, and keeps updating it', async () => {
    const { native, settle } = await mountScreen(`<script client>
const count = state(0)
globalThis.__toggle = () => count.set(count() + 1)
</script>
<View><Text :text="'Count ' + count" /></View>`)
    expect(native.text()).toEqual(['Count 0'])
    native.refuseNextBatch()
    ;(globalThis as any).__toggle()
    await settle()
    expect(native.errors.map(error => error.code)).toEqual(['INVALID_BATCH'])
    expect(native.text()).toEqual(['Count 1'])
    ;(globalThis as any).__toggle()
    await settle()
    expect(native.errors.map(error => error.code)).toEqual(['INVALID_BATCH'])
    expect(native.text()).toEqual(['Count 2'])
  })
})
