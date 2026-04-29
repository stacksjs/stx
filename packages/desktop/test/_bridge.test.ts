/**
 * Tests for the central `_bridge.ts` helpers (`hasBridge`,
 * `requireBridge`, `onCraftEvent`). These are the pivot point for
 * every other facade in the package — if they regress, every module
 * breaks.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { hasBridge, onCraftEvent, requireBridge } from '../src/_bridge'
import { installMockBridge } from './_mock-bridge'

describe('hasBridge', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['app'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('returns true when window.craft.<ns> exists', () => {
    expect(hasBridge('app')).toBe(true)
  })

  it('returns false after uninstall', () => {
    bridge.uninstall()
    expect(hasBridge('app')).toBe(false)
  })

  it('returns false when window.craft is missing entirely', () => {
    delete (window as any).craft
    expect(hasBridge('anything')).toBe(false)
  })
})

describe('requireBridge', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['fs'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('returns the namespace object when present', () => {
    const fs = requireBridge<{ readFile: (p: string) => Promise<any> }>('fs')
    expect(typeof fs.readFile).toBe('function')
  })

  it('throws a clear error when the bridge is missing', () => {
    bridge.uninstall()
    expect(() => requireBridge('fs')).toThrow(/Craft native window/)
  })

  it('throws a namespace-specific message', () => {
    bridge.uninstall()
    expect(() => requireBridge('keychain')).toThrow(/keychain/)
  })
})

describe('onCraftEvent', () => {
  it('subscribes and the cb fires on dispatched events', () => {
    let payload: any = null
    const off = onCraftEvent('craft:test:foo', (detail) => { payload = detail })
    window.dispatchEvent(new CustomEvent('craft:test:foo', { detail: { x: 1 } }))
    expect(payload).toEqual({ x: 1 })
    off()
  })

  it('passes empty object when detail is missing', () => {
    let payload: any = 'not-set'
    const off = onCraftEvent('craft:test:bar', (d) => { payload = d })
    window.dispatchEvent(new CustomEvent('craft:test:bar'))
    expect(payload).toEqual({})
    off()
  })

  it('returned unsubscribe is idempotent', () => {
    let count = 0
    const off = onCraftEvent('craft:test:idem', () => { count++ })
    window.dispatchEvent(new CustomEvent('craft:test:idem'))
    off()
    off() // calling twice shouldn't throw
    window.dispatchEvent(new CustomEvent('craft:test:idem'))
    expect(count).toBe(1)
  })

  it('multiple subscribers receive each event independently', () => {
    const seen: number[] = []
    const offA = onCraftEvent('craft:test:multi', () => { seen.push(1) })
    const offB = onCraftEvent('craft:test:multi', () => { seen.push(2) })
    window.dispatchEvent(new CustomEvent('craft:test:multi'))
    expect(seen).toEqual([1, 2])
    offA()
    offB()
  })
})
