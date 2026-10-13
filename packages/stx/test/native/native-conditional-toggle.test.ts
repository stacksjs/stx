import { afterEach, describe, expect, it } from 'bun:test'
import path from 'node:path'
import vm from 'node:vm'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
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
    /** The views as nested `Type(text)[children]`, for asserting structure. */
    tree(): string {
      const walk = (id: string): string => {
        const node = nodes.get(id)
        if (!node) return ''
        const label = node.text.length ? `${node.type}(${node.text.join('')})` : node.type
        return node.children.length ? `${label}[${node.children.map(walk).join(' ')}]` : label
      }
      return root ? walk(root) : ''
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

/** The screen as the device runs it: the JavaScriptCore bundle, with no DOM. */
async function mountBundle(source: string) {
  const root = await mkdtemp(path.join(tmpdir(), 'stx-native-rows-'))
  const file = path.join(root, 'Screen.stx')
  await Bun.write(file, source)
  const { code } = await compileSharedScreenBundle(file)
  let receive: (raw: string) => void = () => {}
  const native = strictNativeSide(message => receive(JSON.stringify(message)))
  const scope: Record<string, unknown> = {
    console, setTimeout, clearTimeout, Promise, Date, Map, Set, WeakMap, WeakSet,
    __stxNativeBridge: {
      platform: 'ios',
      capabilityProtocolVersion: 1,
      capabilities: [],
      postMessage: (raw: string) => native.receive(JSON.parse(raw)),
      onMessage: (callback: (raw: string) => void) => { receive = callback },
    },
  }
  vm.runInNewContext(code, scope)
  const settle = async () => {
    for (let i = 0; i < 5; i++) await new Promise(resolve => setTimeout(resolve, 0))
  }
  await settle()
  return { native, settle, scope }
}

describe('native :if branches on a strict native side', () => {
  afterEach(() => {
    delete window.__stx_host
    delete (globalThis as any).__toggle
  })

  it('disposes nested keyed rows after the containing card disappears', async () => {
    const { native, settle } = await mountScreen(`<script client>
const data = state({ rows: [[{ key: 'score', value: '56' }], [{ key: 'hrv', value: '33' }]] })
globalThis.__toggle = () => data.set(data() ? null : { rows: [[{ key: 'score', value: '65' }]] })
</script>
<View>
  <View :if="data">
    <View :for="(row, index) in data.rows" :key="index">
      <Text :for="reading in row" :key="reading.key" :text="reading.value" />
    </View>
  </View>
</View>`)
    expect(native.text()).toEqual(['56', '33'])
    ;(globalThis as any).__toggle()
    await settle()
    expect(native.errors).toEqual([])
    expect(native.text()).toEqual([])
    ;(globalThis as any).__toggle()
    await settle()
    expect(native.errors).toEqual([])
    expect(native.text()).toEqual(['65'])
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

  it('hydrates an interactive node whose :if starts false', async () => {
    ;(globalThis as any).__pressed = 0
    const { screen, native, settle, press } = await mountScreen(`<script client>
const unread = state(0)
globalThis.__toggle = () => unread.set(1)
function markAllRead() { globalThis.__pressed++ }
</script>
<View>
  <Button :if="unread() > 0" testID="mark-all" @click="markAllRead()">Mark all</Button>
</View>`)
    expect(native.text()).toEqual([])

    ;(globalThis as any).__toggle()
    // The native side can report the tap in the same turn as the signal
    // mutation. The handler must be registered as part of revealing the node,
    // not only after a later hydration tick.
    screen.host.flush()
    press('Mark all')
    await settle()
    expect(native.text()).toEqual(['Mark all'])
    expect(native.handlerFor('Mark all')).toMatch(/^h/)
    expect((globalThis as any).__pressed).toBe(1)
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

  it('binds a conditional chip in a nested row inside a shown branch', async () => {
    // The branch's own deferred pass used to reach the rows first and bind the
    // chip's children without the row's item: every chip came out empty.
    const { native, settle, scope } = await mountBundle(`<script client>
const byDay = state({ mon: [{ id: 1, label: '95% of plan' }] })
const ready = state(true)
globalThis.__load = () => byDay.set({ mon: [{ id: 1, label: '95% of plan' }, { id: 2, label: 'Planned' }] })
function cards(day) { return byDay()[day] || [] }
function chip(card) { return card.label ? 'bg-emerald-50' : '' }
</script>
<View>
  <View :if="ready()">
    <View :for="day in ['mon']" :key="day">
      <View :for="card in cards(day)" :key="card.id">
        <View class="flex-row">
          <View :if="card.label" class="px-2" :class="chip(card)"><Text :text="card.label" /></View>
        </View>
      </View>
    </View>
  </View>
</View>`)
    expect(native.errors).toEqual([])
    expect(native.text()).toEqual(['95% of plan'])
    ;(scope as any).__load()
    await settle()
    expect(native.errors).toEqual([])
    expect(native.text()).toEqual(['95% of plan', 'Planned'])
  })

  it('renders the rows of a nested :if shown together with its parent branch', async () => {
    // Today's Recovery and Coming up: an :if inside the Fragment :if="data",
    // each holding a :for. Re-inserting the outer branch reconnected only its
    // root, so the inner :if waited for a reconnect that never came and drew
    // one empty row.
    const { native, settle, scope } = await mountBundle(`<script client>
const data = state(null)
globalThis.__load = () => data.set({ oura: null, days: [{ date: 'mon', label: 'Monday', cards: [{ id: 1, title: 'Easy Run' }] }] })
function recovery() { return [{ label: 'Sleep', value: '7.5h' }, { label: 'HRV', value: '41 ms' }] }
</script>
<View>
  <Fragment :if="data">
    <View :if="!data.oura" class="flex-row">
      <View :for="m in recovery()" :key="m.label"><Text :text="m.label" /><Text :text="m.value" /></View>
    </View>
    <View :if="data.days.length">
      <View :for="(day, index) in data.days" :key="day.date">
        <Text :text="day.label" />
        <View :for="card in day.cards" :key="card.id"><Text :text="card.title" /></View>
      </View>
    </View>
  </Fragment>
</View>`)
    expect(native.text()).toEqual([])
    ;(scope as any).__load()
    await settle()
    expect(native.errors).toEqual([])
    expect(native.text()).toEqual(['Sleep', '7.5h', 'HRV', '41 ms', 'Monday', 'Easy Run'])
  })

  it('keeps a row\'s last child inside its card past a self-closing nested :for', async () => {
    const { native, settle, scope } = await mountBundle(`<script client>
const byDay = state({})
globalThis.__load = () => byDay.set({ mon: [{ id: 1, bars: [1, 2] }], tue: [{ id: 2, bars: [] }] })
function cards(day) { return byDay()[day] || [] }
</script>
<View>
  <View :for="day in ['mon', 'tue']" :key="day">
    <Text :text="day" />
    <View :for="card in cards(day)" :key="card.id">
      <View class="flex-1 flex-row">
        <View class="flex-1">
          <View :if="card.bars.length" class="h-6"><View :for="(bar, bi) in card.bars" :key="bi" /></View>
        </View>
        <Text>chevron</Text>
      </View>
    </View>
  </View>
</View>`)
    expect(native.tree()).toBe('View[View[Text(mon)] View[Text(tue)]]')
    ;(scope as any).__load()
    await settle()
    expect(native.errors).toEqual([])
    expect(native.tree()).toBe('View[View[Text(mon) View[View[View[View[View View]] Text(chevron)]]] View[Text(tue) View[View[View Text(chevron)]]]]')
  })


})
