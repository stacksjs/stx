import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { speech } from '../src/speech'
import { findCall, installMockBridge } from './_mock-bridge'

describe('speech (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['speech'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('speak forwards text and options', async () => {
    await speech.speak('hello', { rate: 0.5, voice: 'en-US' })
    const c = findCall(bridge.calls, 'speech', 'speak')!
    expect(c.args[0]).toBe('hello')
    expect((c.args[1] as any).rate).toBe(0.5)
    expect((c.args[1] as any).voice).toBe('en-US')
  })

  it('rejects empty text', async () => {
    await expect(speech.speak('')).rejects.toThrow(/text is required/)
  })

  it('stop / pause / resume forward', async () => {
    await speech.stop()
    await speech.pause()
    await speech.resume()
    expect(findCall(bridge.calls, 'speech', 'stop')).toBeDefined()
    expect(findCall(bridge.calls, 'speech', 'pause')).toBeDefined()
    expect(findCall(bridge.calls, 'speech', 'resume')).toBeDefined()
  })

  it('isSpeaking returns boolean', async () => {
    bridge.whenCalled('speech', 'isSpeaking', true)
    expect(await speech.isSpeaking()).toBe(true)
  })

  it('getVoices returns array', async () => {
    bridge.whenCalled('speech', 'getVoices', [
      { id: 'samantha', name: 'Samantha', language: 'en-US', quality: 'enhanced' },
    ])
    const v = await speech.getVoices()
    expect(v).toHaveLength(1)
    expect(v[0].quality).toBe('enhanced')
  })
})

describe('speech (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('isSpeaking returns false', async () => {
    expect(await speech.isSpeaking()).toBe(false)
  })

  it('getVoices returns []', async () => {
    expect(await speech.getVoices()).toEqual([])
  })

  it('speak rejects empty text consistently with native path', async () => {
    await expect(speech.speak('')).rejects.toThrow(/text is required/)
  })

  it('stop / pause / resume are graceful no-ops', async () => {
    await expect(speech.stop()).resolves.toBeUndefined()
    await expect(speech.pause()).resolves.toBeUndefined()
    await expect(speech.resume()).resolves.toBeUndefined()
  })
})
