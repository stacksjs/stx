import type { BroadcastConfig, MessageHandler } from './types'
import { Channel } from './channel'
import { PresenceChannel } from './presence'

let globalConfig: BroadcastConfig = {
  driver: 'websocket',
  prefix: '',
  heartbeat: 30000,
}

export class BroadcastManager {
  config: BroadcastConfig
  channels: Map<string, Channel>

  constructor(config?: BroadcastConfig) {
    this.config = { ...globalConfig, ...config }
    this.channels = new Map()
  }

  private _prefixedName(name: string): string {
    return this.config.prefix ? `${this.config.prefix}.${name}` : name
  }

  channel(name: string): Channel {
    const key = this._prefixedName(name)
    let ch = this.channels.get(key)
    if (!ch) {
      ch = new Channel({ name: key })
      this.channels.set(key, ch)
    }
    return ch
  }

  private(name: string): Channel {
    const key = this._prefixedName(`private-${name}`)
    let ch = this.channels.get(key)
    if (!ch) {
      ch = new Channel({ name: key, private: true })
      this.channels.set(key, ch)
    }
    return ch
  }

  presence(name: string): PresenceChannel {
    const key = this._prefixedName(`presence-${name}`)
    let ch = this.channels.get(key) as PresenceChannel | undefined
    if (!ch) {
      ch = new PresenceChannel({ name: key, private: true, presence: true })
      this.channels.set(key, ch)
    }
    return ch
  }

  broadcast(channel: string, event: string, data: unknown): void {
    const ch = this.channels.get(this._prefixedName(channel))
    if (ch) {
      ch.emit(event, data)
    }
  }

  disconnect(channel?: string): void {
    if (channel) {
      const key = this._prefixedName(channel)
      const ch = this.channels.get(key)
      if (ch) {
        ch.destroy()
        this.channels.delete(key)
      }
    }
    else {
      for (const ch of this.channels.values()) {
        ch.destroy()
      }
      this.channels.clear()
    }
  }

  getChannels(): string[] {
    return Array.from(this.channels.keys())
  }
}

export function useBroadcast(channelName: string, config?: BroadcastConfig): {
  channel: Channel
  send: (event: string, data: unknown) => void
  on: <T>(event: string, handler: MessageHandler<T>) => () => void
  disconnect: () => void
} {
  const manager = new BroadcastManager(config)
  const channel = manager.channel(channelName)

  return {
    channel,
    send: (event: string, data: unknown) => channel.emit(event, data),
    on: <T>(event: string, handler: MessageHandler<T>) => channel.on(event, handler),
    disconnect: () => manager.disconnect(channelName),
  }
}

export function configureBroadcast(config: BroadcastConfig): void {
  globalConfig = { ...globalConfig, ...config }
}
