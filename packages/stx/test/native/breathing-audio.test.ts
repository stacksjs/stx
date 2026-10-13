/**
 * A breathing screen on the phone: useBreathPacer and useAmbientSound in a
 * native screen's JavaScriptCore, where the host (Craft) supplies the Web
 * Audio API and timers and stx supplies the rest of the browser's globals.
 * Also the animation frame such a screen's scene runs on.
 */
import { describe, expect, it } from 'bun:test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { installJSCGlobals, NATIVE_FRAME_MS } from '../../src/native/runtime/jsc-globals'

const composables = path.resolve(import.meta.dir, '../../src/composables')

/** The Web Audio surface the host gives a native screen, recording what is built. */
function fakeWebAudio() {
  const built: string[] = []
  const contexts: any[] = []
  class Param {
    value: number
    events: string[] = []
    constructor(value: number) { this.value = value }
    setValueAtTime(value: number) { this.events.push(`set:${value}`); return this }
    linearRampToValueAtTime(value: number) { this.events.push(`linear:${value}`); return this }
    exponentialRampToValueAtTime(value: number) { this.events.push(`exponential:${value}`); return this }
    setTargetAtTime(value: number) { this.events.push(`target:${value}`); return this }
    cancelScheduledValues() { this.events.push('cancel'); return this }
  }
  class Node {
    outputs: unknown[] = []
    constructor(readonly kind: string) { built.push(kind) }
    connect(target: any) { this.outputs.push(target); return target instanceof Param ? undefined : target }
    disconnect() { this.outputs = [] }
  }
  class Source extends Node {
    onended: (() => void) | null = null
    started = false
    start() { this.started = true }
    stop() {}
  }
  class AudioContext {
    sampleRate = 48000
    state = 'running'
    destination = new Node('destination')
    clock = 0
    constructor() { contexts.push(this) }
    get currentTime() { return this.clock }
    resume() { this.state = 'running'; return Promise.resolve() }
    suspend() { this.state = 'suspended'; return Promise.resolve() }
    close() { this.state = 'closed'; return Promise.resolve() }
    createGain() { return Object.assign(new Node('gain'), { gain: new Param(1) }) }
    createOscillator() { return Object.assign(new Source('oscillator'), { type: 'sine', frequency: new Param(440), detune: new Param(0) }) }
    createBufferSource() { return Object.assign(new Source('bufferSource'), { buffer: null, loop: false }) }
    createBiquadFilter() { return Object.assign(new Node('biquad'), { type: 'lowpass', frequency: new Param(350), Q: new Param(1) }) }
    createDelay() { return Object.assign(new Node('delay'), { delayTime: new Param(0) }) }
    createDynamicsCompressor() { return Object.assign(new Node('compressor'), { threshold: new Param(-24), ratio: new Param(12) }) }
    createConvolver() { return Object.assign(new Node('convolver'), { buffer: null }) }
    createBuffer(channels: number, length: number, sampleRate: number) {
      built.push(`buffer:${channels}x${length}`)
      const data = Array.from({ length: channels }, () => new Float32Array(length))
      return { numberOfChannels: channels, length, sampleRate, getChannelData: (index: number) => data[index] }
    }
  }
  return { AudioContext, built, contexts }
}

async function breathingScreen() {
  const root = await mkdtemp(path.join(tmpdir(), 'stx-native-breathing-'))
  const file = path.join(root, 'Breathe.stx')
  await Bun.write(file, `<script client>
import { useAmbientSound } from '${composables}/use-ambient-sound'
import { pacerScale, useBreathPacer } from '${composables}/use-breath-pacer'
const sound = useAmbientSound()
const kind = state('')
const scale = state(0.6)
const pacer = useBreathPacer([{ kind: 'in', seconds: 4 }, { kind: 'out', seconds: 6 }], {
  onStep: (step) => { kind.set(step.kind); sound.breathTone(step.kind, step.seconds) },
})
globalThis.__breathe = {
  sound, pacer, kind, scale,
  begin: async () => { await sound.start('electronic', 0.5); pacer.start() },
  frame: () => { scale.set(pacerScale(pacer.tick())) },
}
</script>
<View><Text :text="kind()" /></View>`)
  return (await compileSharedScreenBundle(file)).code
}

