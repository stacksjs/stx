/**
 * The modules more than one route reaches are built once, into the runtime
 * the routes share (`__runtime.js`), and a route reads them from it: the
 * route files carry no copy, each module runs when a route that reaches it
 * starts, once per screen, and a module's state is one instance for the
 * screen and its components, as it is with a registry built for one route.
 */
import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { exportsMutableBinding } from '../../src/client-module-registry'
import { compileNativeBundle } from '../../src/native/compiler/bundle'
import { webApp } from './web-view-app'

const LIB = `let hits = 0
export function bump() { return ++hits }
export function read() { return hits }
export const SHARED_MARKER = 'shared-module-marker-text'
export function marker() { return SHARED_MARKER }
export async function later() { const loaded = await import('./lazy'); return loaded.lazyValue }
`

const files = {
  'functions/lib.ts': LIB,
  'functions/lazy.ts': 'export const lazyValue = \'lazy-chunk-value\'\n',
  'functions/alone.ts': 'export const aloneValue = \'only-alpha-reaches-this\'\n',
  'components/Reader.stx': `<script client>
  import { read } from '../functions/lib'
  globalThis.__readerRead = read
</script>
<div><p>Reader</p></div>
`,
  'views/alpha.stx': `<script client>
  import { bump, read, marker, later } from '../functions/lib'
  import { aloneValue } from '../functions/alone'
  globalThis.__alpha = [bump(), bump(), read(), marker(), aloneValue]
  later().then((value) => { globalThis.__lazy = value })
</script>
<div><Reader /><p>Alpha</p></div>
`,
  'views/beta.stx': `<script client>
  import { bump, read } from '../functions/lib'
  globalThis.__beta = [bump(), read()]
</script>
<div><p>Beta</p></div>
`,
}
const screens = { Alpha: 'views/alpha.stx', Beta: 'views/beta.stx' }

function run(result: { runtime?: string, routes?: Record<string, string> }, route: string) {
  const sent: Array<Record<string, any>> = []
  const scope: Record<string, any> = {
    __stxNativeRoute: route,
    __stxNativeParams: {},
    __stxNativeBridge: {
      platform: 'ios',
      mutationProtocolVersion: 1,
      capabilityProtocolVersion: 1,
      capabilityTimeoutMs: 1000,
      capabilities: [],
      onMessage: () => {},
      postMessage: (raw: string) => { sent.push(JSON.parse(raw)) },
    },
    setTimeout,
    clearTimeout,
  }
  const context = vm.createContext(scope)
  if (result.runtime) vm.runInContext(readFileSync(result.runtime, 'utf8'), context)
  vm.runInContext(readFileSync(result.routes![route]!, 'utf8'), context)
  return { scope, sent }
}

