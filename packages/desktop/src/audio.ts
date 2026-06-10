/**
 * Audio playback + recording.
 *
 * macOS uses `NSSound` for playback (one sound at a time per bridge
 * instance) and `AVAudioRecorder` for recording (M4A AAC by default).
 *
 * Browser fallback uses `Audio` element for playback. Recording has
 * no clean fallback — `MediaRecorder` requires `getUserMedia` which
 * has its own permission prompt; apps that need cross-environment
 * recording should provide their own stream-based path.
 */
import { hasBridge } from './_bridge'

export interface AudioPlayOptions {
  /** Volume 0..1. Default 1.0. */
  volume?: number
  /** Loop indefinitely until `stop()`. */
  loops?: boolean
}

export interface AudioRecordOptions {
  /** Maximum recording duration in seconds. Indefinite if omitted. */
  maxDurationSec?: number
}

export interface AudioAPI {
  /** Play an audio file from disk. */
  play: (path: string, options?: AudioPlayOptions) => Promise<boolean>
  /**
   * Play a system sound by name (e.g. "Funk", "Glass", "Hero").
   * Names live under `/System/Library/Sounds/`.
   */
  playSystemSound: (name: string) => Promise<boolean>
  /** Stop the current playback. Idempotent. */
  stop: () => Promise<void>
  isPlaying: () => Promise<boolean>
  /** Begin recording into the given path (creates a file). */
  startRecording: (path: string, options?: AudioRecordOptions) => Promise<boolean>
  /** Stop and finalize the current recording. */
  stopRecording: () => Promise<void>
  isRecording: () => Promise<boolean>
}

let webAudio: HTMLAudioElement | null = null

export const audio: AudioAPI = {
  async play(path, options) {
    if (hasBridge('audio')) {
      return await window.craft!.audio.play(path, options)
    }
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return false
    if (webAudio) { webAudio.pause(); webAudio = null }
    webAudio = new Audio(path)
    if (options?.volume != null) webAudio.volume = options.volume
    if (options?.loops) webAudio.loop = true
    try { await webAudio.play(); return true } catch { return false }
  },

  async playSystemSound(name) {
    if (hasBridge('audio')) return await window.craft!.audio.playSystemSound(name)
    // Web has no system-sound concept. Best-effort fallback: try a path
    // under /System/Library/Sounds — won't work in browsers but works
    // when this code runs under Bun against a non-Craft host.
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return false
    try {
      webAudio = new Audio(`/System/Library/Sounds/${name}.aiff`)
      await webAudio.play()
      return true
    } catch { return false }
  },

  async stop() {
    if (hasBridge('audio')) {
      await window.craft!.audio.stop()
      return
    }
    if (webAudio) { webAudio.pause(); webAudio.currentTime = 0; webAudio = null }
  },

  async isPlaying() {
    if (hasBridge('audio')) return await window.craft!.audio.isPlaying()
    return !!(webAudio && !webAudio.paused)
  },

  async startRecording(path, options) {
    if (hasBridge('audio')) return await window.craft!.audio.startRecording(path, options)
    // Web fallback would need MediaRecorder + getUserMedia; we don't
    // bake that in because it requires a permission prompt apps need
    // to surface themselves. Return false so callers can branch.
    return false
  },

  async stopRecording() {
    if (hasBridge('audio')) await window.craft!.audio.stopRecording()
  },

  async isRecording() {
    if (hasBridge('audio')) return await window.craft!.audio.isRecording()
    return false
  },
}
