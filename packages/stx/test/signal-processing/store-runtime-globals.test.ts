/**
 * Store files get the runtime-globals preamble (stacksjs/stx#1838).
 *
 * `store-loader.ts` and `composable-loader.ts` load user code the same way, but
 * only the composable loader wired the runtime globals in. signals.js puts about
 * a dozen names directly on `window` — `state`, `effect`, `defineStore` — while
 * the other ~34 live only on `window.stx`. A `<script client>` block gets a
 * generated `var { useCookie, … } = window.stx` preamble, so a bare
 * `useCookie(...)` resolves there; a store file got none, so the identical line
 * was a bare ReferenceError.
 *
 * It failed unreadably on top of that. Store files are stripped of `export` and
 * concatenated into ONE shared IIFE, so the throw took every store with it and
 * surfaced later as `Store not found` from an unrelated `useStore(...)` — in a
 * file that was fine.
 *
 * There was no coverage of store-loader at all before this
 * (`grep -rn 'getStoreScript\|store-loader' packages/stx/test | wc -l` -> 0).
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { clearStoreCache, getStoreScript } from '../../src/store-loader'

const dirs: string[] = []

async function storesDir(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'stx-stores-'))
  dirs.push(dir)
  for (const [name, body] of Object.entries(files))
    await writeFile(path.join(dir, name), body, 'utf8')
  clearStoreCache()
  return dir
}

afterEach(async () => {
  clearStoreCache()
  for (const d of dirs.splice(0))
    await rm(d, { recursive: true, force: true })
})

describe('store runtime globals (#1838)', () => {
  it('destructures a window.stx-only composable the store references', async () => {
    const dir = await storesDir({
      'session.ts': `
        import { defineStore } from '@stacksjs/stx'
        export const useSession = defineStore('session', () => {
          const token = useCookie('app_token')
          return { token }
        })
      `,
    })

    const script = await getStoreScript(dir)
    expect(script).toBeTruthy()

    // The preamble must exist and must bind the name the store actually uses.
    expect(script).toContain('var __stx = window.stx || {};')
    expect(script).toContain('var useCookie = __stx["useCookie"];')
  })

  it('does not shadow a name the store declares itself', async () => {
    const dir = await storesDir({
      'own.ts': `
        const useCookie = (k) => k
        export const useOwn = defineStore('own', () => ({ v: useCookie('x') }))
      `,
    })

    const script = await getStoreScript(dir)
    // The local declaration wins; binding it from window.stx would clobber it
    // and, being a duplicate `var` in the same IIFE, change what the store sees.
    expect(script).not.toContain('var useCookie = __stx["useCookie"];')
    expect(script).toContain('useCookie')
  })

  it('only emits bindings for names actually referenced', async () => {
    const dir = await storesDir({
      'tiny.ts': `
        export const useTiny = defineStore('tiny', () => ({ n: 1 }))
      `,
    })

    const script = await getStoreScript(dir)
    // A store touching nothing should not drag ~46 destructures onto the page.
    expect(script).not.toContain('var useCookie = __stx["useCookie"];')
    expect(script).not.toContain('var useWebSocket = __stx["useWebSocket"];')
  })

  it('keeps every store in one IIFE, with the preamble ahead of all of them', async () => {
    const dir = await storesDir({
      'a.ts': `export const useA = defineStore('a', () => ({ t: useCookie('a') }))`,
      'b.ts': `export const useB = defineStore('b', () => ({ t: useCookie('b') }))`,
    })

    const script = await getStoreScript(dir) ?? ''
    const preamble = script.indexOf('var useCookie = __stx["useCookie"];')
    expect(preamble).toBeGreaterThan(-1)
    // Both stores follow it — the binding is shared, not per-file. Quotes are
    // normalised by the transpiler, so match the store marker instead.
    expect(script.indexOf('// Store: a')).toBeGreaterThan(preamble)
    expect(script.indexOf('// Store: b')).toBeGreaterThan(preamble)
    expect(script.match(/;\(function\(\)\{/g)?.length).toBe(1)
  })
})
