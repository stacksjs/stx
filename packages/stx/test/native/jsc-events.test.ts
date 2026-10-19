import { describe, expect, it } from 'bun:test'
import { installJSCGlobals } from '../../src/native/runtime/jsc-globals'

describe('component events in JavaScriptCore', () => {
  it('preserves payloads, bubbling, propagation and cancellation state', () => {
    const target: Record<string, any> = { setTimeout, clearTimeout }
    installJSCGlobals(target)
    const detail = { value: 3 }
    const event = new target.CustomEvent('update:value', { detail, bubbles: true, cancelable: true })
    expect(event.detail).toBe(detail)
    expect(event.bubbles).toBe(true)
    expect(event.defaultPrevented).toBe(false)
    expect(event.cancelBubble).toBe(false)
    event.preventDefault()
    event.stopPropagation()
    expect(event.defaultPrevented).toBe(true)
    expect(event.cancelBubble).toBe(true)
    const passive = new target.Event('change')
    passive.preventDefault()
    expect(passive.defaultPrevented).toBe(false)
    expect(passive.bubbles).toBe(false)
  })
})
