/**
 * useAmbientSound's sleep beds and sleep timer, against a Web Audio stand-in
 * that records what is scheduled on each gain and runs on a clock the test
 * moves.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { fadedLevel, useAmbientSound } from '../../src/composables/use-ambient-sound'

interface Event { kind: string, value: number, at: number }

function fakeWebAudio() {
  const contexts: any[] = []
  const gains: any[] = []
  class Param {
    events: Event[] = []
    constructor(public value: number) {}
    setValueAtTime(value: number, at: number) { this.events.push({ kind: 'set', value, at }); return this }
    linearRampToValueAtTime(value: number, at: number) { this.events.push({ kind: 'linear', value, at }); return this }
    exponentialRampToValueAtTime(value: number, at: number) { this.events.push({ kind: 'exponential', value, at }); return this }
    setTargetAtTime(value: number, at: number) { this.events.push({ kind: 'target', value, at }); return this }
    cancelScheduledValues(at: number) { this.events = this.events.filter(event => event.at < at); this.events.push({ kind: 'cancel', value: 0, at }); return this }
  }
  class Node {
    connect(target: any) { return target instanceof Param ? undefined : target }
    disconnect() {}
  }
  class Source extends Node {
    onended: (() => void) | null = null
    start() {}
    stop() {}
  }
  class AudioContext {
    sampleRate = 8000
    state = 'running'
    destination = new Node()
    clock = 0
    constructor() { contexts.push(this) }
    get currentTime() { return this.clock }
    resume() { this.state = 'running'; return Promise.resolve() }
    suspend() { this.state = 'suspended'; return Promise.resolve() }
    close() { this.state = 'closed'; return Promise.resolve() }
    createGain() { const node = Object.assign(new Node(), { gain: new Param(1) }); gains.push(node); return node }
    createOscillator() { return Object.assign(new Source(), { type: 'sine', frequency: new Param(440), detune: new Param(0) }) }
    createBufferSource() { return Object.assign(new Source(), { buffer: null, loop: false }) }
    createBiquadFilter() { return Object.assign(new Node(), { type: 'lowpass', frequency: new Param(350), Q: new Param(1) }) }
    createDelay() { return Object.assign(new Node(), { delayTime: new Param(0) }) }
    createDynamicsCompressor() { return Object.assign(new Node(), { threshold: new Param(-24), ratio: new Param(12) }) }
    createConvolver() { return Object.assign(new Node(), { buffer: null }) }
    createBuffer(channels: number, length: number, sampleRate: number) {
      const data = Array.from({ length: channels }, () => new Float32Array(length))
      return { numberOfChannels: channels, length, sampleRate, getChannelData: (index: number) => data[index] }
    }
  }
  return { AudioContext, contexts, gains }
}

/** The music bus is the first gain the engine builds. */
function musicEvents(audio: ReturnType<typeof fakeWebAudio>): Event[] {
  return audio.gains[0].gain.events.filter((event: Event) => event.kind !== 'cancel')
}

let restore: (() => void) | null = null

function install() {
  const audio = fakeWebAudio()
  const before = (globalThis as any).AudioContext
  ;(globalThis as any).AudioContext = audio.AudioContext
  restore = () => { (globalThis as any).AudioContext = before }
  return audio
}

afterEach(async () => {
  restore?.()
  restore = null
})

describe('fadedLevel', () => {
  it('holds the level, falls in a straight line, then stays silent', () => {
    const fade = { start: 100, end: 200 }
    expect(fadedLevel(0.6, 50, fade)).toBe(0.6)
    expect(fadedLevel(0.6, 100, fade)).toBe(0.6)
    expect(fadedLevel(0.6, 150, fade)).toBeCloseTo(0.3)
    expect(fadedLevel(0.6, 200, fade)).toBe(0)
    expect(fadedLevel(0.6, 900, fade)).toBe(0)
    expect(fadedLevel(0.6, 150, null)).toBe(0.6)
  })
})

describe('sleep beds', () => {
  it('plays rain, ocean and brown noise', async () => {
    const audio = install()
    const sound = useAmbientSound()
    for (const genre of ['rain', 'ocean', 'brown'] as const) {
      await sound.start(genre, 0.4)
      expect(sound.playing).toBe(true)
    }
    await sound.stop()
    expect(sound.playing).toBe(false)
    expect(audio.contexts[0].state).toBe('closed')
  })
})

describe('sleep timer', () => {
  it('holds the music, then fades it to nothing on the audio clock', async () => {
    const audio = install()
    const sound = useAmbientSound()
    await sound.start('rain', 0.5)
    audio.contexts[0].clock = 10
    sound.fadeOut(60, 600)
    expect(sound.fadeSchedule).toEqual({ start: 610, end: 670 })
    expect(musicEvents(audio).slice(-3)).toEqual([
      { kind: 'set', value: 0.5, at: 10 },
      { kind: 'set', value: 0.5, at: 610 },
      { kind: 'linear', value: 0, at: 670 },
    ])
    expect(sound.faded).toBe(false)
    audio.contexts[0].clock = 670
    expect(sound.faded).toBe(true)
    await sound.stop()
  })

  it('keeps the fade when the volume changes mid-way, from where it had got to', async () => {
    const audio = install()
    const sound = useAmbientSound()
    await sound.start('ocean', 0.8)
    sound.fadeOut(100)
    audio.contexts[0].clock = 50
    sound.volume(0.4)
    expect(musicEvents(audio).slice(-2)).toEqual([
      { kind: 'set', value: 0.2, at: 50 },
      { kind: 'linear', value: 0, at: 100 },
    ])
    await sound.stop()
  })

  it('carries the fade over to a new bed, and comes back up when called off', async () => {
    const audio = install()
    const sound = useAmbientSound()
    await sound.start('brown', 0.5)
    sound.fadeOut(30, 300)
    audio.contexts[0].clock = 100
    await sound.start('rain')
    expect(musicEvents(audio).slice(-3)).toEqual([
      { kind: 'linear', value: 0.5, at: 101.5 },
      { kind: 'set', value: 0.5, at: 300 },
      { kind: 'linear', value: 0, at: 330 },
    ])
    sound.cancelFade()
    expect(sound.fadeSchedule).toBeNull()
    expect(musicEvents(audio).at(-1)).toEqual({ kind: 'target', value: 0.5, at: 100 })
    await sound.stop()
    expect(sound.fadeSchedule).toBeNull()
  })

  it('does nothing before sound has started', () => {
    install()
    const sound = useAmbientSound()
    sound.fadeOut(10)
    sound.cancelFade()
    expect(sound.fadeSchedule).toBeNull()
    expect(sound.faded).toBe(false)
  })
})
