import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { audio } from '../src/audio'
import { findCall, installMockBridge } from './_mock-bridge'

describe('audio (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['audio'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('play forwards path + options', async () => {
    bridge.whenCalled('audio', 'play', true)
    const ok = await audio.play('/Users/me/sound.wav', { volume: 0.5, loops: true })
    expect(ok).toBe(true)
    const c = findCall(bridge.calls, 'audio', 'play')!
    expect(c.args[0]).toBe('/Users/me/sound.wav')
    expect((c.args[1] as any).volume).toBe(0.5)
    expect((c.args[1] as any).loops).toBe(true)
  })

  it('playSystemSound forwards name', async () => {
    bridge.whenCalled('audio', 'playSystemSound', true)
    await audio.playSystemSound('Funk')
    expect(findCall(bridge.calls, 'audio', 'playSystemSound')!.args).toEqual(['Funk'])
  })

  it('stop / isPlaying forward', async () => {
    bridge.whenCalled('audio', 'isPlaying', true)
    await audio.stop()
    expect(await audio.isPlaying()).toBe(true)
    expect(findCall(bridge.calls, 'audio', 'stop')).toBeDefined()
  })

  it('startRecording / stopRecording / isRecording', async () => {
    bridge.whenCalled('audio', 'startRecording', true)
    bridge.whenCalled('audio', 'isRecording', true)
    expect(await audio.startRecording('/tmp/voice.m4a', { maxDurationSec: 30 })).toBe(true)
    expect(await audio.isRecording()).toBe(true)
    await audio.stopRecording()
    expect(findCall(bridge.calls, 'audio', 'stopRecording')).toBeDefined()
  })

  it('startRecording forwards maxDurationSec', async () => {
    bridge.whenCalled('audio', 'startRecording', true)
    await audio.startRecording('/tmp/x.m4a', { maxDurationSec: 5 })
    const c = findCall(bridge.calls, 'audio', 'startRecording')!
    expect((c.args[1] as any).maxDurationSec).toBe(5)
  })
})

describe('audio (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('isPlaying / isRecording return false', async () => {
    expect(await audio.isPlaying()).toBe(false)
    expect(await audio.isRecording()).toBe(false)
  })

  it('startRecording returns false (no native fallback)', async () => {
    expect(await audio.startRecording('/tmp/x.m4a')).toBe(false)
  })
})
