import type { ChannelConfig, ChannelMessage, MessageHandler } from './types'

export class Channel {
  name: string
  private: boolean
  listeners: Map<string, Set<MessageHandler>>
  private _maxListeners: number

  constructor(config: ChannelConfig) {
    this.name = config.name
    this.private = config.private ?? false
    this.listeners = new Map()
    this._maxListeners = config.maxListeners ?? 100
  }

  on<T = unknown>(event: string, handler: MessageHandler<T>): () => void {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set()
      this.listeners.set(event, set)
    }

    if (this._maxListeners > 0 && set.size >= this._maxListeners) {
      throw new Error(
        `Max listeners (${this._maxListeners}) reached for event "${event}" on channel "${this.name}"`,
      )
    }

    set.add(handler as MessageHandler)

    return () => {
      this.off(event, handler as MessageHandler)
    }
  }

  off(event: string, handler?: MessageHandler): void {
    if (!handler) {
      this.listeners.delete(event)
      return
    }

    const set = this.listeners.get(event)
    if (set) {
      set.delete(handler)
      if (set.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  emit<T = unknown>(event: string, data: T): void {
    const set = this.listeners.get(event)
    if (!set)
      return

    const message: ChannelMessage<T> = {
      event,
      data,
      channel: this.name,
      timestamp: Date.now(),
    }

    for (const handler of set) {
      (handler as MessageHandler<T>)(message)
    }
  }

  once<T = unknown>(event: string, handler: MessageHandler<T>): () => void {
    const wrapper: MessageHandler<T> = (message) => {
      this.off(event, wrapper as MessageHandler)
      handler(message)
    }

    return this.on(event, wrapper)
  }

  listenerCount(event?: string): number {
    if (event) {
      return this.listeners.get(event)?.size ?? 0
    }

    let total = 0
    for (const set of this.listeners.values()) {
      total += set.size
    }
    return total
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event)
    }
    else {
      this.listeners.clear()
    }
  }

  destroy(): void {
    this.listeners.clear()
  }
}

export function createChannel(name: string, config?: Partial<ChannelConfig>): Channel {
  return new Channel({ name, ...config })
}
