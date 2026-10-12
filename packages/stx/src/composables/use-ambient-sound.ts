/**
 * useAmbientSound - music for breathing, meditation and focus, synthesised
 * on the device as it plays
 *
 * Nothing here is a recording: every bed is oscillators, filtered noise and
 * envelopes scheduled against the AudioContext clock, so it needs no licence,
 * no download and no network, and it is the app's own by construction.
 *
 * Genres:
 *   ambient     slow, detuned pads over a four-chord cycle with a soft shimmer
 *   nature      waves (swelling brown noise), wind and the odd bird
 *   house       ~118 bpm: soft kick, off-beat hats and bass, pads
 *   electronic  ~100 bpm: plucked arpeggios through a delay, light drums
 *   drone       low drones and dark noise, for sleep
 *
 * Breath tones (rising on the in-breath, falling on the out) and a chime play
 * on their own bus, so they stay audible at any music level.
 *
 * An AudioContext may only start from a user gesture: call `start` from a
 * click. `stop()` releases everything.
 *
 * @example
 * ```ts
 * const sound = useAmbientSound()
 * await sound.start('nature', 0.5) // in a click handler
 * sound.breathTone('in', 4)
 * sound.chime()
 * await sound.stop()
 * ```
 */

export type AmbientGenre = 'ambient' | 'nature' | 'house' | 'electronic' | 'drone'

const CHORDS: number[][] = [
  [50, 57, 62, 66, 69], // D  (D3 A3 D4 F#4 A4)
  [47, 54, 59, 62, 66], // Bm
  [43, 50, 55, 59, 62], // G
  [45, 52, 57, 61, 64], // A
]

function hz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

interface Voice { stop: (at: number) => void }

export class AmbientSound {
  private context: AudioContext | null = null
  private music: GainNode | null = null
  private tones: GainNode | null = null
  private reverb: ConvolverNode | null = null
  private timers: Array<ReturnType<typeof setInterval>> = []
  private voices = new Set<Voice>()
  private noise: AudioBuffer | null = null
  private white: AudioBuffer | null = null
  private genre: AmbientGenre | null = null
  private level = 0.5
  private generation = 0

  get playing(): boolean {
    return !!this.context && !!this.genre
  }

  /** Begin (or switch to) a genre. Resolves once sound is scheduled. */
  async start(genre: AmbientGenre | 'none', volume = this.level): Promise<void> {
    const request = ++this.generation
    this.level = clamp(volume)
    const context = await this.ensureContext()
    if (request !== this.generation || !context) return
    this.stopMusic(context.currentTime)
    if (genre === 'none') {
      this.genre = null
      return
    }
    this.genre = genre
    this.music!.gain.cancelScheduledValues(context.currentTime)
    this.music!.gain.setValueAtTime(0, context.currentTime)
    this.music!.gain.linearRampToValueAtTime(this.level, context.currentTime + 1.5)
    const beds: Record<AmbientGenre, (context: AudioContext) => void> = {
      ambient: c => this.ambient(c),
      nature: c => this.nature(c),
      house: c => this.house(c),
      electronic: c => this.electronic(c),
      drone: c => this.drone(c),
    }
    beds[genre](context)
  }

  /** Make sure the tones bus exists without starting music (breath tones alone). */
  async prepare(): Promise<boolean> {
    return !!await this.ensureContext()
  }

  volume(value: number): void {
    this.level = clamp(value)
    if (this.context && this.music && this.genre) this.music.gain.setTargetAtTime(this.level, this.context.currentTime, 0.2)
  }

  /** Quiet the music without losing it (pause). */
  async suspend(): Promise<void> {
    if (this.context?.state === 'running') await this.context.suspend().catch(() => {})
  }

  async resume(): Promise<void> {
    if (this.context?.state === 'suspended') await this.context.resume().catch(() => {})
  }

  /**
   * A soft tone that follows a breath: up for an inhale, down for an exhale,
   * steady and quiet for a hold.
   */
  breathTone(kind: 'in' | 'out' | 'hold', seconds: number): void {
    const context = this.context
    if (!context || !this.tones || context.state !== 'running') return
    const now = context.currentTime
    const length = Math.max(0.4, Math.min(20, seconds))
    const oscillator = context.createOscillator()
    oscillator.type = 'sine'
    const low = 196
    const high = 294
    if (kind === 'in') {
      oscillator.frequency.setValueAtTime(low, now)
      oscillator.frequency.exponentialRampToValueAtTime(high, now + length)
    }
    else if (kind === 'out') {
      oscillator.frequency.setValueAtTime(high, now)
      oscillator.frequency.exponentialRampToValueAtTime(low, now + length)
    }
    else {
      oscillator.frequency.setValueAtTime(kind === 'hold' ? 247 : low, now)
    }
    const gain = context.createGain()
    const peak = kind === 'hold' ? 0.035 : 0.07
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(peak, now + Math.min(0.6, length / 3))
    gain.gain.setValueAtTime(peak, now + length * 0.75)
    gain.gain.linearRampToValueAtTime(0, now + length)
    oscillator.connect(gain).connect(this.tones)
    oscillator.start(now)
    oscillator.stop(now + length + 0.05)
  }

