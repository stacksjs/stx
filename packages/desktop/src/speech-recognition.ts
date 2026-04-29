/**
 * Speech-to-text via `SFSpeechRecognizer`.
 *
 * Apps call `start()` to begin capturing microphone input; partial
 * transcripts arrive on `craft:speechRecognition:partial` while the
 * user speaks, and a final transcript arrives on
 * `craft:speechRecognition:final` once the recognizer settles.
 *
 * **Required Info.plist keys**:
 *   - `NSMicrophoneUsageDescription`        — for AVAudioEngine input
 *   - `NSSpeechRecognitionUsageDescription` — for the recognizer
 *
 * Without both, the system rejects the request and `isAvailable()`
 * returns false.
 */

import { hasBridge, onCraftEvent } from './_bridge'

export interface SpeechRecognitionStartOptions {
  /** BCP-47 language code (e.g. `en-US`). Defaults to system locale. */
  language?: string
  /** Emit partial transcripts while the user is still speaking. */
  partialResults?: boolean
}

export interface SpeechRecognitionAPI {
  /** True if the recognizer is enrolled, authorized, and online. */
  isAvailable: () => Promise<boolean>
  /** Begin listening. Resolves when the audio session is established. */
  start: (opts?: SpeechRecognitionStartOptions) => Promise<{ started: boolean, reason?: string }>
  /** Stop listening; the recognizer flushes the final transcript. */
  stop: () => Promise<void>
  /** Subscribe to partial transcripts (only when `partialResults: true`). */
  onPartial: (cb: (e: { transcript: string }) => void) => () => void
  /** Subscribe to the final transcript per session. */
  onFinal: (cb: (e: { transcript: string }) => void) => () => void
}

export const speechRecognition: SpeechRecognitionAPI = {
  async isAvailable() {
    if (!hasBridge('speechRecognition')) return false
    return await window.craft!.speechRecognition.isAvailable()
  },
  async start(opts) {
    if (!hasBridge('speechRecognition')) return { started: false, reason: 'bridge unavailable' }
    return await window.craft!.speechRecognition.start(opts)
  },
  async stop() { if (hasBridge('speechRecognition')) await window.craft!.speechRecognition.stop() },
  onPartial(cb) { return onCraftEvent<{ transcript: string }>('craft:speechRecognition:partial', cb) },
  onFinal(cb) { return onCraftEvent<{ transcript: string }>('craft:speechRecognition:final', cb) },
}