describe('modules the routes of one build share', () => {
  const root = webApp(files)
  const build = (options: Record<string, unknown> = {}, dir = 'routes') => compileNativeBundle({ root, screens, minify: true, routesDir: dir, sharedRuntime: true, ...options })

  it('holds a module two routes reach in the runtime, and a module one reaches in its route', async () => {
    const result = await build()
    const runtime = readFileSync(result.runtime!, 'utf8')
    const alpha = readFileSync(result.routes!.Alpha!, 'utf8')
    const beta = readFileSync(result.routes!.Beta!, 'utf8')
    expect(runtime).toContain('shared-module-marker-text')
    expect(runtime).toContain('lazy-chunk-value')
    expect(alpha).not.toContain('shared-module-marker-text')
    expect(beta).not.toContain('shared-module-marker-text')
    expect(alpha).toContain('only-alpha-reaches-this')
    expect(runtime).not.toContain('only-alpha-reaches-this')
  })

  it('runs a module once per screen, shared by the screen and its components', async () => {
    const result = await build()
    const alpha = run(result, 'Alpha')
    expect(alpha.scope.__alpha).toEqual([1, 2, 2, 'shared-module-marker-text', 'only-alpha-reaches-this'])
    // The component reads the screen's count: one `hits`.
    expect(alpha.scope.__readerRead()).toBe(2)
    // Another screen is another context: its own instance, from zero.
    expect(run(result, 'Beta').scope.__beta).toEqual([1, 1])
  })

  it('reads a module it imports when asked, as import() does', async () => {
    const result = await build()
    const { scope } = run(result, 'Alpha')
    await Bun.sleep(10)
    expect(scope.__lazy).toBe('lazy-chunk-value')
  })

  it('draws what the routes would draw built alone, with the same bytes each time', async () => {
    const shared = await build({}, 'shared')
    const again = await build({}, 'shared-again')
    const alone = await build({ shareModules: false }, 'alone')
    expect(readFileSync(shared.runtime!, 'utf8')).toBe(readFileSync(again.runtime!, 'utf8'))
    for (const name of Object.keys(screens)) {
      expect(readFileSync(shared.routes![name]!, 'utf8')).toBe(readFileSync(again.routes![name]!, 'utf8'))
      const withShared = run(shared, name)
      const withOwn = run(alone, name)
      expect(withShared.sent.find(message => message.type === 'RENDER')?.payload.document).toEqual(withOwn.sent.find(message => message.type === 'RENDER')?.payload.document)
    }
    // The route built alone carries its modules.
    expect(readFileSync(alone.routes!.Alpha!, 'utf8')).toContain('shared-module-marker-text')
    expect(readFileSync(shared.routes!.Alpha!, 'utf8').length).toBeLessThan(readFileSync(alone.routes!.Alpha!, 'utf8').length)
  })

  it('builds each route\'s modules into its own file when asked not to share', async () => {
    const previous = process.env.STX_NATIVE_SHARE_MODULES
    process.env.STX_NATIVE_SHARE_MODULES = '0'
    try {
      const result = await build({}, 'opted-out')
      expect(readFileSync(result.routes!.Alpha!, 'utf8')).toContain('shared-module-marker-text')
      expect(readFileSync(result.runtime!, 'utf8')).not.toContain('shared-module-marker-text')
    }
    finally {
      if (previous === undefined) delete process.env.STX_NATIVE_SHARE_MODULES
      else process.env.STX_NATIVE_SHARE_MODULES = previous
    }
  })

  it('builds each route alone when a module exports a binding that changes after it is read', async () => {
    const mutable = webApp({
      'functions/counter.ts': 'export let count = 0\nexport function increment() { count++ }\nexport const COUNTER_MARKER = \'counter-module-marker\'\n',
      'views/one.stx': '<script client>import { count, increment, COUNTER_MARKER } from \'../functions/counter\'\nincrement()\nglobalThis.__one = [count, COUNTER_MARKER]</script><div><p>One</p></div>',
      'views/two.stx': '<script client>import { COUNTER_MARKER } from \'../functions/counter\'\nglobalThis.__two = COUNTER_MARKER</script><div><p>Two</p></div>',
    })
    const warnings: string[] = []
    const warn = console.warn
    console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
    let result: Awaited<ReturnType<typeof compileNativeBundle>>
    try {
      result = await compileNativeBundle({ root: mutable, screens: { One: 'views/one.stx', Two: 'views/two.stx' }, minify: true, routesDir: 'routes', sharedRuntime: true })
    }
    finally {
      console.warn = warn
    }
    expect(warnings.join('\n')).toContain('could not share the native routes\' modules')
    expect(readFileSync(result.routes!.One!, 'utf8')).toContain('counter-module-marker')
    expect(readFileSync(result.routes!.Two!, 'utf8')).toContain('counter-module-marker')
    expect(run(result, 'Two').scope.__two).toBe('counter-module-marker')
  })

  it('shares a module whose text has a line that begins with a word the build reads as a statement', async () => {
    // A message catalog built into the routes (an app with no `messages`) has keys like `export:`.
    const catalog = webApp({
      'functions/words.ts': 'export const words = {\n  export: \'Export all records\',\n  import: \'Import\',\n}\nexport const WORDS_MARKER = \'words-module-marker\'\n',
      'views/one.stx': '<script client>import { words, WORDS_MARKER } from \'../functions/words\'\nglobalThis.__one = [words.export, WORDS_MARKER]</script><div><p>One</p></div>',
      'views/two.stx': '<script client>import { words, WORDS_MARKER } from \'../functions/words\'\nglobalThis.__two = [words.import, WORDS_MARKER]</script><div><p>Two</p></div>',
    })
    const warnings: string[] = []
    const warn = console.warn
    console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
    let result: Awaited<ReturnType<typeof compileNativeBundle>>
    try {
      result = await compileNativeBundle({ root: catalog, screens: { One: 'views/one.stx', Two: 'views/two.stx' }, minify: true, routesDir: 'routes', sharedRuntime: true })
    }
    finally {
      console.warn = warn
    }
    expect(warnings.join('\n')).not.toContain('could not share')
    expect(readFileSync(result.runtime!, 'utf8')).toContain('Export all records')
    expect(readFileSync(result.routes!.One!, 'utf8')).not.toContain('Export all records')
    expect(run(result, 'One').scope.__one).toEqual(['Export all records', 'words-module-marker'])
  })

  it('lists, for a host that reads a route\'s messages ahead of it, the areas of the modules it runs', async () => {
    const app = webApp({
      'lang/en/greet.ts': 'export default { hello: \'Hello there\' }\n',
      'lang/de/greet.ts': 'export default { hello: \'Hallo zusammen\' }\n',
      'functions/say.ts': 'import greet from \'../lang/en/greet\'\nexport function say() { return greet.hello }\nexport const SAY_MARKER = \'say-module-marker\'\n',
      'views/one.stx': '<script client>import { say } from \'../functions/say\'\nglobalThis.__one = say()</script><div><p>One</p></div>',
      'views/two.stx': '<script client>import { SAY_MARKER } from \'../functions/say\'\nglobalThis.__two = SAY_MARKER</script><div><p>Two</p></div>',
    })
    const result = await compileNativeBundle({ root: app, screens: { One: 'views/one.stx', Two: 'views/two.stx' }, minify: true, routesDir: 'routes', sharedRuntime: true, messages: { dir: 'lang', languages: ['en', 'de'] } })
    // The module is in the runtime, not in either route, and both routes run it.
    expect(readFileSync(result.runtime!, 'utf8')).toContain('say-module-marker')
    expect(readFileSync(result.routes!.One!, 'utf8')).not.toContain('say-module-marker')
    expect(JSON.parse(readFileSync(path.join(app, 'routes', '__messages', 'routes.json'), 'utf8'))).toEqual({ One: ['greet'], Two: ['greet'] })
    expect(readFileSync(result.runtime!, 'utf8')).not.toContain('Hello there')
  })
})