  /** A small bell: segment changes, the end of a hold, the end of the class. */
  chime(strength = 1): void {
    const context = this.context
    if (!context || !this.tones || context.state !== 'running') return
    const now = context.currentTime
    for (const [ratio, level, decay] of [[1, 0.12, 2.6], [2.76, 0.05, 1.4], [5.4, 0.02, 0.8]] as const) {
      const oscillator = context.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = 880 * ratio
      const gain = context.createGain()
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(level * strength, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay)
      oscillator.connect(gain).connect(this.tones)
      if (this.reverb) gain.connect(this.reverb)
      oscillator.start(now)
      oscillator.stop(now + decay + 0.05)
    }
  }

  /** Everything off and released. */
  async stop(): Promise<void> {
    this.generation++
    const context = this.context
    this.context = null
    this.genre = null
    for (const timer of this.timers) clearInterval(timer)
    this.timers = []
    this.voices.clear()
    this.music = null
    this.tones = null
    this.reverb = null
    if (context && context.state !== 'closed') await context.close().catch(() => {})
  }

  // -------------------------------------------------------------------------

  private async ensureContext(): Promise<AudioContext | null> {
    if (this.context) {
      if (this.context.state === 'suspended') await this.context.resume().catch(() => {})
      return this.context
    }
    const Audio = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext
    if (!Audio) return null
    const context: AudioContext = new Audio()
    this.context = context
    await context.resume().catch(() => {})
    const music = context.createGain()
    music.gain.value = 0
    const tones = context.createGain()
    tones.gain.value = 1
    const compressor = context.createDynamicsCompressor()
    compressor.threshold.value = -18
    compressor.ratio.value = 3
    music.connect(compressor)
    tones.connect(compressor)
    compressor.connect(context.destination)
    const reverb = context.createConvolver()
    reverb.buffer = this.impulse(context, 3.2)
    const wet = context.createGain()
    wet.gain.value = 0.35
    reverb.connect(wet).connect(music)
    this.music = music
    this.tones = tones
    this.reverb = reverb
    this.noise = this.noiseBuffer(context)
    this.white = this.whiteBuffer(context, 1)
    return context
  }

  private stopMusic(at: number): void {
    for (const timer of this.timers) clearInterval(timer)
    this.timers = []
    for (const voice of this.voices) voice.stop(at + 1.2)
    this.voices.clear()
  }

  private every(ms: number, run: () => void): void {
    run()
    this.timers.push(setInterval(run, ms))
  }

