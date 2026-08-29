import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { contextMenu } from '../src/context-menu'
import { findCall, installMockBridge } from './_mock-bridge'

describe('contextMenu', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['nativeUI'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  function lastCall() {
    return findCall(bridge.calls, 'nativeUI', 'showContextMenu')!.args[0] as any
  }

  it('opens at the given point and reports that it did', async () => {
    const opened = await contextMenu.show({
      x: 120,
      y: 340,
      items: [{ id: 'reveal', title: 'Reveal in Finder' }],
    })

    expect(opened).toBe(true)
    const sent = lastCall()
    expect(sent.x).toBe(120)
    expect(sent.y).toBe(340)
    expect(sent.targetType).toBe('general')
    expect(sent.items[0]).toMatchObject({ id: 'reveal', title: 'Reveal in Finder' })
  })

  it('rounds fractional coordinates', async () => {
    // AppKit places menus on whole points; a fractional coordinate from a
    // scaled pointer event lands the menu a hair off.
    await contextMenu.show({ x: 10.4, y: 20.6, items: [{ id: 'a', title: 'A' }] })
    expect(lastCall().x).toBe(10)
    expect(lastCall().y).toBe(21)
  })

  it('carries targetId so one handler can serve a whole list', async () => {
    await contextMenu.show({ x: 0, y: 0, targetId: 'row-7', items: [{ id: 'a', title: 'A' }] })
    expect(lastCall().targetId).toBe('row-7')
  })

  it('defaults targetId to empty rather than undefined', async () => {
    await contextMenu.show({ x: 0, y: 0, items: [{ id: 'a', title: 'A' }] })
    expect(lastCall().targetId).toBe('')
  })

  it('translates a separator to the shape the bridge expects', async () => {
    await contextMenu.show({
      x: 0,
      y: 0,
      items: [{ id: 'a', title: 'A' }, { separator: true }, { id: 'b', title: 'B' }],
    })
    expect(lastCall().items[1]).toMatchObject({ type: 'separator' })
  })

  it('marks a disabled item as not enabled', async () => {
    await contextMenu.show({ x: 0, y: 0, items: [{ id: 'a', title: 'A', disabled: true }] })
    expect(lastCall().items[0].enabled).toBe(false)
  })

  it('leaves an ordinary item without an enabled flag', async () => {
    await contextMenu.show({ x: 0, y: 0, items: [{ id: 'a', title: 'A' }] })
    expect(lastCall().items[0].enabled).toBeUndefined()
  })

  it('translates submenus recursively', async () => {
    await contextMenu.show({
      x: 0,
      y: 0,
      items: [{ id: 'open', title: 'Open With', submenu: [{ separator: true }, { id: 'x', title: 'X' }] }],
    })
    expect(lastCall().items[0].submenu[0]).toMatchObject({ type: 'separator' })
    expect(lastCall().items[0].submenu[1]).toMatchObject({ id: 'x', title: 'X' })
  })

  it('refuses an empty menu instead of opening nothing', async () => {
    await expect(contextMenu.show({ x: 0, y: 0, items: [] })).rejects.toThrow(/at least one item/)
  })

  it('reports availability from the bridge', () => {
    expect(contextMenu.available()).toBe(true)
  })
})

describe('contextMenu without a bridge', () => {
  // `installMockBridge([])` still answers for every namespace — its proxy only
  // gates the `in` operator, and `hasBridge` reads the property. Simulating a
  // plain browser means removing `window.craft` outright.
  let previous: unknown

  beforeEach(() => {
    previous = (window as any).craft
    ;(window as any).craft = undefined
  })
  afterEach(() => {
    ;(window as any).craft = previous
  })

  it('reports that it did not open, so the caller can fall back', async () => {
    // Returning false rather than throwing: a page in a browser should be able
    // to render its own menu, not crash on a right-click.
    expect(await contextMenu.show({ x: 0, y: 0, items: [{ id: 'a', title: 'A' }] })).toBe(false)
    expect(contextMenu.available()).toBe(false)
  })

  it('still refuses an empty menu', async () => {
    await expect(contextMenu.show({ x: 0, y: 0, items: [] })).rejects.toThrow(/at least one item/)
  })
})