describe('component code the routes of one build have in common', () => {
  const app = webApp({
    'components/Badge.stx': `<script client>
  globalThis.__badges = (globalThis.__badges || 0) + 1
  const badgeMarker = 'badge-component-marker'
</script>
<div><p>Badge</p></div>
`,
    'components/Lonely.stx': `<script client>
  globalThis.__lonely = 'lonely-component-marker'
</script>
<div><p>Lonely</p></div>
`,
    'views/gamma.stx': '<div><Badge /><Badge /><Lonely /></div>',
    'views/delta.stx': '<div><Badge /></div>',
  })
  const screens = { Gamma: 'views/gamma.stx', Delta: 'views/delta.stx' }
  const build = (options: Record<string, unknown> = {}, dir = 'routes') => compileNativeBundle({ root: app, screens, minify: true, routesDir: dir, sharedRuntime: true, ...options })

  it('holds a component two screens draw in the runtime, and one only a screen draws in the screen', async () => {
    const result = await build()
    const runtime = readFileSync(result.runtime!, 'utf8')
    for (const name of ['Gamma', 'Delta'])
      expect(readFileSync(result.routes![name]!, 'utf8')).not.toContain('badge-component-marker')
    expect(runtime).toContain('badge-component-marker')
    expect(readFileSync(result.routes!.Gamma!, 'utf8')).toContain('lonely-component-marker')
    expect(runtime).not.toContain('lonely-component-marker')
  })

  it('sets the components up as it does with their code in the route', async () => {
    const shared = await build({}, 'shared')
    const alone = await build({ shareModules: false }, 'alone')
    for (const [name, badges] of [['Gamma', 2], ['Delta', 1]] as const) {
      const withShared = run(shared, name)
      const withOwn = run(alone, name)
      expect(withShared.scope.__badges).toBe(badges)
      expect(withOwn.scope.__badges).toBe(badges)
      expect(withShared.sent.find(message => message.type === 'RENDER')?.payload.document).toEqual(withOwn.sent.find(message => message.type === 'RENDER')?.payload.document)
    }
    expect(run(shared, 'Gamma').scope.__lonely).toBe('lonely-component-marker')
  })
})

describe('a source that exports a binding that changes', () => {
  it('is found by its export', () => {
    expect(exportsMutableBinding('export let count = 0\nexport function add() { count++ }')).toBe(true)
    expect(exportsMutableBinding('export var cache = null')).toBe(true)
    expect(exportsMutableBinding('let current = null\nexport function set(next) { current = next }\nexport { current }')).toBe(true)
  })

  it('is not mistaken for a binding that is only set once, or a local that shares its name', () => {
    expect(exportsMutableBinding('export const limit = 3\nexport function read() { return limit }')).toBe(false)
    expect(exportsMutableBinding('const table = {}\nexport { table }')).toBe(false)
    expect(exportsMutableBinding('var device = {}\nfunction info() { const device = read(); return device }\nexport { device }')).toBe(false)
    expect(exportsMutableBinding('let cache = new Map()\nexport function size() { return cache.size }\nexport { cache }')).toBe(false)
  })
})
