import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { coreml } from '../src/coreml'
import { findCall, installMockBridge } from './_mock-bridge'

describe('coreml', () => {
  let bridge: ReturnType<typeof installMockBridge>
  beforeEach(() => { bridge = installMockBridge(['coreml']) })
  afterEach(() => { bridge.uninstall() })

  it('loadModel forwards id + path', async () => {
    bridge.whenCalled('coreml', 'loadModel', true)
    expect(await coreml.loadModel('mnist', '/tmp/mnist.mlmodelc')).toBe(true)
    const c = findCall(bridge.calls, 'coreml', 'loadModel')!
    expect(c.args).toEqual(['mnist', '/tmp/mnist.mlmodelc'])
  })

  it('predict forwards id + input dict', async () => {
    bridge.whenCalled('coreml', 'predict', { class: 'cat', confidence: 0.92 })
    const r = await coreml.predict('classifier', { image: 'data:...' }) as any
    expect(r.class).toBe('cat')
    const c = findCall(bridge.calls, 'coreml', 'predict')!
    expect(c.args[0]).toBe('classifier')
  })

  it('rejects empty id / path', async () => {
    await expect(coreml.loadModel('', '/p')).rejects.toThrow(/required/)
    await expect(coreml.loadModel('id', '')).rejects.toThrow(/required/)
    await expect(coreml.predict('', {})).rejects.toThrow(/required/)
  })

  it('returns false / null without bridge', async () => {
    bridge.uninstall()
    expect(await coreml.loadModel('a', '/b')).toBe(false)
    expect(await coreml.predict('a', {})).toBeNull()
  })
})
