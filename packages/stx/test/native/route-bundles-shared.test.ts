/**
 * What the route files of one build share, and what they leave out:
 *
 * - a screen carries the stores it reads (and those they read), not every
 *   store the app defines;
 * - a registered module is built with the names its readers take, not
 *   everything it exports, while staying one instance for the whole screen;
 * - the style vocabulary, the route names and the stylesheets every screen
 *   shares are held by the runtime prelude once, and a route's document
 *   comes out the same as it does from a one-file bundle.
 */
import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { compileNativeBundle } from '../../src/native/compiler/bundle'
import { getStoreScriptFor, storesRead } from '../../src/store-loader'
import { mountWebView, webApp } from './web-view-app'
import { mountNativeScreen } from '../../src/native/testing'

const store = (id: string, body = '', extra = ''): string => `import { defineStore, state } from '@stacksjs/stx'
${extra}
export const ${id}Store = defineStore('${id}', () => {
  const value = state('${id}-value')
  ${body}
  return { value }
})
`

describe('the stores a screen carries', () => {
  it('reads the names a piece of code asks the registry for', () => {
    expect(storesRead(`useStore('auth'); useStore("cart")`)).toEqual({ names: new Set(['auth', 'cart']), all: false })
    expect(storesRead('useStore<Cart>(`cart`)').names).toEqual(new Set(['cart']))
    // A name that is not a literal may be any store.
    expect(storesRead('useStore(name)').all).toBe(true)
    expect(storesRead(`useStore('a'); useStore(which)`).all).toBe(true)
    expect(storesRead('window.__STX_STORES__.cart').all).toBe(true)
    expect(storesRead('const none = 1').names.size).toBe(0)
  })

  it('keeps the stores a screen reads and the ones those read, and no others', async () => {
    const root = webApp({
      'stores/orders.ts': store('orders', 'const cart = useStore(\'cart\')'),
      'stores/cart.ts': store('cart', 'localStorage.setItem(\'cart-ran\', \'yes\')'),
      'stores/unrelated.ts': store('unrelated', 'localStorage.setItem(\'unrelated-ran\', \'yes\')'),
      'views/shop.stx': `<script client>
  const orders = useStore('orders')
  const value = orders.value
</script>
<div><p :text="value">…</p></div>
`,
    })
    const built = await getStoreScriptFor(path.join(root, 'stores'), ["useStore('orders')"], { sharedModules: true })
    expect(built?.stores.sort()).toEqual(['cart', 'orders'])
    expect(built?.code).toContain('orders-value')
    expect(built?.code).not.toContain('unrelated')

    const { code } = await compileNativeBundle({ root, screens: { Shop: 'views/shop.stx' } })
    expect(code).toContain('orders-value')
    expect(code).toContain('cart-ran')
    expect(code).not.toContain('unrelated-ran')
    const phone = await mountWebView(root, { Shop: 'views/shop.stx' }, 'Shop')
    expect(phone.texts()).toContain('orders-value')
  })

  it('holds a store more than one route defines in the runtime, and runs each in order', async () => {
    const root = webApp({
      'stores/shared.ts': store('shared', 'localStorage.setItem(\'order\', (localStorage.getItem(\'order\') || \'\') + \'shared-ran,\')'),
      'stores/later.ts': store('later', 'const shared = useStore(\'shared\'); localStorage.setItem(\'order\', localStorage.getItem(\'order\') + \'later-ran,\' + shared.value())'),
      'stores/own.ts': store('own', 'localStorage.setItem(\'own-store-marker\', \'yes\')'),
      'views/one.stx': `<script client>
  const later = useStore('later')
  const own = useStore('own')
  const value = later.value
</script>
<div><p :text="value">…</p></div>
`,
      'views/two.stx': `<script client>
  const later = useStore('later')
  const value = later.value
</script>
<div><p :text="value">…</p></div>
`,
    })
    const built = await getStoreScriptFor(path.join(root, 'stores'), ["useStore('later')"], { sharedModules: true })
    expect(built?.functions?.length).toBe(2)
    const routed = await compileNativeBundle({ root, screens: { One: 'views/one.stx', Two: 'views/two.stx' }, minify: true, routesDir: 'routes', sharedRuntime: true })
    const runtime = readFileSync(routed.runtime!, 'utf8')
    const one = readFileSync(routed.routes!.One!, 'utf8')
    const two = readFileSync(routed.routes!.Two!, 'utf8')
    // Both routes define these two: the runtime holds them once.
    expect(runtime).toContain('later-ran')
    expect(runtime).toContain('shared-ran')
    expect(one).not.toContain('later-ran')
    expect(two).not.toContain('shared-ran')
    // Only one route defines this one: it stays there.
    expect(one).toContain('own-store-marker')
    expect(runtime).not.toContain('own-store-marker')
    // Each route, run after the runtime, defines its stores in order.
    for (const [name, route] of [['One', one], ['Two', two]] as const) {
      const phone = mountNativeScreen(`${runtime}\n${route}`, name)
      await phone.settle()
      expect(phone.texts()).toContain('later-value')
      expect(phone.context.localStorage.getItem('order')).toBe('shared-ran,later-ran,shared-value')
      phone.unmount()
    }
  })

  it('keeps stores in one script when one reads a name another binds', async () => {
    const root = webApp({
      'stores/first.ts': `import { defineStore } from '@stacksjs/stx'\nvar sharedHelper = () => 'helper'\nexport const firstStore = defineStore('first', () => ({ value: 1 }))\n`,
      'stores/second.ts': `import { defineStore, useStore } from '@stacksjs/stx'\nexport const secondStore = defineStore('second', () => { useStore('first'); return { value: sharedHelper() } })\n`,
    })
    const built = await getStoreScriptFor(path.join(root, 'stores'), ["useStore('second')"], { sharedModules: true })
    expect(built?.stores.sort()).toEqual(['first', 'second'])
    expect(built?.functions).toBeNull()
  })

  it('keeps every store for code that may read any of them', async () => {
    const root = webApp({
      'stores/a.ts': store('a'),
      'stores/b.ts': store('b', 'localStorage.setItem(\'b-ran\', \'yes\')'),
      'views/pick.stx': `<script client>
  const which = 'a'
  const picked = useStore(which)
  const value = picked.value
</script>
<div><p :text="value">…</p></div>
`,
    })
    const { code } = await compileNativeBundle({ root, screens: { Pick: 'views/pick.stx' } })
    expect(code).toContain('b-ran')
    const phone = await mountWebView(root, { Pick: 'views/pick.stx' }, 'Pick')
    expect(phone.texts()).toContain('a-value')
  })
})

