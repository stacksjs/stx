/**
 * The hybrid contract's language features, run the way the host runs them:
 * each screen is compiled to a bundle with Bun.build and evaluated against a
 * fake bridge that records what the host would receive.
 *
 * 1. Handlers with arguments, FlatList rows reading `item`/`index`.
 * 2. Reactive `:if`/`:else`/`:for` (and `@if`/`@foreach`), dynamic `:class`
 *    and `:style`, re-evaluated on every render.
 * 3. Screen scripts are TypeScript with imports; `console` reaches the host.
 * 4. State read synchronously at the top level is in the first render.
 * 5. `<Icon>` and the Iconify to SF Symbol table; navigation options.
 */
import { describe, expect, it } from 'bun:test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { compileLegacyScreenBundle, compileNativeBundle } from '../../src/native/compiler/bundle'
import { compileClassStyles, compileHeadwindToStyle } from '../../src/native/compiler/headwind-to-style'
import { LUCIDE_TO_SF, resolveIconName } from '../../src/native/compiler/icons'
import { parseSTX } from '../../src/native/compiler/parser'

type Message = Record<string, any>
type Node = { id: string, type: string, props: Record<string, any>, style: Record<string, any>, events: Record<string, string>, children: Array<Node | string> }

async function compile(source: string, files: Record<string, string> = {}): Promise<{ code: string, warnings: string[] }> {
  const root = await mkdtemp(path.join(tmpdir(), 'stx-native-reactive-'))
  for (const [name, contents] of Object.entries(files))
    await Bun.write(path.join(root, name), contents)
  const file = path.join(root, 'Screen.stx')
  await Bun.write(file, source)
  return compileLegacyScreenBundle(file)
}

/** A host: applies RENDER and MUTATE to its own copy of the tree, like Craft. */
function host(code: string, globals: Record<string, any> = {}, bridge: Record<string, any> = {}) {
  const sent: Message[] = []
  let receive: (message: Message) => void = () => {}
  let tree: Node | null = null
  const nodes = new Map<string, Node>()
  function index(node: Node): void {
    nodes.set(node.id, node)
    node.children.forEach(child => typeof child !== 'string' && index(child))
  }
  const scope: Record<string, any> = {
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    ...globals,
    __stxNativeBridge: {
      platform: 'ios',
      mutationProtocolVersion: 1,
      capabilities: ['storage'],
      ...bridge,
      postMessage: (raw: string) => {
        const message = JSON.parse(raw)
        sent.push(message)
        if (message.type === 'RENDER') {
          tree = message.payload.document
          nodes.clear()
          index(tree!)
        }
        if (message.type === 'MUTATE') {
          for (const op of message.payload.operations) {
            if (op.op === 'createNode') nodes.set(op.id, { id: op.id, ...op.node, children: [...op.node.children] })
            if (op.op === 'removeNode') {
              for (const node of nodes.values()) node.children = node.children.filter(child => typeof child === 'string' || child.id !== op.id)
              nodes.delete(op.id)
            }
            if (op.op === 'updateNode') {
              const node = nodes.get(op.id)!
              const strings = op.patch.children
              Object.assign(node, { ...op.patch, children: strings ? [...strings, ...node.children.filter(child => typeof child !== 'string')] : node.children })
            }
            if (op.op === 'insertChild' || op.op === 'moveChild') {
              const parent = nodes.get(op.parentId)!
              const child = nodes.get(op.childId)!
              const elements = parent.children.filter(entry => typeof entry !== 'string' && entry.id !== op.childId) as Node[]
              elements.splice(op.index, 0, child)
              parent.children = [...parent.children.filter(entry => typeof entry === 'string'), ...elements]
            }
          }
        }
      },
      onMessage: (callback: typeof receive) => { receive = callback },
    },
  }
  // A realm of its own, as a JSContext is: bare \`console\` and \`craft\` are
  // this scope's, not the test runner's.
  vm.runInNewContext(code, scope)
  const find = (predicate: (node: Node) => boolean): Node | undefined => [...nodes.values()].find(predicate)
  const textOf = (node: Node): string => node.children.map(child => (typeof child === 'string' ? child : textOf(child))).join('')
  return {
    scope,
    sent,
    receive: (message: Message) => receive(message),
    tree: () => nodes.get('root')!,
    find,
    text: () => textOf(nodes.get('root')!),
    byTestID: (id: string) => find(node => node.props.testID === id),
    press: (node: Node | undefined, event = 'onPress', nativeEvent: Message = {}) => {
      if (!node) throw new Error('no node to press')
      receive({ type: 'EVENT', payload: { handlerName: node.events[event], nativeEvent } })
    },
  }
}

