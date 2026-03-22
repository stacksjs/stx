/**
 * STX Broadcasting
 *
 * Server-side real-time broadcasting powered by ts-broadcasting.
 * Wraps BroadcastServer and the Broadcast facade into stx's config system,
 * so a single `broadcasting` key in stx.config.ts is all you need.
 *
 * Channel definitions live in `routes/channels.ts` — auto-discovered by the
 * dev-server, just like `routes/api.ts`.
 *
 * @example routes/channels.ts
 * ```ts
 * import type { ChannelRegistrar } from '@stacksjs/stx'
 *
 * export default function ({ channel }: ChannelRegistrar) {
 *   channel('processes', {
 *     interval: 3000,
 *     async data() {
 *       return await getProcesses()
 *     },
 *   })
 *
 *   channel('private-user.{userId}', {
 *     authorize(socket, { userId }) {
 *       return socket.data.user?.id === userId
 *     },
 *   })
 * }
 * ```
 *
 * @example Server-side ad-hoc broadcasting
 * ```ts
 * import { broadcast, toUser } from '@stacksjs/stx'
 *
 * broadcast('chat', 'message.sent', { text: 'Hello!' })
 * toUser(42, 'inbox.updated', { unread: 3 })
 * ```
 */

import {
  Broadcast,
  BroadcastServer,
  type ServerConfig,
} from 'ts-broadcasting'

import type { BroadcastingConfig } from './types/config-types'

// ── Types ──────────────────────────────────────────────────────

export interface ChannelDefinition<T = unknown> {
  /**
   * Event name to broadcast.
   * Defaults to `'<channelName>.updated'` when omitted.
   */
  event?: string

  /**
   * Push interval in ms.
   * When set together with `data()`, the channel auto-broadcasts on this cadence.
   */
  interval?: number

  /**
   * Data provider — called every `interval` ms.
   * The return value is broadcast to all channel subscribers.
   */
  data?: () => T | Promise<T>

  /**
   * Authorization callback for private / presence channels.
   * Return `true` to allow, an object for presence member info, or `false` to deny.
   */
  authorize?: (socket: any, params: Record<string, string>) => boolean | object | Promise<boolean | object>
}

export interface ChannelRegistrar {
  /**
   * Register a broadcast channel.
   *
   * @param name       Channel name (e.g. `'processes'`, `'private-user.{userId}'`)
   * @param definition Channel behaviour — data provider, interval, authorization
   */
  channel: <T = unknown>(name: string, definition: ChannelDefinition<T>) => void
}

// ── Singleton ──────────────────────────────────────────────────

let _server: BroadcastServer | null = null
const _intervals: ReturnType<typeof setInterval>[] = []

/**
 * Get the active BroadcastServer instance (or null if not started).
 */
export function getBroadcastServer(): BroadcastServer | null {
  return _server
}

// ── Lifecycle ──────────────────────────────────────────────────

/**
 * Start the broadcasting WebSocket server.
 *
 * Called automatically by the stx dev-server when `broadcasting.enabled`
 * is true in stx.config.ts. You normally don't need to call this yourself.
 */
export async function startBroadcasting(config: BroadcastingConfig): Promise<BroadcastServer> {
  if (_server) return _server

  const driver = config.driver ?? 'bun'
  const host = config.host ?? '0.0.0.0'
  const port = config.port ?? 6001
  const scheme = config.scheme ?? 'ws'

  const serverConfig: ServerConfig = {
    verbose: config.verbose ?? false,
    driver,
    default: driver,
    connections: {
      [driver]: {
        driver,
        host,
        port,
        scheme,
      },
    },
  }

  _server = new BroadcastServer(serverConfig)
  Broadcast.setServer(_server)

  await _server.start()

  return _server
}

/**
 * Stop the broadcasting server and clean up resources.
 */
export async function stopBroadcasting(): Promise<void> {
  for (const id of _intervals) clearInterval(id)
  _intervals.length = 0
  if (!_server) return
  await _server.stop()
  _server = null
}

/**
 * Load and execute a `routes/channels.ts` file, wiring up every
 * channel definition to the running broadcasting server.
 *
 * Called automatically by the stx dev-server after `startBroadcasting()`.
 */
export async function loadChannels(channelsPath: string): Promise<number> {
  const mod = await import(channelsPath)
  const setup = mod.default ?? mod

  if (typeof setup !== 'function') {
    throw new Error(`routes/channels.ts must export a default function, got ${typeof setup}`)
  }

  let count = 0

  const registrar: ChannelRegistrar = {
    channel<T = unknown>(name: string, def: ChannelDefinition<T>) {
      count++

      // Register authorization when provided
      if (def.authorize && _server) {
        _server.channels.channel(name, def.authorize as any)
      }

      // Start auto-broadcasting when interval + data are provided
      if (def.interval && def.data) {
        const eventName = def.event ?? `${name}.updated`
        const fn = def.data

        const id = setInterval(async () => {
          try {
            const payload = await fn()
            broadcast(name, eventName, payload)
          }
          catch {
            // Don't crash the interval
          }
        }, def.interval)

        _intervals.push(id)
      }
    },
  }

  setup(registrar)

  return count
}

// ── Server-side broadcasting API ───────────────────────────────

let _warnedOnce = false
function isReady(): boolean {
  if (_server) return true
  if (!_warnedOnce) {
    _warnedOnce = true
    console.warn('[stx] broadcast() called before server started — messages will be sent once broadcasting is ready')
  }
  return false
}

/**
 * Broadcast an event to a channel (or multiple channels).
 *
 * @example
 * ```ts
 * broadcast('chat', 'message.sent', { text: 'Hello!' })
 * broadcast(['chat', 'admin'], 'alert', { level: 'warn' })
 * ```
 */
export function broadcast<T = unknown>(
  channels: string | string[],
  event: string,
  data: T,
): void {
  if (!isReady()) return
  Broadcast.send(channels, event, data)
}

/**
 * Register channel authorization (ad-hoc, outside routes/channels.ts).
 */
export { channel } from 'ts-broadcasting'

/**
 * Broadcast to a specific user's private channel.
 *
 * @example
 * ```ts
 * toUser(42, 'notification', { title: 'You have mail' })
 * ```
 */
export function toUser<T = unknown>(
  userId: string | number,
  event: string,
  data: T,
): void {
  if (!isReady()) return
  Broadcast.toUser(userId, event, data)
}

/**
 * Broadcast to multiple users.
 */
export function toUsers<T = unknown>(
  userIds: Array<string | number>,
  event: string,
  data: T,
): void {
  if (!isReady()) return
  Broadcast.toUsers(userIds, event, data)
}

/**
 * Broadcast to a private channel.
 */
export function broadcastPrivate<T = unknown>(
  channelName: string,
  event: string,
  data: T,
): void {
  if (!isReady()) return
  Broadcast.private(channelName, event, data)
}

/**
 * Broadcast to a presence channel.
 */
export function broadcastPresence<T = unknown>(
  channelName: string,
  event: string,
  data: T,
): void {
  if (!isReady()) return
  Broadcast.presence(channelName, event, data)
}

// ── Re-exports for advanced usage ──────────────────────────────

export {
  Broadcast,
  BroadcastServer,
} from 'ts-broadcasting'

export type {
  ServerConfig,
} from 'ts-broadcasting'
