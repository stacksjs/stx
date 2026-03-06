export interface ChannelConfig {
  name: string
  private?: boolean
  presence?: boolean
  maxListeners?: number
}

export interface BroadcastConfig {
  driver?: 'websocket' | 'sse'
  prefix?: string
  heartbeat?: number // ms, default 30000
}

export interface ChannelMessage<T = unknown> {
  event: string
  data: T
  channel: string
  timestamp: number
  id?: string
}

export interface PresenceState {
  userId: string
  data?: Record<string, unknown>
  joinedAt: number
}

export type MessageHandler<T = unknown> = (message: ChannelMessage<T>) => void
export type PresenceHandler = (members: PresenceState[]) => void
