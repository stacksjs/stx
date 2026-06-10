/**
 * CoreMIDI bindings — list endpoints, send and receive MIDI messages.
 *
 * `listSources()` returns inputs (other apps + hardware sending TO us);
 * `listDestinations()` returns outputs we can send TO. Each entry has
 * a stable `index` for the lifetime of the process — apps pass it back
 * to `send` / `subscribe`.
 *
 * Messages flow as raw bytes (`Uint8Array` / `number[]`); apps that
 * want note-on / note-off / CC parsing can layer that on top.
 *
 * Browser fallback: the Web MIDI API (`navigator.requestMIDIAccess`)
 * exposes the same conceptual surface but a different shape; this
 * module doesn't try to bridge them — apps targeting both should
 * detect and route per-environment.
 */
import { hasBridge, onCraftEvent } from './_bridge'

export interface MIDIEndpoint {
  /** Stable index for the lifetime of the process. */
  index: number
  name: string
}

export interface MIDIMessageEvent {
  /** Source index the message came from. */
  index: number
  /** Raw MIDI bytes (status + 1–2 data bytes for channel messages). */
  data: number[]
}

export interface MIDIAPI {
  listSources: () => Promise<MIDIEndpoint[]>
  listDestinations: () => Promise<MIDIEndpoint[]>
  send: (destinationIndex: number, data: Uint8Array | number[]) => Promise<{ ok: boolean, reason?: string }>
  subscribe: (sourceIndex: number) => Promise<{ ok: boolean, reason?: string }>
  unsubscribe: (sourceIndex: number) => Promise<{ ok: boolean }>
  onMessage: (cb: (event: MIDIMessageEvent) => void) => () => void
}

export const midi: MIDIAPI = {
  async listSources() {
    if (!hasBridge('midi')) return []
    return await window.craft!.midi.listSources()
  },
  async listDestinations() {
    if (!hasBridge('midi')) return []
    return await window.craft!.midi.listDestinations()
  },
  async send(destinationIndex, data) {
    if (!hasBridge('midi')) return { ok: false, reason: 'bridge unavailable' }
    return await window.craft!.midi.send(destinationIndex, data)
  },
  async subscribe(sourceIndex) {
    if (!hasBridge('midi')) return { ok: false, reason: 'bridge unavailable' }
    return await window.craft!.midi.subscribe(sourceIndex)
  },
  async unsubscribe(sourceIndex) {
    if (!hasBridge('midi')) return { ok: false }
    return await window.craft!.midi.unsubscribe(sourceIndex)
  },
  onMessage(cb) { return onCraftEvent<MIDIMessageEvent>('craft:midi:message', cb) },
}
