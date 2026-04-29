/**
 * Text-to-Speech
 *
 * Speak text aloud through the system synthesizer. macOS uses
 * `AVSpeechSynthesizer` (the modern, system-wide voice that respects
 * the user's preferred voice + rate).
 *
 * Browser fallback uses `window.speechSynthesis` — same shape, similar
 * voice list. The two paths are deliberately compatible so call sites
 * don't need to branch.
 */

import { hasBridge } from './_bridge'

export interface SpeakOptions {
  /** Voice identifier (e.g. `com.apple.voice.compact.en-US.Samantha`)
   *  or BCP-47 language tag (`en-US`). Optional — system default used. */
  voice?: string
  /** Rate, 0..1. AVSpeechUtterance treats ~0.5 as natural. */
  rate?: number
  /** Pitch multiplier, 0.5..2.0. Default 1.0. */
  pitch?: number
  /** Volume, 0..1. Default 1.0. */
  volume?: number
}

export interface SpeechVoice {
  /** Stable identifier for `voice` option. */
  id: string
  /** Human-readable voice name (e.g. "Samantha"). */
  name: string
  /** BCP-47 language code. */
  language: string
  /** "default" or "enhanced" (premium installed voice). */
  quality: 'default' | 'enhanced'
}

export interface SpeechAPI {
  /** Speak the given text. Returns once the utterance is *queued*, not finished. */
  speak: (text: string, options?: SpeakOptions) => Promise<void>
  /** Stop speaking immediately. */
  stop: () => Promise<void>
  /** Pause at the next word boundary. Resume with `resume()`. */
  pause: () => Promise<void>
  /** Resume a paused utterance. */
  resume: () => Promise<void>
  /** True if the synthesizer currently has an utterance. */
  isSpeaking: () => Promise<boolean>
  /** All installed voices on the system. */
  getVoices: () => Promise<SpeechVoice[]>
}

export const speech: SpeechAPI = {
  async speak(text, options) {
    if (!text) throw new Error('speech.speak: text is required')
    if (hasBridge('speech')) {
      await window.craft!.speech.speak(text, options)
      return
    }
    if (typeof window !== 'undefined' && (window as any).speechSynthesis) {
      const u = new (window as any).SpeechSynthesisUtterance(text)
      if (options) {
        if (options.rate != null) u.rate = options.rate
        if (options.pitch != null) u.pitch = options.pitch
        if (options.volume != null) u.volume = options.volume
        if (options.voice) {
          // Web SpeechSynthesisVoice is matched by name OR voiceURI;
          // try both to be permissive.
          const voices = (window as any).speechSynthesis.getVoices()
          const match = voices.find((v: any) => v.voiceURI === options.voice || v.name === options.voice || v.lang === options.voice)
          if (match) u.voice = match
        }
      }
      ;(window as any).speechSynthesis.speak(u)
    }
  },

  async stop() {
    if (hasBridge('speech')) {
      await window.craft!.speech.stop()
      return
    }
    if (typeof window !== 'undefined' && (window as any).speechSynthesis) {
      ;(window as any).speechSynthesis.cancel()
    }
  },

  async pause() {
    if (hasBridge('speech')) {
      await window.craft!.speech.pause()
      return
    }
    if (typeof window !== 'undefined' && (window as any).speechSynthesis) {
      ;(window as any).speechSynthesis.pause()
    }
  },

  async resume() {
    if (hasBridge('speech')) {
      await window.craft!.speech.resume()
      return
    }
    if (typeof window !== 'undefined' && (window as any).speechSynthesis) {
      ;(window as any).speechSynthesis.resume()
    }
  },

  async isSpeaking() {
    if (hasBridge('speech')) return await window.craft!.speech.isSpeaking()
    if (typeof window !== 'undefined' && (window as any).speechSynthesis) {
      return !!(window as any).speechSynthesis.speaking
    }
    return false
  },

  async getVoices() {
    if (hasBridge('speech')) return await window.craft!.speech.getVoices()
    if (typeof window !== 'undefined' && (window as any).speechSynthesis) {
      const raw = (window as any).speechSynthesis.getVoices() as any[]
      return raw.map(v => ({
        id: v.voiceURI || v.name,
        name: v.name,
        language: v.lang || '',
        quality: 'default' as const,
      }))
    }
    return []
  },
}
