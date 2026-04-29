import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { theme } from '../src/theme'
import { installMockBridge } from './_mock-bridge'

describe('theme (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['theme'])
    // Provide a get() that returns synchronously — theme.get is sync.
    bridge.whenCalled('theme', 'get', () => ({ appearance: 'dark' }))
  })
  afterEach(() => {
    bridge.uninstall()
    delete (window as any).__craftCurrentTheme
  })

  it('get() returns the bridge value synchronously', () => {
    expect(theme.get().appearance).toBe('dark')
  })

  it('current() resolves to the bridge value', async () => {
    expect((await theme.current()).appearance).toBe('dark')
  })

  it('onChange fires immediately with the current value', () => {
    let received: any = null
    const off = theme.onChange((info) => { received = info })
    expect(received).toBeDefined()
    expect(received.appearance).toBe('dark')
    off()
  })

  it('onChange fires on craft:theme events', () => {
    const seen: string[] = []
    const off = theme.onChange((info) => { seen.push(info.appearance) })
    // Initial fires once; clear and dispatch.
    seen.length = 0
    window.dispatchEvent(new CustomEvent('craft:theme', { detail: { appearance: 'light' } }))
    expect(seen).toEqual(['light'])
    off()
  })
})

describe('theme (no bridge — matchMedia fallback)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('falls back to prefers-color-scheme when bridge absent', () => {
    // Happy DOM has matchMedia returning matches:false by default — the
    // exact value isn't important; we just need `light` or `dark`.
    const a = theme.get().appearance
    expect(a === 'light' || a === 'dark').toBe(true)
  })
})
