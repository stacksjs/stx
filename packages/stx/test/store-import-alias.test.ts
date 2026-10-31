/**
 * A store may import a name under another name (`today as deviceDay`) and
 * declare its own `today`.
 *
 * Stores are browser code concatenated into one shared scope. A pass that only
 * strips imports drops the `as`, so the alias is unbound (ReferenceError:
 * deviceDay is not defined) and the store's own `today` collides with the
 * helper's (Identifier 'today' has already been declared). The real bundle pass
 * keeps the alias and renames the colliding local; this pins both.
 */
import { afterEach, beforeEach, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { clearStoreCache, getStoreScript } from '../src/store-loader'
import { createTempDir } from '../src/temp-dir'

let dir = ''
let cwd = ''

beforeEach(() => {
  cwd = process.cwd()
  dir = createTempDir('stx-store-alias-')
  fs.mkdirSync(path.join(dir, 'stores'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'functions'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'functions', 'client.ts'), `export const api = { get: () => 'api' }\nexport function today(): string { return '2026-01-01' }\n`)
  fs.writeFileSync(path.join(dir, 'stores', 'tasks.ts'), `import { defineStore, state } from '@stacksjs/stx'
import { api, today as deviceDay } from '../functions/client'

defineStore('tasks', () => {
  const today = state(deviceDay())
  return { today, api }
})
`)
  process.chdir(dir)
  clearStoreCache()
})

afterEach(() => {
  process.chdir(cwd)
  clearStoreCache()
})

it('keeps the alias and the store\'s own colliding name apart', async () => {
  const script = await getStoreScript(path.join(dir, 'stores'))
  expect(script).not.toBeNull()

  const defined: Record<string, () => Record<string, unknown>> = {}
  const win = { stx: { state: (value: unknown) => ({ value }), defineStore: (id: string, setup: () => Record<string, unknown>) => { defined[id] = setup } }, __STX_STORES__: {} }
  // A SyntaxError here is the "already been declared" half; a ReferenceError
  // when the store runs is the alias half.
  // eslint-disable-next-line no-new-func
  expect(() => new Function('window', script!)(win)).not.toThrow()

  const store = defined.tasks!()
  expect((store.today as { value: unknown }).value).toBe('2026-01-01')
  expect((store.api as { get: () => string }).get()).toBe('api')
})
