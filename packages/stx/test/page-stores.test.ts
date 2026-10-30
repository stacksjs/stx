/**
 * A page ships the stores it reads, not every store.
 *
 * Every store used to ship on every page: hq.training's thirty stores were a
 * 210 KB bundle on its marketing home, which reads one, and their imports
 * (and the composables those reach) made the page's module registry and
 * composables bundle several hundred KB more. A page now ships the stores its
 * own code, the modules it imports and its composables read by name, with
 * those they read in turn, each run once per document however many pages'
 * scripts carry it. The router loads the next page's stores before it swaps
 * the page in (they are module bundles, router/test/client-page-bundles).
 *
 * Every store still ships when the analysis cannot tell: a store read by a
 * name that is not a literal, `useStore` taken as a value, stores that share
 * a top-level name, or `STX_PAGE_STORES=all`.
 */
import type { StxOptions } from '../src/types'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { extractContainerContent } from '../src/app-shell'
import { clearComposableCache } from '../src/composable-loader'
import { defaultConfig } from '../src/config'
import { processDirectives } from '../src/process'
import { clearStoreCache, getStoreScriptFor, storesRead, storesReadInFiles } from '../src/store-loader'
import { createTempDir } from '../src/temp-dir'

const APP = createTempDir('stx-page-stores-')
const storesDir = path.join(APP, 'stores')
const functionsDir = path.join(APP, 'functions')
const cwd = process.cwd()

const store = (id: string, body = '') => [
  `import { defineStore, state } from 'stx'`,
  `export const use${id.replace(/\W/g, '')} = defineStore('${id}', () => {`,
  `  ${body}`,
  `  const value = state('${id.toUpperCase()}_BODY_SENTINEL')`,
  `  return { value }`,
  `})`,
].join('\n')

beforeAll(() => {
  fs.mkdirSync(storesDir, { recursive: true })
  fs.mkdirSync(functionsDir, { recursive: true })
  fs.writeFileSync(path.join(storesDir, 'auth.ts'), store('auth'))
  // A store-local `data`, the name another store binds at its top level: not a read of it.
  fs.writeFileSync(path.join(storesDir, 'cart.ts'), store('cart', `async function load() { const data = await fetch('/cart'); return data }`))
  fs.writeFileSync(path.join(storesDir, 'orders.ts'), [
    `import { defineStore, state, useStore } from 'stx'`,
    `const data = { kept: 1 }`,
    `export const useOrders = defineStore('orders', () => {`,
    `  const value = state('ORDERS_BODY_SENTINEL')`,
    `  function cart() { return useStore('cart') }`,
    `  return { value, cart, data }`,
    `})`,
  ].join('\n'))
  fs.writeFileSync(path.join(storesDir, 'reports.ts'), store('reports'))
  // A helper module, imported by a page, that reads a store itself.
  fs.writeFileSync(path.join(functionsDir, 'session.ts'), `export function signedIn(): boolean { return !!useStore('auth').value() }\n`)
  process.chdir(APP)
})

afterAll(() => {
  process.chdir(cwd)
  fs.rmSync(APP, { recursive: true, force: true })
})

afterEach(() => {
  delete process.env.STX_PAGE_STORES
  clearStoreCache()
  clearComposableCache()
})

function page(script: string): string {
  return [
    '<html><head><meta charset="utf-8"><title>t</title></head><body>',
    '<main><p>page</p></main>',
    `<script client>${script}</script>`,
    '</body></html>',
  ].join('\n')
}

async function render(script: string, options: Partial<StxOptions> = {}): Promise<string> {
  return processDirectives(page(script), {}, path.join(APP, 'page.stx'), { ...defaultConfig, storesDir, composablesDir: functionsDir, ...options } as StxOptions, new Set())
}

