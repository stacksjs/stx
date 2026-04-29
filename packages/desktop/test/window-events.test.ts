import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { windowEvents } from '../src/window-events'
import { installMockBridge } from './_mock-bridge'

describe('windowEvents', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['window'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('onFocus / onBlur fire on craft:window:focus / blur', () => {
    let focuses = 0
    let blurs = 0
    const offFocus = windowEvents.onFocus(() => { focuses++ })
    const offBlur = windowEvents.onBlur(() => { blurs++ })

    window.dispatchEvent(new CustomEvent('craft:window:focus'))
    window.dispatchEvent(new CustomEvent('craft:window:blur'))

    expect(focuses).toBe(1)
    expect(blurs).toBe(1)

    offFocus()
    offBlur()
  })

  it('onResize delivers WindowSize detail', () => {
    let received: any = null
    const off = windowEvents.onResize((s) => { received = s })
    window.dispatchEvent(new CustomEvent('craft:window:resize', {
      detail: { width: 800, height: 600 },
    }))
    expect(received).toEqual({ width: 800, height: 600 })
    off()
  })

  it('onMove delivers WindowPosition detail', () => {
    let received: any = null
    const off = windowEvents.onMove((p) => { received = p })
    window.dispatchEvent(new CustomEvent('craft:window:move', {
      detail: { x: 100, y: 50 },
    }))
    expect(received).toEqual({ x: 100, y: 50 })
    off()
  })

  it('onClose / onMinimize / onRestore fire correctly', () => {
    const log: string[] = []
    windowEvents.onClose(() => log.push('close'))
    windowEvents.onMinimize(() => log.push('min'))
    windowEvents.onRestore(() => log.push('rest'))
    window.dispatchEvent(new CustomEvent('craft:window:close'))
    window.dispatchEvent(new CustomEvent('craft:window:minimize'))
    window.dispatchEvent(new CustomEvent('craft:window:restore'))
    expect(log).toEqual(['close', 'min', 'rest'])
  })

  it('unsubscribe stops further callbacks', () => {
    let n = 0
    const off = windowEvents.onFocus(() => { n++ })
    window.dispatchEvent(new CustomEvent('craft:window:focus'))
    off()
    window.dispatchEvent(new CustomEvent('craft:window:focus'))
    expect(n).toBe(1)
  })
})