describe('a breathing screen on the phone', () => {
  it('paces its breaths and plays its music, breath tones and chime through the host\'s Web Audio', async () => {
    const audio = fakeWebAudio()
    let clock = 1000
    const scope: Record<string, any> = {
      __stxNativeParams: {},
      __stxNativeBridge: {
        platform: 'ios',
        mutationProtocolVersion: 1,
        capabilityProtocolVersion: 1,
        capabilityTimeoutMs: 1000,
        capabilities: [],
        onMessage: () => {},
        postMessage: () => {},
      },
      // What Craft's host installs before the bundle runs.
      AudioContext: audio.AudioContext,
      performance: { now: () => clock },
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
    }
    vm.runInNewContext(await breathingScreen(), scope)
    await Promise.resolve()
    const screen = scope.__breathe
    expect(screen).toBeDefined()

    await screen.begin()
    // The pacer's first step began, with its tone.
    expect(screen.kind()).toBe('in')
    clock += 2000
    screen.frame()
    expect(screen.scale()).toBeCloseTo(0.8, 2)
    clock += 2500
    screen.frame()
    expect(screen.kind()).toBe('out')

    // The music's bus: a compressor, a generated reverb and noise beds made
    // from buffers, and the electronic genre's feedback delay.
    for (const kind of ['compressor', 'convolver', 'delay', 'gain'])
      expect(audio.built).toContain(kind)
    expect(audio.built).toContain('buffer:2x153600')
    expect(audio.built).toContain('buffer:1x192000')
    // Its sequencer runs on the host's setInterval and schedules ahead.
    audio.contexts[0].clock = 0.5
    await new Promise(resolve => setTimeout(resolve, 60))
    expect(audio.built.filter(kind => kind === 'oscillator').length).toBeGreaterThan(3)
    expect(audio.built).toContain('bufferSource')
    expect(audio.built).toContain('biquad')

    screen.sound.chime()
    await screen.sound.stop()
    expect(audio.contexts[0].state).toBe('closed')
  })

  it('without the host\'s Web Audio, starts silently rather than throwing', async () => {
    const scope: Record<string, any> = {
      __stxNativeParams: {},
      __stxNativeBridge: { platform: 'ios', mutationProtocolVersion: 1, capabilityProtocolVersion: 1, capabilityTimeoutMs: 1000, capabilities: [], onMessage: () => {}, postMessage: () => {} },
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
    }
    vm.runInNewContext(await breathingScreen(), scope)
    await Promise.resolve()
    await scope.__breathe.begin()
    expect(scope.__breathe.kind()).toBe('in')
    expect(scope.__breathe.sound.playing).toBe(false)
  })
})

describe('requestAnimationFrame on a native screen', () => {
  it('runs on the next 60 Hz frame with the host\'s clock, and cancels', () => {
    const delays: number[] = []
    const pending = new Map<number, () => void>()
    let next = 0
    let clock = 1003
    const target: Record<string, any> = {
      performance: { now: () => clock },
      setTimeout: (callback: () => void, delay: number) => { delays.push(delay); pending.set(++next, callback); return next },
      clearTimeout: (id: number) => { pending.delete(id) },
    }
    installJSCGlobals(target)
    const times: number[] = []
    target.requestAnimationFrame((time: number) => times.push(time))
    // 1003 ms is 3 ms past the frame at 1000: the next is 13.67 ms away.
    expect(delays[0]).toBe(Math.round(NATIVE_FRAME_MS - (1003 % NATIVE_FRAME_MS)))
    clock = 1016.67
    pending.get(1)!()
    expect(times).toEqual([1016.67])
    const id = target.requestAnimationFrame(() => times.push(-1))
    target.cancelAnimationFrame(id)
    expect(pending.has(id)).toBe(false)
    // Never a zero-delay timer: a loop asking again from its callback waits for the next frame.
    clock = 1033.3333
    target.requestAnimationFrame(() => {})
    expect(delays.at(-1)).toBeGreaterThanOrEqual(1)
  })

  it('leaves a host\'s own requestAnimationFrame alone', () => {
    const own = () => 7
    const target: Record<string, any> = { setTimeout, clearTimeout, requestAnimationFrame: own }
    installJSCGlobals(target)
    expect(target.requestAnimationFrame).toBe(own)
  })
})
