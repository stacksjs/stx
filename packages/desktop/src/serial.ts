/**
 * Serial-port I/O — for IoT, Arduino, label printers, etc.
 *
 * `list()` enumerates `/dev/cu.*` + `/dev/tty.*` (macOS) or
 * `/dev/ttyUSB*` / `/dev/ttyACM*` / `/dev/ttyS*` (Linux). Apps use
 * the resulting paths to populate "choose device" UIs.
 *
 * Open + read + write needs platform-specific termios setup; the
 * native side stubs those today and returns `ok:false` with a
 * reason. The list is the part most apps need first (the "which
 * device" UI).
 */

import { hasBridge, onCraftEvent } from './_bridge'

export interface SerialPort {
  /** Absolute device path (e.g. `/dev/cu.usbmodem14101`). */
  path: string
}

export interface SerialDataEvent {
  /** Open-handle id returned from `open()`. */
  id: string
  /** Raw bytes received since the last event. */
  data: number[]
}

export interface SerialAPI {
  list: () => Promise<SerialPort[]>
  open: (path: string, baud?: number) => Promise<{ id?: string, ok: boolean, reason?: string }>
  write: (id: string, data: string) => Promise<{ ok: boolean, reason?: string }>
  close: (id: string) => Promise<void>
  onData: (cb: (event: SerialDataEvent) => void) => () => void
}

export const serial: SerialAPI = {
  async list() {
    if (!hasBridge('serial')) return []
    return await window.craft!.serial.list()
  },
  async open(path, baud = 9600) {
    if (!path) throw new Error('serial.open: path is required')
    if (!hasBridge('serial')) return { ok: false, reason: 'bridge unavailable' }
    return await window.craft!.serial.open(path, baud)
  },
  async write(id, data) {
    if (!id) throw new Error('serial.write: id is required')
    if (!hasBridge('serial')) return { ok: false, reason: 'bridge unavailable' }
    return await window.craft!.serial.write(id, data)
  },
  async close(id) {
    if (!hasBridge('serial')) return
    await window.craft!.serial.close(id)
  },
  onData(cb) { return onCraftEvent<SerialDataEvent>('craft:serial:data', cb) },
}
