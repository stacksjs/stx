import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { speechRecognition } from '../src/speech-recognition'
import { findCall, installMockBridge } from './_mock-bridge'

describe('speechRecognition', () => {
  let bridge: ReturnType<typeof installMockBridge>
  beforeEach(() => { bridge = installMockBridge(['speechRecognition']) })
  afterEach(() => { bridge.uninstall() })

  it('isAvailable returns boolean', async () => {
    bridge.whenCalled('speechRecognition', 'isAvailable', false)
    expect(await speechRecognition.isAvailable()).toBe(false)
  })

  it('start forwards options', async () => {
    bridge.whenCalled('speechRecognition', 'start', { started: true })
    await speechRecognition.start({ language: 'en-US', partialResults: true })
    const c = findCall(bridge.calls, 'speechRecognition', 'start')!
    expect((c.args[0] as any).language).toBe('en-US')
  })

  it('onPartial / onFinal subscribe', () => {
    const partials: string[] = []
    const finals: string[] = []
    const offP = speechRecognition.onPartial(e => partials.push(e.transcript))
    const offF = speechRecognition.onFinal(e => finals.push(e.transcript))
    window.dispatchEvent(new CustomEvent('craft:speechRecognition:partial', { detail: { transcript: 'hi' } }))
    window.dispatchEvent(new CustomEvent('craft:speechRecognition:final', { detail: { transcript: 'hi there' } }))
    expect(partials).toEqual(['hi'])
    expect(finals).toEqual(['hi there'])
    offP(); offF()
  })

  it('returns false without bridge', async () => {
    bridge.uninstall()
    expect(await speechRecognition.isAvailable()).toBe(false)
  })
})