const tick = () => new Promise(resolve => setTimeout(resolve, 5))

describe('handlers with arguments', () => {
  it('passes FlatList rows their own item and index', async () => {
    const { code } = await compile(`<script>
let opened = ''
let rows = [{ id: 'a', name: 'Ada' }, { id: 'b', name: 'Bob' }]
function open(id, position) { opened = id + '@' + position }
</script>
<template>
  <View>
    <Text testID="opened">{opened}</Text>
    <FlatList data={rows} keyExtractor={item.id}>
      <View listRole="item" onPress={open(item.id, index)}><Text>{item.name}</Text></View>
    </FlatList>
  </View>
</template>`)
    const app = host(code)
    const bob = app.find(node => node.props.key === 'b')!
    expect(bob.events.onPress).toBe(`${bob.id}#onPress`)
    app.press(bob)
    expect(app.text()).toStartWith('b@1')
    app.press(app.find(node => node.props.key === 'a'))
    expect(app.text()).toStartWith('a@0')
  })

  it('reads :for variables, $event, arrows, statements and handler factories', async () => {
    const { code } = await compile(`<script lang="ts">
let log: string[] = []
const days = ['mon', 'tue']
let count = 0
function select(day: string) { log.push('select:' + day) }
function opener(day: string) { return (event: { x: number }) => log.push('open:' + day + ':' + event.x) }
</script>
<template>
  <View>
    <Text testID="log">{log.join(',')}</Text>
    <Text testID="count">{count}</Text>
    <View :for="day in days" :key="day">
      <Button testID="select" @click="select(day)">Select</Button>
      <Button testID="arrow" onPress={() => select(day + '!')}>Arrow</Button>
      <Button testID="factory" onPress={opener(day)}>Factory</Button>
      <Button testID="event" @press="log.push(day + ':' + $event.x)">Event</Button>
    </View>
    <Button testID="statements" @click="count++; count += 10">Count</Button>
  </View>
</template>`)
    const app = host(code)
    const tue = (testID: string) => app.find(node => node.props.testID === testID && node.id.includes('key:tue'))
    app.press(tue('select'))
    app.press(tue('arrow'))
    app.press(tue('factory'), 'onPress', { x: 3 })
    app.press(tue('event'), 'onPress', { x: 7 })
    expect(app.byTestID('log')!.children.join('')).toBe('select:tue,select:tue!,open:tue:3,tue:7')
    app.press(app.byTestID('statements'))
    expect(app.byTestID('count')!.children.join('')).toBe('11')
  })

  it('keeps handler ids stable across renders, so the host sees no event churn', async () => {
    const { code } = await compile(`<script>
let n = 0
function bump() { n++ }
</script>
<template><View><Button testID="b" onPress={bump}>{n}</Button></View></template>`)
    const app = host(code)
    app.press(app.byTestID('b'))
    const update = app.sent.at(-1)!
    expect(update.type).toBe('MUTATE')
    expect(update.payload.operations).toEqual([{ op: 'updateNode', id: 'root/key:b', patch: { children: ['1'] } }])
  })

  it('renders as soon as an async handler starts and again when it settles', async () => {
    const { code } = await compile(`<script>
let busy = false
async function reload() {
  busy = true
  await new Promise(resolve => setTimeout(resolve, 1))
  busy = false
}
</script>
<template><View><ScrollView testID="s" onRefresh={reload} refreshing={busy}><Text>x</Text></ScrollView></View></template>`)
    const app = host(code)
    expect(app.byTestID('s')!.props.refreshing).toBe(false)
    expect(app.byTestID('s')!.events.onRefresh).toBe('root/key:s#onRefresh')
    app.press(app.byTestID('s'), 'onRefresh')
    expect(app.byTestID('s')!.props.refreshing).toBe(true)
    await tick()
    expect(app.byTestID('s')!.props.refreshing).toBe(false)
  })
})

