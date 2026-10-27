import { afterEach, expect, it } from 'bun:test'
import { nativeWindow } from '../src/native-window'
import { nativeTray } from '../src/native-tray'

const original = globalThis.window
afterEach(() => { globalThis.window = original })

it('shows and dismisses the existing native window without closing its page', async () => {
  const calls: string[] = []
  globalThis.window = { craft: { window: {
    show: async () => { calls.push('show') },
    hide: async () => { calls.push('hide') },
    close: async () => { calls.push('close') },
  } } } as any
  await nativeWindow.show()
  await nativeWindow.hide()
  expect(calls).toEqual(['show', 'hide'])
})

it('updates the existing status item through Craft with Craft’s string-valued public API', async () => {
  const calls: unknown[] = []
  globalThis.window = { craft: { tray: {
    setIcon: async (value: unknown) => { calls.push(value) },
    setTitle: async (value: unknown) => { calls.push(value) },
    setTooltip: async (value: unknown) => { calls.push(value) },
  } } } as any
  await nativeTray.setIcon('moon.fill')
  await nativeTray.setTitle('')
  await nativeTray.setTooltip('Hush')
  expect(calls).toEqual(['moon.fill', '', 'Hush'])
})

it('is safe in a browser without Craft', async () => {
  globalThis.window = {} as any
  await nativeWindow.show()
  await nativeWindow.hide()
  await nativeTray.setIcon('moon.fill')
})

it('sets the native context menu and tears down direct click and menu subscriptions', async () => {
  const target = document.createElement('div')
  let menu: unknown
  globalThis.window = Object.assign(target, { craft: { tray: { setMenu: async (items: unknown) => { menu = items } } } }) as any
  const items = [{ label: 'Open', action: 'show' }, { type: 'separator' as const }, { label: 'Settings', action: 'settings' }]
  await nativeTray.setMenu(items)
  expect(menu).toEqual(items)
  const calls: string[] = []
  const stopClick = nativeTray.onClick(event => calls.push(event.button))
  const stopMenu = nativeTray.onMenuAction(event => calls.push(event.action))
  target.dispatchEvent(new CustomEvent('craft:tray:click', { detail: { button: 'left', timestamp: 1, modifiers: {} } }))
  target.dispatchEvent(new CustomEvent('craft:tray:menuAction', { detail: { action: 'settings' } }))
  expect(calls).toEqual(['left', 'settings'])
  stopClick()
  stopMenu()
  target.dispatchEvent(new CustomEvent('craft:tray:click', { detail: { button: 'left' } }))
  target.dispatchEvent(new CustomEvent('craft:tray:menuAction', { detail: { action: 'settings' } }))
  expect(calls).toEqual(['left', 'settings'])
})
