/**
 * Tests for the JS bridge's `_finite` / `_finiteSigned` coercion in
 * `craft.window.setSize` / `setPosition` / `setMinSize` / `setMaxSize`.
 * Earlier these accepted NaN / Infinity / negative values, which would
 * either silently fall back to defaults (best case) or write garbage
 * geometry into AppKit (worst case).
 */
import { afterEach, beforeAll, describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import './_mock-bridge'

const BRIDGE_PATH = `${__dirname}/../../../../craft/packages/zig/src/js/craft-bridge.js`

beforeAll(() => {
  const code = readFileSync(BRIDGE_PATH, 'utf8')
  // eslint-disable-next-line no-eval
  ;(0, eval)(code)
})

let posted: Array<{ t: string, a: string, d: string }>
beforeAll(() => {
  // Stub webkit so _post posts into a captured list.
  posted = []
  ;(window as any).webkit = {
    messageHandlers: {
      craft: {
        postMessage: (msg: any) => { posted.push(msg) },
      },
    },
  }
})

afterEach(() => {
  posted.length = 0
})

function lastPosted(action: string): any {
  for (let i = posted.length - 1; i >= 0; i--) {
    if (posted[i].a === action) return JSON.parse(posted[i].d)
  }
  return null
}

describe('window.setSize finite coercion', () => {
  it('passes valid integers through unchanged', async () => {
    await (window as any).craft.window.setSize(1024, 768)
    expect(lastPosted('setSize')).toEqual({ width: 1024, height: 768 })
  })

  it('rounds fractional values', async () => {
    await (window as any).craft.window.setSize(800.4, 600.7)
    expect(lastPosted('setSize')).toEqual({ width: 800, height: 601 })
  })

  it('replaces NaN with the default', async () => {
    await (window as any).craft.window.setSize(Number.NaN, 600)
    expect(lastPosted('setSize')).toEqual({ width: 800, height: 600 })
  })

  it('replaces Infinity with the default', async () => {
    await (window as any).craft.window.setSize(800, Number.POSITIVE_INFINITY)
    expect(lastPosted('setSize')).toEqual({ width: 800, height: 600 })
  })

  it('replaces negative values with the default', async () => {
    await (window as any).craft.window.setSize(-100, 600)
    expect(lastPosted('setSize')).toEqual({ width: 800, height: 600 })
  })
})

describe('window.setPosition finite coercion', () => {
  it('accepts negative coordinates (off-screen positioning)', async () => {
    await (window as any).craft.window.setPosition(-100, 50)
    expect(lastPosted('setPosition')).toEqual({ x: -100, y: 50 })
  })

  it('rejects NaN', async () => {
    await (window as any).craft.window.setPosition(Number.NaN, 50)
    expect(lastPosted('setPosition')).toEqual({ x: 100, y: 50 })
  })
})

describe('window.setAspectRatio finite coercion', () => {
  it('uses 1 as the default for invalid sides', async () => {
    await (window as any).craft.window.setAspectRatio(Number.NaN, 0)
    expect(lastPosted('setAspectRatio')).toEqual({ width: 1, height: 0 })
  })
})