describe('reactive templates', () => {
  it('switches :if / :else-if / :else on every render without renaming siblings', async () => {
    const { code } = await compile(`<script>
let state = 'loading'
function next() { state = state === 'loading' ? 'error' : state === 'error' ? 'ready' : 'loading' }
</script>
<template>
  <View>
    <Text testID="first">first</Text>
    <Text :if="state === 'loading'">Loading</Text>
    <Text :else-if="state === 'error'">Failed</Text>
    <Text :else>Ready</Text>
    <Button testID="next" onPress={next}>Next</Button>
  </View>
</template>`)
    const app = host(code)
    expect(app.text()).toBe('firstLoadingNext')
    app.press(app.byTestID('next'))
    expect(app.text()).toBe('firstFailedNext')
    const ops = app.sent.at(-1)!.payload.operations.map((op: Message) => `${op.op} ${op.id ?? op.childId}`)
    expect(ops).toEqual(['removeNode root/index:1', 'createNode root/index:2', 'insertChild root/index:2'])
    app.press(app.byTestID('next'))
    expect(app.text()).toBe('firstReadyNext')
  })

  it('expands @if / @elseif / @else / @endif and @foreach as reactive fragments', async () => {
    const { code } = await compile(`<script>
let items = ['a', 'b']
let mode = 1
function more() { items = [...items, 'c']; mode = 2 }
</script>
<template>
  <View>
    @if (mode === 1)
      <Text>one</Text>
    @elseif (mode === 2)
      <Text>two</Text>
    @else
      <Text>other</Text>
    @endif
    @foreach (items as position => item)
      <Text>{position}{item}</Text>
    @endforeach
    <Button testID="more" onPress={more}>+</Button>
  </View>
</template>`)
    const app = host(code)
    expect(app.text()).toBe('one0a1b+')
    app.press(app.byTestID('more'))
    expect(app.text()).toBe('two0a1b2c+')
  })

  it('keys :for rows, filters with :if on the same node, and accepts numbers and objects', async () => {
    const { code } = await compile(`<script>
let people = [{ id: 1, name: 'Ada', on: true }, { id: 2, name: 'Bob', on: false }, { id: 3, name: 'Cy', on: true }]
function reverse() { people = [...people].reverse() }
</script>
<template>
  <View>
    <Text :for="person in people" :if="person.on" :key="person.id">{person.name}</Text>
    <Text :for="n in 3">{n}</Text>
    <Text :for="(value, key) in { x: 'X' }">{value}</Text>
    <Button testID="reverse" onPress={reverse}>r</Button>
  </View>
</template>`)
    const app = host(code)
    expect(app.text()).toBe('AdaCy123Xr')
    app.press(app.byTestID('reverse'))
    expect(app.text()).toBe('CyAda123Xr')
    const ops = app.sent.at(-1)!.payload.operations
    expect(ops.every((op: Message) => op.op === 'moveChild')).toBe(true)
  })

  it('converts dynamic :class at runtime, as a string, an array or an object, with dark: variants', async () => {
    const { code } = await compile(`<script>
let form = 8
const tone = (value) => value > 5 ? 'text-emerald-400' : 'text-amber-400'
function tire() { form = -12 }
</script>
<template>
  <View>
    <Text testID="string" class="text-2xl" :class="tone(form)">{form}</Text>
    <View testID="object" class="p-2" :class="{ 'bg-blue-600': form > 0, 'bg-rose-500/20 rounded-[6px]': form < 0 }" />
    <View testID="array" :class="['px-4', form > 0 && 'mt-2']" />
    <Text testID="dark" class="text-slate-900 dark:text-white" :class="'dark:bg-slate-800'">x</Text>
    <Button testID="tire" onPress={tire}>t</Button>
  </View>
</template>`)
    const app = host(code)
    expect(app.byTestID('string')!.style).toEqual({ fontSize: 24, color: '#34d399' })
    expect(app.byTestID('object')!.style).toEqual({ padding: 8, backgroundColor: '#2563eb' })
    expect(app.byTestID('array')!.style).toEqual({ paddingHorizontal: 16, marginTop: 8 })
    expect(app.byTestID('dark')!.style).toEqual({ color: '#0f172a' })
    app.press(app.byTestID('tire'))
    expect(app.byTestID('string')!.style).toEqual({ fontSize: 24, color: '#fbbf24' })
    expect(app.byTestID('object')!.style).toEqual({ padding: 8, backgroundColor: '#f43f5e33', borderRadius: 6 })
    expect(app.byTestID('array')!.style).toEqual({ paddingHorizontal: 16 })

    const dark = host(code, {}, { colorScheme: 'dark' })
    expect(dark.byTestID('dark')!.style).toEqual({ color: '#ffffff', backgroundColor: '#1e293b' })
    dark.receive({ type: 'APPEARANCE', payload: { colorScheme: 'light' } })
    expect(dark.byTestID('dark')!.style).toEqual({ color: '#0f172a' })
  })

  it('merges dynamic :style objects and CSS text over the classes, and hides with :show', async () => {
    const { code } = await compile(`<script>
let width = 40
let visible = true
function shrink() { width = 10; visible = false }
</script>
<template>
  <View>
    <View testID="bar" class="h-2 bg-blue-500" :style="{ width: width + '%' }" />
    <View testID="css" :style="'left: ' + width + 'px; height: 12px'" />
    <View testID="literal" style={{ flexShrink: 1, flexBasis: 0 }} />
    <Text testID="shown" :show="visible">hi</Text>
    <Button testID="shrink" onPress={shrink}>s</Button>
  </View>
</template>`)
    const app = host(code)
    expect(app.byTestID('bar')!.style).toEqual({ height: 8, backgroundColor: '#3b82f6', width: '40%' })
    expect(app.byTestID('css')!.style).toEqual({ left: 40, height: 12 })
    expect(app.byTestID('literal')!.style).toEqual({ flexShrink: 1, flexBasis: 0 })
    app.press(app.byTestID('shrink'))
    expect(app.byTestID('bar')!.style.width).toBe('10%')
    expect(app.byTestID('shown')!.style).toEqual({ display: 'none' })
  })

  it('keeps a bad expression from blanking the screen', async () => {
    const { code } = await compile(`<script>
let data = null
</script>
<template><View><Text>{data.missing}</Text><Text>still here</Text></View></template>`)
    const errors: string[] = []
    const app = host(code, { console: { log() {}, warn() {}, error: (message: string) => errors.push(message) } })
    expect(app.text()).toBe('still here')
    expect(errors[0]).toContain('text failed')
  })
})

