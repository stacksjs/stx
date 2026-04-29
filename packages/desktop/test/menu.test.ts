import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { menu } from '../src/menu'
import { findCall, installMockBridge } from './_mock-bridge'

describe('menu', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['menu'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('set forwards items as array', async () => {
    const items = [{ id: 'file', label: 'File', submenu: [{ id: 'open', label: 'Open' }] }]
    await menu.set(items)
    expect(findCall(bridge.calls, 'menu', 'set')!.args[0]).toEqual(items)
  })

  it('setDock forwards items', async () => {
    await menu.setDock([{ id: 'q', label: 'Quit' }])
    expect(findCall(bridge.calls, 'menu', 'setDock')!.args[0]).toEqual([{ id: 'q', label: 'Quit' }])
  })

  it('item-mutation methods all forward id', async () => {
    await menu.removeItem('a')
    await menu.enableItem('b')
    await menu.disableItem('c')
    await menu.checkItem('d')
    await menu.uncheckItem('e')
    await menu.setItemLabel('f', 'New')
    expect(findCall(bridge.calls, 'menu', 'removeItem')!.args).toEqual(['a'])
    expect(findCall(bridge.calls, 'menu', 'enableItem')!.args).toEqual(['b'])
    expect(findCall(bridge.calls, 'menu', 'disableItem')!.args).toEqual(['c'])
    expect(findCall(bridge.calls, 'menu', 'checkItem')!.args).toEqual(['d'])
    expect(findCall(bridge.calls, 'menu', 'uncheckItem')!.args).toEqual(['e'])
    expect(findCall(bridge.calls, 'menu', 'setItemLabel')!.args).toEqual(['f', 'New'])
  })

  it('addItem forwards parent + item', async () => {
    await menu.addItem('file', { id: 'save', label: 'Save' })
    const c = findCall(bridge.calls, 'menu', 'addItem')!
    expect(c.args[0]).toBe('file')
    expect((c.args[1] as any).id).toBe('save')
  })

  it('clearDock forwards', async () => {
    await menu.clearDock()
    expect(findCall(bridge.calls, 'menu', 'clearDock')).toBeDefined()
  })

  it('onAction fires on craft:menu:action', () => {
    let received: any = null
    const off = menu.onAction((e) => { received = e })
    window.dispatchEvent(new CustomEvent('craft:menu:action', { detail: { id: 'save' } }))
    expect(received.id).toBe('save')
    off()
  })
})

describe('menu (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('all action methods are graceful no-ops', async () => {
    await expect(menu.set([])).resolves.toBeUndefined()
    await expect(menu.setDock([])).resolves.toBeUndefined()
    await expect(menu.enableItem('x')).resolves.toBeUndefined()
  })
})