const storeScript = (html: string): string => /<script\b[^>]*\bdata-stx-stores\b[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? ''

describe('storesRead', () => {
  it('reads the stores called by a literal name', () => {
    const read = storesRead(`useStore('a'); stx.useStore<Cart>("b"); useStore?.('c')`)
    expect([...read.names].sort()).toEqual(['a', 'b', 'c'])
    expect(read.all).toBe(false)
  })

  it('binding useStore from the runtime is not a use', () => {
    for (const code of [
      `const { state, useStore, useTimeout } = window.stx; useStore('a')`,
      `var useStore = __stx["useStore"];\nuseStore('a')`,
      `[['useStore', typeof useStore, 'stx']].forEach(f); useStore('a')`,
      `// call useStore once the page has loaded\nuseStore('a')`,
      `/** The useStore helper, read off the runtime. */ useStore('a')`,
      `import { defineStore, useStore } from 'stx'\nuseStore('a')`,
    ]) {
      expect(storesRead(code)).toEqual({ names: new Set(['a']), all: false })
    }
  })

  it('cannot read through an alias, a computed name or useStore handed on', () => {
    for (const code of [
      `useStore(name)`,
      `import { useStore as get } from 'stx'\nget('a')`,
      `const { useStore: get } = window.stx\nget('a')`,
      `const get = useStore\nget('a')`,
      `window.stx['useStore']('a')`,
      `register(useStore)`,
      `const api = { useStore }`,
      `Object.keys(window.__STX_STORES__)`,
    ]) {
      expect(storesRead(code).all).toBe(true)
    }
  })

  it('reads source files once per version, and a file it cannot read means any store', () => {
    const file = path.join(APP, 'reader.ts')
    fs.writeFileSync(file, `useStore('cart')`)
    expect([...storesReadInFiles([file]).names]).toEqual(['cart'])
    fs.writeFileSync(file, `useStore('orders') // and more`)
    expect([...storesReadInFiles([file]).names]).toEqual(['orders'])
    expect(storesReadInFiles([path.join(APP, 'missing.ts')]).all).toBe(true)
  })
})

describe('getStoreScriptFor, run once', () => {
  it('keeps the stores read and those they read, each run once per document', async () => {
    const stores = (await getStoreScriptFor(storesDir, [`useStore('orders')`], { runOnce: true }))!
    expect(stores.stores.sort()).toEqual(['cart', 'orders'])
    expect(stores.functions).not.toBeNull()

    const g = globalThis as any
    const previous = { stx: g.window.stx, ran: g.window.__stxStoreFiles }
    const defined: string[] = []
    g.window.stx = { defineStore: (id: string, setup: () => unknown) => { defined.push(id); return setup() }, state: (v: unknown) => () => v, useStore: () => ({}) }
    delete g.window.__stxStoreFiles
    try {
      // eslint-disable-next-line no-eval
      ;(0, eval)(stores.code)
      // A second page's scripts carrying the same stores.
      // eslint-disable-next-line no-eval
      ;(0, eval)(stores.code)
    }
    finally {
      g.window.stx = previous.stx
      g.window.__stxStoreFiles = previous.ran
    }
    expect(defined.sort()).toEqual(['cart', 'orders'])
  })

  it('one store that throws does not take the others with it', async () => {
    fs.writeFileSync(path.join(storesDir, 'broken.ts'), `export const useBroken = defineStore('broken', () => { throw new Error('nope') })\n`)
    clearStoreCache()
    try {
      const stores = (await getStoreScriptFor(storesDir, [`useStore('broken'); useStore('auth')`], { runOnce: true }))!
      const g = globalThis as any
      const previous = { stx: g.window.stx, ran: g.window.__stxStoreFiles, error: console.error }
      const defined: string[] = []
      g.window.stx = { defineStore: (id: string, setup: () => unknown) => { const result = setup(); defined.push(id); return result }, state: (v: unknown) => () => v }
      delete g.window.__stxStoreFiles
      console.error = () => {}
      try {
        // eslint-disable-next-line no-eval
        ;(0, eval)(stores.code)
      }
      finally {
        g.window.stx = previous.stx
        g.window.__stxStoreFiles = previous.ran
        console.error = previous.error
      }
      expect(defined).toEqual(['auth'])
    }
    finally {
      fs.rmSync(path.join(storesDir, 'broken.ts'))
      clearStoreCache()
    }
  })

  it('keeps every store, in their shared scope, when one reads a name another binds', async () => {
    fs.writeFileSync(path.join(storesDir, 'shared.ts'), `export const useShared = defineStore('shared', () => ({ kept: data.kept }))\n`)
    clearStoreCache()
    try {
      const stores = (await getStoreScriptFor(storesDir, [`useStore('auth')`], { runOnce: true }))!
      expect(stores.functions).toBeNull()
      expect(stores.stores.sort()).toEqual(['auth', 'cart', 'orders', 'reports', 'shared'])
    }
    finally {
      fs.rmSync(path.join(storesDir, 'shared.ts'))
      clearStoreCache()
    }
  })

  it('keeps every store for code that may read any, or when told to', async () => {
    expect((await getStoreScriptFor(storesDir, [`useStore(id)`], { runOnce: true }))!.stores).toHaveLength(4)
    expect((await getStoreScriptFor(storesDir, [`useStore('auth')`], { runOnce: true, all: true }))!.stores).toHaveLength(4)
    expect((await getStoreScriptFor(storesDir, [`useStore('auth')`], { runOnce: true, reads: { names: [], all: true } }))!.stores).toHaveLength(4)
  })
})

describe('a page\'s stores', () => {
  it('ships none to a page that reads none', async () => {
    const html = await render(`const open = state(false)`)
    expect(html).not.toContain('data-stx-stores')
    expect(html).not.toContain('_BODY_SENTINEL')
  })

  it('ships the stores the page reads, and those they read', async () => {
    const html = await render(`const open = state(false)\nconst orders = useStore('orders')`)
    const stores = storeScript(html)
    expect(stores).toContain('ORDERS_BODY_SENTINEL')
    expect(stores).toContain('CART_BODY_SENTINEL')
    expect(stores).not.toContain('AUTH_BODY_SENTINEL')
    expect(stores).not.toContain('REPORTS_BODY_SENTINEL')
    // Carried by a fragment and run beside the stores already defined.
    expect(html).toMatch(/<script data-stx-scoped data-stx-run="always" data-stx-stores>/)
  })

  it('ships a store read by a module the page imports', async () => {
    const html = await render(`import { signedIn } from './functions/session'\nconst open = state(signedIn())`)
    expect(storeScript(html)).toContain('AUTH_BODY_SENTINEL')
    expect(storeScript(html)).not.toContain('ORDERS_BODY_SENTINEL')
  })

  it('ships every store, as before, to a page that may read any', async () => {
    const html = await render(`const open = state(false)\nconst picked = useStore(open() ? 'auth' : 'cart')`)
    for (const id of ['AUTH', 'CART', 'ORDERS', 'REPORTS'])
      expect(storeScript(html)).toContain(`${id}_BODY_SENTINEL`)
  })

  it('ships every store, in the shared script, with STX_PAGE_STORES=all', async () => {
    process.env.STX_PAGE_STORES = 'all'
    const html = await render(`const open = state(false)`)
    expect(html).toMatch(/<script data-stx-stores>/)
    for (const id of ['AUTH', 'CART', 'ORDERS', 'REPORTS'])
      expect(storeScript(html)).toContain(`${id}_BODY_SENTINEL`)
  })

  it('links a page\'s stores in serve mode, and its fragment carries them to the router', async () => {
    fs.writeFileSync(path.join(storesDir, 'big.ts'), store('big', `const notes = ${JSON.stringify('x'.repeat(6000))}`))
    clearStoreCache()
    try {
      const html = await render(`const open = state(false)\nconst big = useStore('big')`, { buildMode: 'serve' } as Partial<StxOptions>)
      const tag = /<script data-stx-scoped data-stx-run="always" data-stx-stores src="(\/_stx\/modules\.[0-9a-f]{16}\.js)"><\/script>/.exec(html)
      expect(tag).not.toBeNull()
      const { getServeModuleBundle } = await import('../src/caching')
      expect(getServeModuleBundle(tag![1]!.match(/([0-9a-f]{16})\.js$/)![1]!)).toContain('BIG_BODY_SENTINEL')
      expect(extractContainerContent(html, 'main')).toContain(tag![0])
    }
    finally {
      fs.rmSync(path.join(storesDir, 'big.ts'))
      clearStoreCache()
    }
  })
})