  private impulse(context: AudioContext, seconds: number): AudioBuffer {
    const length = Math.floor(context.sampleRate * seconds)
    const buffer = context.createBuffer(2, length, context.sampleRate)
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      for (let index = 0; index < length; index++) data[index] = (Math.random() * 2 - 1) * (1 - index / length) ** 3
    }
    return buffer
  }

  private noiseBuffer(context: AudioContext): AudioBuffer {
    const length = context.sampleRate * 4
    const buffer = context.createBuffer(1, length, context.sampleRate)
    const data = buffer.getChannelData(0)
    let brown = 0
    for (let index = 0; index < length; index++) {
      brown = (brown + (Math.random() * 2 - 1) * 0.02) / 1.02
      data[index] = brown * 3.5
    }
    return buffer
  }

  private whiteBuffer(context: AudioContext, seconds: number): AudioBuffer {
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * seconds), context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let index = 0; index < data.length; index++) data[index] = Math.random() * 2 - 1
    return buffer
  }

  /** A held note: detuned oscillators through a low-pass, slow attack and release. */
  private pad(context: AudioContext, midi: number, start: number, length: number, level: number, type: OscillatorType = 'sawtooth', cutoff = 900): void {
    const out = context.createGain()
    out.gain.setValueAtTime(0, start)
    out.gain.linearRampToValueAtTime(level, start + Math.min(3, length / 3))
    out.gain.setValueAtTime(level, start + length - Math.min(3, length / 3))
    out.gain.linearRampToValueAtTime(0, start + length)
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = cutoff
    filter.Q.value = 0.6
    filter.connect(out)
    out.connect(this.music!)
    out.connect(this.reverb!)
    const oscillators = [-7, 7].map((cents) => {
      const oscillator = context.createOscillator()
      oscillator.type = type
      oscillator.frequency.value = hz(midi)
      oscillator.detune.value = cents
      oscillator.connect(filter)
      oscillator.start(start)
      oscillator.stop(start + length + 0.1)
      return oscillator
    })
    const voice: Voice = {
      stop: (at) => {
        out.gain.cancelScheduledValues(context.currentTime)
        out.gain.setTargetAtTime(0, context.currentTime, 0.3)
        for (const oscillator of oscillators) {
          try { oscillator.stop(at) }
          catch {}
        }
      },
    }
    this.voices.add(voice)
    oscillators[0]!.onended = () => this.voices.delete(voice)
  }

  /** Noise through a filter with a slow swell: waves, wind, rain. */
  private noiseBed(context: AudioContext, type: BiquadFilterType, frequency: number, level: number, swellSeconds: number, depth: number): void {
    const source = context.createBufferSource()
    source.buffer = this.noise
    source.loop = true
    const filter = context.createBiquadFilter()
    filter.type = type
    filter.frequency.value = frequency
    const gain = context.createGain()
    gain.gain.value = level
    const lfo = context.createOscillator()
    lfo.frequency.value = 1 / swellSeconds
    const lfoGain = context.createGain()
    lfoGain.gain.value = level * depth
    lfo.connect(lfoGain).connect(gain.gain)
    source.connect(filter).connect(gain).connect(this.music!)
    const start = context.currentTime
    source.start(start, Math.random() * 3)
    lfo.start(start)
    this.voices.add({
      stop: (at) => {
        gain.gain.setTargetAtTime(0, context.currentTime, 0.4)
        try {
          source.stop(at)
          lfo.stop(at)
        }
        catch {}
      },
    })
  }

  private kick(context: AudioContext, at: number, level = 0.5): void {
    const oscillator = context.createOscillator()
    oscillator.frequency.setValueAtTime(140, at)
    oscillator.frequency.exponentialRampToValueAtTime(45, at + 0.18)
    const gain = context.createGain()
    gain.gain.setValueAtTime(level, at)
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.35)
    oscillator.connect(gain).connect(this.music!)
    oscillator.start(at)
    oscillator.stop(at + 0.4)
  }

  private hat(context: AudioContext, at: number, level = 0.08, length = 0.04): void {
    const source = context.createBufferSource()
    source.buffer = this.white
    const filter = context.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 7000
    const gain = context.createGain()
    gain.gain.setValueAtTime(level, at)
    gain.gain.exponentialRampToValueAtTime(0.001, at + length)
    source.connect(filter).connect(gain).connect(this.music!)
    source.start(at, Math.random() * 0.8, length + 0.02)
  }

  private clap(context: AudioContext, at: number, level = 0.12): void {
    const source = context.createBufferSource()
    source.buffer = this.white
    const filter = context.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1500
    filter.Q.value = 0.8
    const gain = context.createGain()
    gain.gain.setValueAtTime(level, at)
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.2)
    source.connect(filter).connect(gain).connect(this.music!)
    gain.connect(this.reverb!)
    source.start(at, Math.random() * 0.7, 0.25)
  }

  private pluck(context: AudioContext, midi: number, at: number, length: number, level: number, type: OscillatorType = 'square', destination?: AudioNode): void {
    const oscillator = context.createOscillator()
    oscillator.type = type
    oscillator.frequency.value = hz(midi)
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2400, at)
    filter.frequency.exponentialRampToValueAtTime(400, at + length)
    const gain = context.createGain()
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(level, at + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, at + length)
    oscillator.connect(filter).connect(gain).connect(destination || this.music!)
    oscillator.start(at)
    oscillator.stop(at + length + 0.05)
  }

  /** A lookahead step sequencer: `step(index, at)` for each 16th note. */
  private sequence(context: AudioContext, bpm: number, step: (index: number, at: number) => void): void {
    const sixteenth = 60 / bpm / 4
    let next = context.currentTime + 0.1
    let index = 0
    this.every(25, () => {
      if (!this.context) return
      while (next < context.currentTime + 0.12) {
        step(index, next)
        next += sixteenth
        index++
      }
    })
  }

  private ambient(context: AudioContext): void {
    let chord = 0
    this.every(8000, () => {
      const at = context.currentTime + 0.05
      for (const note of CHORDS[chord % CHORDS.length]!) this.pad(context, note, at, 11, 0.035, 'sawtooth', 800)
      this.pad(context, CHORDS[chord % CHORDS.length]![2]! + 24, at + 1, 9, 0.012, 'sine', 4000)
      chord++
    })
  }

  private drone(context: AudioContext): void {
    this.noiseBed(context, 'lowpass', 280, 0.12, 14, 0.5)
    let chord = 0
    this.every(16000, () => {
      const at = context.currentTime + 0.05
      const root = [38, 35, 31, 33][chord % 4]!
      this.pad(context, root, at, 20, 0.07, 'triangle', 420)
      this.pad(context, root + 7, at + 2, 18, 0.04, 'sine', 600)
      this.pad(context, root + 19, at + 4, 15, 0.012, 'sine', 1200)
      chord++
    })
  }

  private nature(context: AudioContext): void {
    this.noiseBed(context, 'lowpass', 700, 0.22, 9, 0.85)
    this.noiseBed(context, 'bandpass', 1600, 0.035, 17, 0.7)
    let chord = 0
    this.every(12000, () => {
      const at = context.currentTime + 0.05
      const notes = CHORDS[chord % CHORDS.length]!
      this.pad(context, notes[1]!, at, 14, 0.018, 'sine', 1200)
      this.pad(context, notes[3]!, at + 2, 12, 0.012, 'sine', 1600)
      chord++
    })
    this.every(1000, () => {
      if (Math.random() > 0.12) return
      const at = context.currentTime + Math.random() * 0.5
      const chirps = 2 + Math.floor(Math.random() * 3)
      for (let chirp = 0; chirp < chirps; chirp++) {
        const start = at + chirp * 0.13
        const oscillator = context.createOscillator()
        oscillator.type = 'sine'
        const base = 2600 + Math.random() * 1400
        oscillator.frequency.setValueAtTime(base, start)
        oscillator.frequency.exponentialRampToValueAtTime(base * 1.35, start + 0.07)
        const gain = context.createGain()
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.012, start + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09)
        oscillator.connect(gain).connect(this.music!)
        gain.connect(this.reverb!)
        oscillator.start(start)
        oscillator.stop(start + 0.1)
      }
    })
  }

  private house(context: AudioContext): void {
    const bpm = 118
    const bar = 60 / bpm * 4
    let lastChord = -1
    this.sequence(context, bpm, (index, at) => {
      const beat = index % 4 === 0
      const chord = Math.floor(index / 32) % CHORDS.length
      if (beat) this.kick(context, at, 0.42)
      if (index % 4 === 2) this.hat(context, at, 0.06)
      if (index % 16 === 4 || index % 16 === 12) this.clap(context, at, 0.07)
      if (index % 4 === 2) this.pluck(context, CHORDS[chord]![0]! - 12, at, 0.22, 0.13, 'triangle')
      if (chord !== lastChord && index % 32 === 0) {
        lastChord = chord
        for (const note of CHORDS[chord]!.slice(1, 4)) this.pad(context, note + 12, at, bar * 2, 0.02, 'sawtooth', 1400)
      }
      if (index % 8 === 6 && Math.random() < 0.35) this.pluck(context, CHORDS[chord]![3]! + 12, at, 0.3, 0.025, 'sine')
    })
  }

  private electronic(context: AudioContext): void {
    const bpm = 100
    const delay = context.createDelay(1)
    delay.delayTime.value = 60 / bpm * 0.75
    const feedback = context.createGain()
    feedback.gain.value = 0.32
    const wet = context.createGain()
    wet.gain.value = 0.5
    delay.connect(feedback).connect(delay)
    delay.connect(wet).connect(this.music!)
    const arp = context.createGain()
    arp.gain.value = 1
    arp.connect(this.music!)
    arp.connect(delay)
    let lastChord = -1
    const bar = 60 / bpm * 4
    this.sequence(context, bpm, (index, at) => {
      const chord = Math.floor(index / 32) % CHORDS.length
      const notes = CHORDS[chord]!
      if (index % 8 === 0) this.kick(context, at, 0.32)
      if (index % 16 === 8) this.clap(context, at, 0.06)
      if (index % 2 === 1) this.hat(context, at, 0.03, 0.03)
      const pattern = [1, 2, 3, 4, 3, 2]
      this.pluck(context, notes[pattern[index % pattern.length]!]! + 12, at, 0.18, 0.035, 'square', arp)
      if (chord !== lastChord && index % 32 === 0) {
        lastChord = chord
        this.pad(context, notes[0]!, at, bar * 2, 0.04, 'triangle', 700)
      }
    })
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0.5))
}

/** A fresh ambient sound engine; nothing plays until `start` is called from a user gesture. */
export function useAmbientSound(): AmbientSound {
  return new AmbientSound()
}
