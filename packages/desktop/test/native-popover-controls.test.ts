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

it('updates the existing status item through Craft with correctly shaped messages', async () => {
  const calls: unknown[] = []
  globalThis.window = { craft: { tray: {
    setIcon: async (value: unknown) => { calls.push(value) },
    setTitle: async (value: unknown) => { calls.push(value) },
    setTooltip: async (value: unknown) => { calls.push(value) },
  } } } as any
  await nativeTray.setIcon('moon.fill')
  await nativeTray.setTitle('')
  await nativeTray.setTooltip('Hush')
  expect(calls).toEqual([{ icon: 'moon.fill' }, { title: '' }, { tooltip: 'Hush' }])
})

it('is safe in a browser without Craft', async () => {
  globalThis.window = {} as any
  await nativeWindow.show()
  await nativeWindow.hide()
  await nativeTray.setIcon('moon.fill')
})