describe('the modules a screen registers', () => {
  const LIB = `let hits = 0
export function bump() { return ++hits }
export function read() { return hits }
export const unusedTable = { marker: 'unused-export-table-marker' }
export function unusedHelper() { return unusedTable.marker }
`

  it('leaves out what its readers never take from a module', async () => {
    const root = webApp({
      'functions/lib.ts': LIB,
      'views/count.stx': `<script client>
  import { bump } from '../functions/lib'
  const count = state(0)
  function press() { count.set(bump()) }
</script>
<div><p :text="String(count())">…</p><button testid="press" @click="press()">Press</button></div>
`,
    })
    const { code } = await compileNativeBundle({ root, screens: { Count: 'views/count.stx' } })
    expect(code).not.toContain('unused-export-table-marker')
    const phone = await mountWebView(root, { Count: 'views/count.stx' }, 'Count')
    phone.press(phone.byTestID('press')!)
    await phone.settle()
    expect(phone.texts()).toContain('1')
  })

  it('stays one instance for the screen and its components, whatever each takes from it', async () => {
    const root = webApp({
      'functions/lib.ts': LIB,
      'components/Reader.stx': `<script client>
  import { read } from '../functions/lib'
  const seen = state(0)
  function look() { seen.set(read()) }
</script>
<div><p :text="'Reader saw ' + seen()">…</p><button testid="look" @click="look()">Look</button></div>
`,
      'views/shared.stx': `<script client>
  import { bump } from '../functions/lib'
  function press() { bump() }
</script>
<div><Reader /><button testid="press" @click="press()">Press</button></div>
`,
    })
    const phone = await mountWebView(root, { Shared: 'views/shared.stx' }, 'Shared')
    phone.press(phone.byTestID('press')!)
    phone.press(phone.byTestID('press')!)
    phone.press(phone.byTestID('look')!)
    await phone.settle()
    expect(phone.texts()).toContain('Reader saw 2')
  })

  it('serves a module whole to code that takes the module itself', async () => {
    const root = webApp({
      'functions/lib.ts': LIB,
      'views/whole.stx': `<script client>
  import * as lib from '../functions/lib'
  const names = Object.keys(lib).sort().join(',')
</script>
<div><p :text="names">…</p></div>
`,
    })
    const phone = await mountWebView(root, { Whole: 'views/whole.stx' }, 'Whole')
    expect(phone.texts()).toContain('bump,read,unusedHelper,unusedTable')
  })
})

