/**
 * In production the stores share the page's module registry (#1957) and ship
 * minified.
 *
 * Each store used to be bundled with its imports inlined, so thirty stores
 * importing the same i18n and request helpers carried thirty copies of them:
 * hq.training sent a 2.9 MB store bundle, readable and commented, to every
 * page. Development keeps inlining, for store HMR (/_stx/stores.js).
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { buildModuleRegistryScript, registeredModuleIdsIn } from '../src/client-module-registry'
import { clearStoreCache, getStoreScript } from '../src/store-loader'
import { createTempDir } from '../src/temp-dir'

// eslint-disable-next-line ts/no-explicit-any
const g = globalThis as any
const win = g.window
let dir = ''
let cwd = ''
const environment = process.env.NODE_ENV

const SHARED = `let count = 0
// Only the source carries this comment.
export function bump(): number { return ++count }
export const MARKER = 'shared-helper-module-body'
`
const store = (name: string): string => `import { bump } from '../functions/shared'
// The store's own comment.
export const use${name} = defineStore('${name.toLowerCase()}', () => ({ seen: bump() }))
`

beforeEach(() => {
  cwd = process.cwd()
  dir = createTempDir('stx-store-modules-')
  fs.mkdirSync(path.join(dir, 'stores'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'functions'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'functions', 'shared.ts'), SHARED)
  fs.writeFileSync(path.join(dir, 'stores', 'alpha.ts'), store('Alpha'))
  fs.writeFileSync(path.join(dir, 'stores', 'beta.ts'), store('Beta'))
  // Module ids are relative to the working directory, as on a server.
  process.chdir(dir)
  clearStoreCache()
})

afterEach(() => {
  process.chdir(cwd)
  process.env.NODE_ENV = environment
  clearStoreCache()
  delete g.__stxModules
  delete g.__stxModuleBundles
  delete win.__stores
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('stores in production', () => {
  it('reach their imports through the page registry, once, and ship minified', async () => {
    process.env.NODE_ENV = 'production'
    const stores = (await getStoreScript(path.join(dir, 'stores')))!
    expect(stores).not.toContain('shared-helper-module-body')
    expect(stores).not.toContain('++count')
    expect(stores).not.toContain('The store\'s own comment')
    expect(stores).not.toContain('// Store:')

    const registry = (await buildModuleRegistryScript(registeredModuleIdsIn(stores), { minify: true }))!
    expect(registry.match(/shared-helper-module-body/g)).toHaveLength(1)
    expect(registry).not.toContain('Only the source carries this comment')

    // Run them as the page does: registry first, then the stores.
    const previous = win.stx
    win.__stores = {}
    win.stx = { ...previous, defineStore: (name: string, setup: () => unknown) => { win.__stores[name] = setup(); return () => win.__stores[name] } }
    try {
      // eslint-disable-next-line no-eval
      ;(0, eval)(registry)
      // eslint-disable-next-line no-eval
      ;(0, eval)(stores)
    }
    finally {
      win.stx = previous
    }
    // One module instance between the two stores.
    expect([win.__stores.alpha.seen, win.__stores.beta.seen].sort()).toEqual([1, 2])
  })

  it('development still inlines them, for store HMR', async () => {
    process.env.NODE_ENV = 'development'
    const stores = (await getStoreScript(path.join(dir, 'stores')))!
    // A copy of the helper in each store (the unused MARKER tree-shaken).
    expect(stores.match(/\+\+count/g)).toHaveLength(2)
    expect(stores).toContain('// Store: alpha')
  })
})
