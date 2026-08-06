/**
 * A memoised bundle cannot outlive its sources (stacksjs/stx#1877).
 *
 * `getStoreScript()` memoised per directory and nothing invalidated it.
 * `clearStoreCache()` and `clearComposableCache()` existed and were exported,
 * but every caller in the workspace was a test — so in dev, no store edit
 * reached the browser without restarting the server. The first store file was
 * the worst case: the `null` from before it existed was memoised permanently,
 * which one app documented in its own config as a known caveat.
 *
 * Fixed by keying the memo on the sources rather than only clearing it on a
 * watcher event. A watcher fixes the common case, but a missed event leaves a
 * stale bundle serving for the rest of the session with no symptom other than
 * an edit that appears not to have happened.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { clearStoreCache, getStoreScript } from '../src/store-loader'
import { readSigned, type SignedCacheEntry, sourceSignature, writeSigned } from '../src/source-signature'

let dir = ''

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-store-memo-'))
  fs.mkdirSync(path.join(dir, 'stores'), { recursive: true })
  clearStoreCache()
})

afterEach(() => {
  clearStoreCache()
  if (dir)
    fs.rmSync(dir, { recursive: true, force: true })
})

function writeStore(name: string, body: string): void {
  fs.writeFileSync(path.join(dir, 'stores', `${name}.ts`), body)
}

const storesDir = (): string => path.join(dir, 'stores')

describe('the store bundle tracks its sources', () => {
  it('sees the first store file created after the directory was already probed', async () => {
    // The exact caveat one app documented: the `null` was memoised forever, so
    // creating the first store needed a dev-server restart.
    expect(await getStoreScript(storesDir())).toBeNull()

    writeStore('session', `export const useSession = defineStore('session', () => ({ v: state(1) }))\n`)

    expect(await getStoreScript(storesDir())).not.toBeNull()
  })

  it('rebuilds after an edit to an existing store', async () => {
    writeStore('session', `export const useSession = defineStore('session', () => ({ v: state(1) }))\n`)
    expect(await getStoreScript(storesDir())).toContain('state(1)')

    await Bun.sleep(10)
    writeStore('session', `export const useSession = defineStore('session', () => ({ v: state(999) }))\n`)

    expect(await getStoreScript(storesDir())).toContain('state(999)')
  })

  it('sees a store file being deleted', async () => {
    writeStore('a', `export const useA = defineStore('a', () => ({ v: state(1) }))\n`)
    writeStore('b', `export const useB = defineStore('b', () => ({ v: state(2) }))\n`)
    expect(await getStoreScript(storesDir())).toContain('useB')

    fs.rmSync(path.join(dir, 'stores', 'b.ts'))

    expect(await getStoreScript(storesDir())).not.toContain('useB')
  })

  it('still serves from the memo when nothing changed', async () => {
    // The memo has to keep earning its place — this guards against the fix
    // turning every call into a rebuild.
    writeStore('session', `export const useSession = defineStore('session', () => ({ v: state(1) }))\n`)
    const first = await getStoreScript(storesDir())

    expect(await getStoreScript(storesDir())).toBe(first as string)
  })
})

describe('sourceSignature', () => {
  it('changes when a file is edited', async () => {
    const file = path.join(dir, 'a.ts')
    fs.writeFileSync(file, 'export const a = 1\n')
    const before = sourceSignature([file])

    await Bun.sleep(10)
    fs.writeFileSync(file, 'export const a = 2\n')

    expect(sourceSignature([file])).not.toBe(before)
  })

  it('changes when a file is added or removed', () => {
    const a = path.join(dir, 'a.ts')
    const b = path.join(dir, 'b.ts')
    fs.writeFileSync(a, 'export const a = 1\n')
    fs.writeFileSync(b, 'export const b = 1\n')

    expect(sourceSignature([a])).not.toBe(sourceSignature([a, b]))
  })

  it('does not depend on scan order', () => {
    const a = path.join(dir, 'a.ts')
    const b = path.join(dir, 'b.ts')
    fs.writeFileSync(a, 'export const a = 1\n')
    fs.writeFileSync(b, 'export const b = 1\n')

    expect(sourceSignature([a, b])).toBe(sourceSignature([b, a]))
  })

  it('treats a missing file as a difference rather than throwing', () => {
    expect(() => sourceSignature([path.join(dir, 'nope.ts')])).not.toThrow()
  })
})

describe('signed cache entries', () => {
  it('returns a hit only for the signature it was written with', () => {
    const cache = new Map<string, SignedCacheEntry<string>>()
    writeSigned(cache, 'k', 'sig-1', 'value')

    expect(readSigned(cache, 'k', 'sig-1')).toBe('value')
    expect(readSigned(cache, 'k', 'sig-2')).toBeUndefined()
  })

  it('distinguishes a cached empty value from a miss', () => {
    // The loaders memoise `''` to mean "nothing to load", which must not read
    // back as "not cached".
    const cache = new Map<string, SignedCacheEntry<string>>()
    writeSigned(cache, 'k', 'sig', '')

    expect(readSigned(cache, 'k', 'sig')).toBe('')
  })
})
