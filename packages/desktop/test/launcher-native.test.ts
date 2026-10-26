import { afterEach, expect, test } from 'bun:test'
import { app } from '../src/app-info'
import { clipboard } from '../src/clipboard'
import { findCall, installMockBridge } from './_mock-bridge'

let bridge: ReturnType<typeof installMockBridge> | undefined
afterEach(() => bridge?.uninstall())

test('protected history requires native support and establishes a metadata-only baseline', async () => {
  bridge = installMockBridge(['clipboard'])
  bridge.whenCalled('clipboard', 'historySnapshot', { changeCount: 7, text: null, blocked: true, sourceBundleId: 'com.apple.Passwords' })
  expect((await clipboard.historySnapshot()).text).toBeNull()
  expect(findCall(bridge.calls, 'clipboard', 'historySnapshot')!.args).toEqual([-1])
  await expect(clipboard.historySnapshot(1.5)).rejects.toThrow('integer')
  bridge.uninstall()
  await expect(clipboard.historySnapshot()).rejects.toThrow('requires a Craft native window')
})

test('real app icons require an application path and a native result', async () => {
  bridge = installMockBridge(['app'])
  await expect(app.icon('/etc/passwd')).rejects.toThrow('absolute .app path')
  await expect(app.icon('Safari.app')).rejects.toThrow('absolute .app path')
  bridge.whenCalled('app', 'icon', 'data:image/png;base64,test')
  expect(await app.icon('/Applications/Safari.app')).toBe('data:image/png;base64,test')
  bridge.uninstall()
  await expect(app.icon('/Applications/Safari.app')).rejects.toThrow('requires a Craft native window')
})