describe('TypeScript screen scripts', () => {
  it('bundles imports relative to the screen and strips types', async () => {
    const { code } = await compile(`<script lang="ts">
import { sportStyle, type Sport } from './functions/mobile'
interface Card { id: number, type: Sport }
const cards: Card[] = [{ id: 1, type: 'run' }]
</script>
<template><View><Text :for="card in cards" :class="sportStyle(card.type).tone">{sportStyle(card.type).label as string}</Text></View></template>`, {
      'functions/mobile.ts': `export type Sport = 'run' | 'bike'
export function sportStyle(type: Sport): { label: string, tone: string } {
  return { label: type === 'run' ? 'Run' : 'Ride', tone: 'text-emerald-600 bg-emerald-50' }
}`,
    })
    const app = host(code)
    expect(app.text()).toBe('Run')
    expect(app.tree().children[0]).toMatchObject({ style: { color: '#059669', backgroundColor: '#ecfdf5' } })
  })

  it('leaves the host console alone, and forwards to the host when there is none', async () => {
    const { code } = await compile(`<script>
console.log('hello', { n: 1 })
</script>
<template><View /></template>`)
    const logged: unknown[][] = []
    host(code, { console: { log: (...args: unknown[]) => logged.push(args), warn() {}, error() {} } })
    expect(logged).toEqual([['hello', { n: 1 }]])
    const bare = host(code, { console: undefined })
    expect(bare.sent.find(message => message.type === 'CONSOLE')?.payload).toEqual({ level: 'log', message: 'hello {"n":1}' })
  })
})

