/**
 * Tests for the round-2 shape adapters in `craft-bridge.js`.
 *
 * Several native bridges return payloads in shapes the TS facades
 * couldn't directly consume — e.g. `{r,g,b}` triples for system colours,
 * a bare `[{name,isDirectory},...]` for `readDir`, `mtime` instead of
 * `modifiedAt` for stat. The translators in craft-bridge.js normalize
 * everything before it reaches the facade. These tests drive the
 * translators directly to lock the shape in.
 */
import { afterEach, beforeAll, describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
// Side-effect import to install the window.addEventListener / dispatchEvent
// polyfill — the bridge IIFE's `fireReady()` needs them.
import './_mock-bridge'

const BRIDGE_PATH = `${__dirname}/../../../../craft/packages/zig/src/js/craft-bridge.js`

beforeAll(() => {
  const code = readFileSync(BRIDGE_PATH, 'utf8')
  // eslint-disable-next-line no-eval
  ;(0, eval)(code)
})

afterEach(() => {
  ;(window as any).__craftBridgePending = {}
})

function captureResult(action: string): Promise<any> {
  return new Promise((resolve) => {
    const p = ((window as any).__craftBridgePending[action] = (window as any).__craftBridgePending[action] || [])
    p.push({ resolve, reject: resolve })
  })
}

describe('System colour translator (RGB → hex)', () => {
  it('converts {r,g,b} to a 6-digit hex string', async () => {
    const promise = captureResult('getAccentColor')
    ;(window as any).__craftSystemCallback('', 'getAccentColor', { r: 0.039, g: 0.518, b: 1.0 })
    const r = await promise
    expect(r.color).toMatch(/^#[0-9a-f]{6}$/)
    // 0.039 * 255 = 9.945 → 0a (rounded)
    expect(r.color.slice(0, 3)).toBe('#0a')
  })

  it('clamps out-of-range values', async () => {
    const promise = captureResult('getHighlightColor')
    ;(window as any).__craftSystemCallback('', 'getHighlightColor', { r: 5, g: -1, b: 0.5 })
    const r = await promise
    // r=1.0 → ff, g=0 → 00, b=0.5 → 80
    expect(r.color).toBe('#ff0080')
  })

  it('returns "" for malformed payload', async () => {
    const promise = captureResult('getAccentColor')
    ;(window as any).__craftSystemCallback('', 'getAccentColor', null)
    const r = await promise
    expect(r.color).toBe('')
  })
})

describe('FS readDir translator (bare array → {entries})', () => {
  it('wraps array payload', async () => {
    const promise = captureResult('readDir')
    ;(window as any).__craftFSCallback('', 'readDir', [
      { name: 'a.txt', isDirectory: false },
      { name: 'sub', isDirectory: true },
    ])
    const r = await promise
    expect(r.entries).toHaveLength(2)
    expect(r.entries[0].name).toBe('a.txt')
  })

  it('returns {entries:[]} for non-array payload', async () => {
    const promise = captureResult('readDir')
    ;(window as any).__craftFSCallback('', 'readDir', null)
    expect(await promise).toEqual({ entries: [] })
  })
})

describe('FS stat translator (mtime → modifiedAt + ms)', () => {
  it('renames mtime field to modifiedAt', async () => {
    const promise = captureResult('stat')
    ;(window as any).__craftFSCallback('', 'stat', {
      isFile: true,
      isDirectory: false,
      size: 100,
      mtime: 1700000000, // seconds
    })
    const r = await promise
    expect(r.modifiedAt).toBe(1700000000 * 1000)
  })

  it('preserves ms-precision timestamps', async () => {
    const promise = captureResult('stat')
    ;(window as any).__craftFSCallback('', 'stat', {
      isFile: true,
      isDirectory: false,
      size: 1,
      mtime: 1700000000000, // ms already
    })
    expect((await promise).modifiedAt).toBe(1700000000000)
  })

  it('coerces missing booleans to false', async () => {
    const promise = captureResult('stat')
    ;(window as any).__craftFSCallback('', 'stat', { size: 0 })
    const r = await promise
    expect(r.isFile).toBe(false)
    expect(r.isDirectory).toBe(false)
    expect(r.isSymlink).toBe(false)
  })
})

describe('_req timeout', () => {
  it('rejects with timeout error after the configured deadline', async () => {
    // Drop the timeout to something we can wait through synchronously.
    const previous = (window as any).__craftBridgeRequestTimeoutMs
    ;(window as any).__craftBridgeRequestTimeoutMs = 50

    // Stub _post (via stubbing webkit) to "succeed" so _req thinks the
    // call is in flight, then never deliver.
    ;(window as any).webkit = {
      messageHandlers: { craft: { postMessage: () => undefined } },
    }

    // Re-load bridge so the stub is picked up. Cheaper: just call
    // window.craft.shell.openPath which uses _send (non-promise).
    // Easier: call _req directly via window.craft API. fs.exists uses _req.
    const promise = (window as any).craft.fs.exists('/tmp/never')

    await expect(promise).rejects.toThrow(/timed out/)

    ;(window as any).__craftBridgeRequestTimeoutMs = previous
    delete (window as any).webkit
  })
})