describe('what route files of one build share', () => {
  const STYLE = (cls: string, rule: string) => `<style>${cls} { ${rule} }</style>`
  const files = {
    'views/alpha.stx': `<script client>const label = state('alpha')</script>${STYLE('.common', 'padding: 8px')}${STYLE('.alpha-only', 'margin: 4px')}<div class="common alpha-only"><p :text="label()">…</p></div>`,
    'views/beta.stx': `<script client>const label = state('beta')</script>${STYLE('.common', 'padding: 8px')}${STYLE('.beta-only', 'margin: 6px')}<div class="common beta-only"><p :text="label()">…</p></div>`,
  }
  const screens = { Alpha: 'views/alpha.stx', Beta: 'views/beta.stx' }

  function renderedDocument(code: string, route: string, runtime?: string): Record<string, any> {
    const sent: Array<Record<string, any>> = []
    const context = vm.createContext({
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
    })
    if (runtime) vm.runInContext(readFileSync(runtime, 'utf8'), context)
    vm.runInContext(code, context)
    return sent.find(message => message.type === 'RENDER')!.payload.document
  }

  it('draws the same document from a route file as from the one-file bundle', async () => {
    const root = webApp(files)
    const single = await compileNativeBundle({ root, screens, minify: true })
    const routed = await compileNativeBundle({ root, screens, minify: true, routesDir: 'routes', sharedRuntime: true })
    for (const name of Object.keys(screens)) {
      const expected = renderedDocument(single.code, name)
      const actual = renderedDocument(readFileSync(routed.routes![name]!, 'utf8'), name, routed.runtime)
      expect(actual).toEqual(expected)
    }
    // The stylesheets are there at all, or the comparison proves nothing.
    expect(JSON.stringify(renderedDocument(single.code, 'Alpha'))).toContain('alpha-only')
  })

  it('holds the style vocabulary, the route names and the stylesheets in the runtime, not in each route', async () => {
    const root = webApp(files)
    const routed = await compileNativeBundle({
      root,
      screens,
      minify: true,
      routesDir: 'routes',
      sharedRuntime: true,
      shareStorage: { token: 'auth.token' },
      styleConfig: { shortcuts: { 'shared-shortcut-marker': 'p-4' } },
    })
    const runtime = readFileSync(routed.runtime!, 'utf8')
    const alpha = readFileSync(routed.routes!.Alpha!, 'utf8')
    expect(runtime).toContain('shared-shortcut-marker')
    expect(runtime).toContain('auth.token')
    expect(runtime).toContain('alpha-only')
    expect(runtime).toContain('beta-only')
    expect(alpha).not.toContain('shared-shortcut-marker')
    expect(alpha).not.toContain('auth.token')
    // A rule every screen gives alike is held once; its own stays with it.
    expect(runtime.match(/\.common|common/g)?.length).toBeGreaterThan(0)
    expect(alpha).not.toContain('beta-only')
  })

  it('keeps the one-file bundle and a route without the shared runtime self-contained', async () => {
    const root = webApp(files)
    const own = await compileNativeBundle({ root, screens, minify: true, routesDir: 'self-contained', styleConfig: { shortcuts: { 'own-shortcut-marker': 'p-4' } } })
    expect(own.runtime).toBeUndefined()
    expect(readFileSync(own.routes!.Alpha!, 'utf8')).toContain('own-shortcut-marker')
    expect(renderedDocument(readFileSync(own.routes!.Alpha!, 'utf8'), 'Alpha')).toBeTruthy()
  })
})