describe('the synchronous first frame', () => {
  const screen = `<script>
const saved = globalThis.craft.storage.getSync('hq.today')
const snapshot = globalThis.craft.snapshots.get('today')
const token = globalThis.craft.secureStorage.getSync('auth.token')
let view = saved ? JSON.parse(saved) : snapshot
</script>
<template>
  <View>
    <Text :if="!view">Loading</Text>
    <Text :else>{view.title}</Text>
    <Text>{token ? 'signed in' : 'signed out'}</Text>
  </View>
</template>`

  it('renders state read from the host\'s synchronous storage in the very first message', async () => {
    const { code } = await compile(screen)
    const app = host(code, {
      craft: {
        storage: { getSync: (key: string) => (key === 'hq.today' ? '{"title":"Threshold intervals"}' : null), setSync() {} },
        snapshots: { get: () => null },
        secureStorage: { getSync: () => 'token' },
      },
    })
    expect(app.sent[0].type).toBe('RENDER')
    expect(app.text()).toBe('Threshold intervalssigned in')
    // The runtime merged its async API in without replacing the host's readers.
    expect(typeof app.scope.craft.storage.get).toBe('function')
    expect(app.scope.craft.storage.getSync('hq.today')).toContain('Threshold')
  })

  it('reads a snapshot when storage is empty', async () => {
    const { code } = await compile(screen)
    const app = host(code, { craft: { snapshots: { get: (name: string) => (name === 'today' ? { title: 'From the web' } : null) } } })
    expect(app.text()).toBe('From the websigned out')
  })

  it('degrades to the empty state when the host has no synchronous readers', async () => {
    const { code } = await compile(screen)
    const app = host(code)
    expect(app.text()).toBe('Loadingsigned out')
    expect(await app.scope.craft.snapshots.set('today', {})).toBe(false)
  })
})

describe('icons', () => {
  it('maps every lucide icon HQ\'s Today and Calendar use to an SF Symbol', () => {
    for (const name of ['sun', 'calendar-days', 'trending-up', 'heart-pulse', 'store', 'play', 'chevron-right', 'chevron-left', 'check', 'clock', 'flame', 'moon', 'activity', 'dumbbell', 'bike', 'footprints', 'waves', 'zap', 'bell', 'user', 'settings', 'refresh-cw', 'heart', 'message-circle', 'person-standing', 'mountain', 'sailboat', 'bar-chart-3', 'flag'])
      expect(LUCIDE_TO_SF[name]).toBeString()
    expect(resolveIconName('i-lucide-sun')).toEqual({ symbol: 'sun.max', iconify: 'i-lucide-sun', known: true })
    expect(resolveIconName('lucide:footprints').symbol).toBe('figure.run')
    expect(resolveIconName('moon').symbol).toBe('moon')
    expect(resolveIconName('heart.fill')).toEqual({ symbol: 'heart.fill', known: true })
    expect(resolveIconName('i-mdi-home')).toEqual({ symbol: 'circle', iconify: 'i-mdi-home', known: false })
  })

  it('compiles <Icon> from a symbol, a name, a class or a size, and warns about unknown names', () => {
    const document = parseSTX(`<template><View>
  <Icon symbol="sun.max" class="text-blue-500 w-5 h-5" />
  <Icon name="chevron-right" size="18" class="text-slate-300 font-semibold" />
  <Icon class="i-lucide-heart-pulse size-4 text-rose-500" />
  <Icon name="definitely-not-an-icon" />
</View></template>`, 'Icons.stx')
    const [symbol, named, classed, unknown] = document.root.children as any[]
    expect(symbol).toMatchObject({ type: 'Icon', props: { symbol: 'sun.max' }, style: { color: '#3b82f6', width: 20, height: 20 } })
    expect(named).toMatchObject({ props: { symbol: 'chevron.right', iconify: 'i-lucide-chevron-right' }, style: { width: 18, height: 18, color: '#cbd5e1', fontWeight: '600' } })
    expect(classed).toMatchObject({ props: { symbol: 'heart.text.square' }, style: { width: 16, height: 16, color: '#f43f5e' } })
    expect(unknown.props.symbol).toBe('circle')
    expect(document.meta.warnings).toContain('Unknown icon definitely-not-an-icon in Icons.stx; drawn as circle')
  })

  it('resolves icons chosen at runtime, by :name or by an Iconify :class', async () => {
    const { code } = await compile(`<script>
let sport = 'run'
const ICON = { run: 'i-lucide-footprints', bike: 'i-lucide-bike' }
function ride() { sport = 'bike' }
</script>
<template><View>
  <Icon testID="named" :name="ICON[sport]" class="w-4 h-4" />
  <Icon testID="classed" :class="ICON[sport] + ' text-sky-600'" />
  <Button testID="ride" onPress={ride}>ride</Button>
</View></template>`)
    const app = host(code)
    expect(app.byTestID('named')!.props).toMatchObject({ symbol: 'figure.run', iconify: 'i-lucide-footprints' })
    expect(app.byTestID('classed')!.props.symbol).toBe('figure.run')
    expect(app.byTestID('classed')!.style).toEqual({ color: '#0284c7' })
    app.press(app.byTestID('ride'))
    expect(app.byTestID('named')!.props.symbol).toBe('figure.outdoor.cycle')
    expect(app.byTestID('classed')!.props.symbol).toBe('figure.outdoor.cycle')
  })
})

