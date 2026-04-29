import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { touchbar } from '../src/touchbar'
import { findCall, installMockBridge } from './_mock-bridge'

describe('touchbar', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['touchbar'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('addItem forwards full item object', async () => {
    const item = { id: 'play', type: 'button' as const, label: 'Play', enabled: true }
    await touchbar.addItem(item)
    expect(findCall(bridge.calls, 'touchbar', 'addItem')!.args[0]).toEqual(item)
  })

  it('removeItem / setLabel / setIcon / setEnabled forward', async () => {
    await touchbar.removeItem('a')
    await touchbar.setLabel('b', 'Pause')
    await touchbar.setIcon('c', 'sun')
    await touchbar.setEnabled('d', false)
    expect(findCall(bridge.calls, 'touchbar', 'removeItem')!.args).toEqual(['a'])
    expect(findCall(bridge.calls, 'touchbar', 'setLabel')!.args).toEqual(['b', 'Pause'])
    expect(findCall(bridge.calls, 'touchbar', 'setIcon')!.args).toEqual(['c', 'sun'])
    expect(findCall(bridge.calls, 'touchbar', 'setEnabled')!.args).toEqual(['d', false])
  })

  it('setSliderValue forwards', async () => {
    await touchbar.setSliderValue('vol', 0.5)
    expect(findCall(bridge.calls, 'touchbar', 'setSliderValue')!.args).toEqual(['vol', 0.5])
  })

  it('clear / show / hide forward', async () => {
    await touchbar.clear()
    await touchbar.show()
    await touchbar.hide()
    expect(findCall(bridge.calls, 'touchbar', 'clear')).toBeDefined()
    expect(findCall(bridge.calls, 'touchbar', 'show')).toBeDefined()
    expect(findCall(bridge.calls, 'touchbar', 'hide')).toBeDefined()
  })

  it('updateItem merges partial props', async () => {
    await touchbar.updateItem('vol', { label: 'Volume' })
    const c = findCall(bridge.calls, 'touchbar', 'updateItem')!
    expect(c.args).toEqual(['vol', { label: 'Volume' }])
  })

  it('onAction fires on craft:touchbar:action', () => {
    let received: any = null
    const off = touchbar.onAction((e) => { received = e })
    window.dispatchEvent(new CustomEvent('craft:touchbar:action', {
      detail: { id: 'play' },
    }))
    expect(received.id).toBe('play')
    off()
  })
})

describe('touchbar (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('all methods are graceful no-ops', async () => {
    await expect(touchbar.addItem({ id: 'x', type: 'button' })).resolves.toBeUndefined()
    await expect(touchbar.show()).resolves.toBeUndefined()
  })
})
