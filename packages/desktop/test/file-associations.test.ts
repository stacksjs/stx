import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { fileAssociations } from '../src/file-associations'
import { findCall, installMockBridge } from './_mock-bridge'

describe('fileAssociations', () => {
  let bridge: ReturnType<typeof installMockBridge>
  beforeEach(() => { bridge = installMockBridge(['fileAssociations']) })
  afterEach(() => { bridge.uninstall() })

  it('getDefault returns bundle id', async () => {
    bridge.whenCalled('fileAssociations', 'getDefault', 'com.apple.Preview')
    expect(await fileAssociations.getDefault('public.png')).toBe('com.apple.Preview')
  })

  it('setDefault forwards uti + bundleId', async () => {
    bridge.whenCalled('fileAssociations', 'setDefault', true)
    await fileAssociations.setDefault('public.png', 'com.example.viewer')
    const c = findCall(bridge.calls, 'fileAssociations', 'setDefault')!
    expect(c.args).toEqual(['public.png', 'com.example.viewer'])
  })

  it('rejects empty uti', async () => {
    await expect(fileAssociations.getDefault('')).rejects.toThrow(/required/)
    await expect(fileAssociations.setDefault('', 'x')).rejects.toThrow(/required/)
  })
})