describe('navigation options', () => {
  it('sends setOptions without functions and routes navButton taps to the button and listeners', async () => {
    const { code } = await compile(`<script>
let taps = []
globalThis.craft.navigation.setOptions({
  title: 'Today',
  largeTitle: true,
  rightButtons: [{ id: 'me', symbol: 'person.crop.circle', onPress: () => taps.push('own') }],
})
globalThis.craft.navigation.onButton(event => taps.push('listener:' + event.id))
</script>
<template><View><Text>{taps.join(',')}</Text></View></template>`)
    const app = host(code)
    const options = app.sent.find(message => message.type === 'NAVIGATION_SET_OPTIONS')!
    expect(options.payload).toEqual({ title: 'Today', largeTitle: true, rightButtons: [{ id: 'me', symbol: 'person.crop.circle' }] })
    app.receive({ type: 'EVENT', payload: { handlerName: 'navButton', nativeEvent: { id: 'me' } } })
    expect(app.text()).toBe('own,listener:me')
  })
})

describe('navigation.open (Craft hybrid, contract C1)', () => {
  it('posts NAVIGATE_OPEN with the path, for the host to show native or web', async () => {
    const { code } = await compile(`<script>
const rows = [{ id: 42 }]
function open(id) { globalThis.craft.navigation.open('/m/workout/' + id) }
</script>
<template><View><View :for="row in rows" testID="row" onPress={open(row.id)} /></View></template>`)
    const app = host(code)
    app.press(app.byTestID('row'))
    const message = app.sent.find(sent => sent.type === 'NAVIGATE_OPEN')!
    expect(message.payload).toEqual({ path: '/m/workout/42' })
    expect(() => app.scope.craft.navigation.open('')).toThrow('navigation.open needs a path')
  })
})

describe('host-installed APIs', () => {
  it('uses the host\'s synchronous setOptions as the transport, still keeping button handlers', async () => {
    const { code } = await compile(`<script>
let taps = 0
globalThis.craft.navigation.setOptions({ title: 'Today', rightButtons: [{ id: 'me', title: 'Me', onPress: () => { taps++ } }] })
</script>
<template><View><Text>{taps}</Text></View></template>`)
    const received: unknown[] = []
    const app = host(code, { craft: { navigation: { setOptions: (options: unknown) => received.push(JSON.parse(JSON.stringify(options))) } } })
    expect(received).toEqual([{ title: 'Today', rightButtons: [{ id: 'me', title: 'Me' }] }])
    expect(app.sent.some(message => message.type === 'NAVIGATION_SET_OPTIONS')).toBe(false)
    app.receive({ type: 'EVENT', payload: { handlerName: 'navButton', nativeEvent: { id: 'me' } } })
    expect(app.text()).toBe('1')
  })
})

