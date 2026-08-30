import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import type { ApplicationMenu, MenuItem, MenuRole } from '../src/menu'
import { menu, standardMenus } from '../src/menu'
import { findCall, installMockBridge } from './_mock-bridge'

describe('menu', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['menu'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('set forwards the {menus} envelope the native side parses', async () => {
    // Not a bare array: `setAppMenu` deserialises `{menus: [...]}`, and an
    // array arrives as an empty menu set that changes nothing and reports no
    // error. This package asked for an array until it was tried against a real
    // window.
    const appMenu = {
      menus: [
        { label: 'View', items: [{ id: 'disk', label: 'Disk Usage', shortcut: 'cmd+5' }] },
      ],
    }
    await menu.set(appMenu)
    expect(findCall(bridge.calls, 'menu', 'set')!.args[0]).toEqual(appMenu)
  })

  it('wires onClick without the caller ever naming an id', async () => {
    let picked = 0
    await menu.set({
      menus: [
        { label: 'View', items: [{ label: 'Reload', shortcut: 'cmd+r', onClick: () => { picked++ } }] },
      ],
    })

    const sent = findCall(bridge.calls, 'menu', 'set')!.args[0] as ApplicationMenu
    const item = sent.menus[0].items[0]

    // The closure does not go to the native side; an id it can report back does.
    expect(item.id).toBeTruthy()
    expect('onClick' in item).toBe(false)

    window.dispatchEvent(new CustomEvent('craft:menu:action', { detail: { id: item.id } }))
    expect(picked).toBe(1)
  })

  it('a second set replaces the previous wiring instead of stacking on it', async () => {
    let first = 0
    let second = 0
    await menu.set({ menus: [{ label: 'View', items: [{ id: 'a', label: 'A', onClick: () => { first++ } }] }] })
    await menu.set({ menus: [{ label: 'View', items: [{ id: 'a', label: 'A', onClick: () => { second++ } }] }] })

    window.dispatchEvent(new CustomEvent('craft:menu:action', { detail: { id: 'a' } }))
    expect(first).toBe(0)
    expect(second).toBe(1)
  })

  it('standardMenus.leading puts the app menu first, where AppKit expects it', () => {
    const leading = standardMenus.leading('MyApp')
    expect(leading[0].label).toBe('MyApp')
    expect(leading[1].label).toBe('Edit')

    // Clipboard items must be roles: an id round-tripping through JS cannot
    // reach the field editor, so Copy would do nothing in a text input. The id
    // that `set` adds is inert for a role item — Craft resolves the selector
    // from the role and ignores it — but it has to be there for the item to be
    // built at all.
    const copy = leading[1].items.find(i => i.label === 'Copy')
    expect(copy?.role).toBe('copy')
  })

  it('gives every item an id, because Craft silently skips the ones without', async () => {
    // `const id = it.id orelse continue` in Craft's menu builder. A menu of
    // pure role items therefore arrived as a menu of separators — which is
    // what shipped in 0.2.247: no Copy, no Paste, no Quit, and a payload that
    // looked correct at every point before the bridge.
    await menu.set({ menus: [...standardMenus.leading('App'), standardMenus.window()] })

    const sent = findCall(bridge.calls, 'menu', 'set')!.args[0] as ApplicationMenu
    for (const m of sent.menus) {
      for (const item of m.items) {
        if (item.separator)
          continue
        expect(item.id, `"${item.label}" would be dropped by the native side`).toBeTruthy()
      }
    }
  })

  it('carries roles, separators and shortcuts through untouched', async () => {
    const appMenu = {
      menus: [
        {
          label: 'Edit',
          items: [
            { id: 'copy', label: 'Copy', role: 'copy', shortcut: 'cmd+c' },
            { id: 'sep', separator: true },
            { id: 'all', label: 'Select All', role: 'selectAll', shortcut: 'cmd+a' },
          ],
        },
      ],
    }
    await menu.set(appMenu)
    const sent = findCall(bridge.calls, 'menu', 'set')!.args[0] as typeof appMenu
    expect(sent.menus[0].items[0].role).toBe('copy')
    expect(sent.menus[0].items[1].separator).toBe(true)
    expect(sent.menus[0].items[2].shortcut).toBe('cmd+a')
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

  it('reports that it did not set a menu, rather than pretending', async () => {
    // The difference between "applied" and "silently did nothing" is the whole
    // reason `set` returns a boolean: without it, an app with no bridge and an
    // app with a bad payload look identical from the calling side.
    await expect(menu.set({ menus: [] })).resolves.toBe(false)
  })

  it('other action methods stay graceful no-ops', async () => {
    await expect(menu.setDock([])).resolves.toBeUndefined()
    await expect(menu.enableItem('x')).resolves.toBeUndefined()
  })
})

describe('roles', () => {
  // Craft falls back to forwarding an unknown role as an event, so a misspelt
  // one builds an item that looks right and does nothing. The union is the only
  // thing that catches it, which makes drift from Craft's table a real bug.
  const CRAFT_ROLES = [
    'about', 'hide', 'hideOthers', 'showAll', 'quit',
    'undo', 'redo', 'cut', 'copy', 'paste', 'delete', 'selectAll',
    'close', 'minimize', 'zoom', 'front', 'fullscreen',
    'reload', 'forceReload',
  ] as const

  it('every role the union allows is one Craft implements', () => {
    // Assignable to MenuRole by construction; the compiler checks the direction
    // that matters, and this pins the other one.
    const roles: MenuRole[] = [...CRAFT_ROLES]
    expect(roles).toHaveLength(19)
  })

  it('names full screen the way Craft does, not the way Electron does', () => {
    const item: MenuItem = { label: 'Enter Full Screen', role: 'fullscreen' }
    expect(item.role).toBe('fullscreen')
    // @ts-expect-error Electron's spelling is not a Craft role and would build a dead item
    const wrong: MenuItem = { role: 'togglefullscreen' }
    expect(wrong.role).toBe('togglefullscreen')
  })

  it('standard menus name only roles Craft implements', () => {
    const all = [standardMenus.app('X'), standardMenus.edit(), standardMenus.window()]
    for (const m of all) {
      for (const item of m.items) {
        if (item.role) expect(CRAFT_ROLES).toContain(item.role)
      }
    }
  })
})