describe('Craft host contract (B1–B4)', () => {
  it('redraws after setTimeout and setInterval callbacks, with no handler involved', async () => {
    const { code } = await compile(`<script>
let label = 'waiting'
let ticks = 0
setTimeout(() => { label = 'fired' }, 1)
const id = setInterval(() => { if (++ticks === 2) clearInterval(id) }, 1)
</script>
<template><View><Text>{label} {ticks}</Text></View></template>`)
    const app = host(code)
    expect(app.text()).toBe('waiting 0')
    await new Promise(resolve => setTimeout(resolve, 40))
    expect(app.text()).toBe('fired 2')
  })

  it('keeps globalThis.craft and the host\'s accessor namespaces it hangs off', async () => {
    const { code } = await compile(`<script>
const stored = globalThis.craft.storage.getSync('k')
</script>
<template><View><Text>{stored}</Text></View></template>`)
    // Craft's shape: each namespace is an accessor whose setter re-adds the
    // host's members to whatever object is assigned.
    const craft: Record<string, any> = {}
    let storage: Record<string, any> = {}
    Object.defineProperty(craft, 'storage', {
      configurable: true,
      enumerable: true,
      get: () => storage,
      set: (value: Record<string, any>) => { storage = { getSync: (key: string) => `host:${key}`, ...value } },
    })
    craft.storage = {}
    const app = host(code, { craft })
    expect(app.scope.craft).toBe(craft)
    expect(app.text()).toBe('host:k')
    expect(typeof app.scope.craft.storage.get).toBe('function')
  })

  it('passes a ScrollView\'s sticky headers and scroll target through as values', async () => {
    const { code } = await compile(`<script>
let target = null
let taps = 0
function pick(day) { target = { id: 'day-' + day, key: ++taps } }
</script>
<template>
  <ScrollView testID="list" stickyHeaderIndices={[0]} scrollTarget={target}>
    <View testID="strip"><Text testID="tue" onPress={pick('tue')}>Tue</Text></View>
    <View testID="day-tue"><Text>Tuesday</Text></View>
  </ScrollView>
</template>`)
    const app = host(code)
    expect(app.byTestID('list')!.props.stickyHeaderIndices).toEqual([0])
    expect(app.byTestID('list')!.props.scrollTarget).toBeNull()
    app.press(app.byTestID('tue'))
    await tick()
    expect(app.byTestID('list')!.props.scrollTarget).toEqual({ id: 'day-tue', key: 1 })
    app.press(app.byTestID('tue'))
    await tick()
    expect(app.byTestID('list')!.props.scrollTarget).toEqual({ id: 'day-tue', key: 2 })
  })

  it('emits rounded-[Npx] and tracking-[…] as plain point numbers', () => {
    const style = compileHeadwindToStyle('text-[13px] rounded-[10px] tracking-[0.05em] tracking-[1px]')
    expect(style.borderRadius).toBe(10)
    expect(style.letterSpacing).toBe(1)
    expect(compileHeadwindToStyle('text-xs tracking-[0.1em]').letterSpacing).toBeCloseTo(1.2)
  })
})

describe('routed bundles', () => {
  it('ships the runtime once and runs only the routed screen', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'stx-native-routes-'))
    await Bun.write(path.join(root, 'A.stx'), `<script>globalThis.ran = (globalThis.ran || '') + 'A'</script><template><View><Text>A</Text></View></template>`)
    await Bun.write(path.join(root, 'B.stx'), `<script>globalThis.ran = (globalThis.ran || '') + 'B'</script><template><View><Text>B</Text></View></template>`)
    const { code } = await compileNativeBundle({ screens: { A: path.join(root, 'A.stx'), B: path.join(root, 'B.stx') }, initialScreen: 'A' })
    expect(code.match(/function createRuntime/g)?.length).toBe(1)
    const b = host(code, { __stxNativeRoute: 'B' })
    expect(b.scope.ran).toBe('B')
    expect(b.text()).toBe('B')
    expect(b.scope.craft.route.name).toBe('B')
    const a = host(code)
    expect(a.scope.ran).toBe('A')
  })
})

describe('class compilation (contract §9 / A5)', () => {
  it('makes flex-1 grow, shrink and start from zero', () => {
    expect(compileHeadwindToStyle('flex-1')).toEqual({ flex: 1, flexGrow: 1, flexShrink: 1, flexBasis: 0 })
  })

  it('reads arbitrary radii, tracking, leading, sizes and alpha colours', () => {
    expect(compileHeadwindToStyle('rounded-[10px] rounded-t-[2px]')).toEqual({ borderRadius: 10, borderTopLeftRadius: 2, borderTopRightRadius: 2 })
    expect(compileHeadwindToStyle('text-[11px] tracking-[0.1em] leading-[16px]')).toEqual({ fontSize: 11, letterSpacing: 1.1, lineHeight: 16 })
    expect(compileHeadwindToStyle('tracking-tight leading-5')).toEqual({ letterSpacing: -0.4, lineHeight: 20 })
    expect(compileHeadwindToStyle('size-11')).toEqual({ width: 44, height: 44 })
    expect(compileHeadwindToStyle('bg-emerald-500/10 border-[#ffffff]/50')).toEqual({ backgroundColor: '#10b9811a', borderColor: '#ffffff80' })
  })

  it('keeps dark: apart, drops other variants, and reports what it did not know', () => {
    const compiled = compileClassStyles('text-slate-900 dark:text-white hover:bg-red-500 sm:p-4 truncate i-lucide-sun wobble')
    expect(compiled.style).toEqual({ color: '#0f172a' })
    expect(compiled.dark).toEqual({ color: '#ffffff' })
    expect(compiled.numberOfLines).toBe(1)
    expect(compiled.icon).toBe('i-lucide-sun')
    expect(compiled.unknown).toEqual(['wobble'])
  })
})
