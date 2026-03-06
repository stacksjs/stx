import type { ChannelConfig, MessageHandler, PresenceHandler, PresenceState } from './types'
import { Channel } from './channel'

export class PresenceChannel extends Channel {
  members: Map<string, PresenceState>

  constructor(config: ChannelConfig) {
    super({ ...config, presence: true })
    this.members = new Map()
  }

  join(userId: string, data?: Record<string, unknown>): void {
    const member: PresenceState = {
      userId,
      data,
      joinedAt: Date.now(),
    }

    this.members.set(userId, member)
    this.emit('presence:join', member)
    this.emit('presence:update', this.getMembers())
  }

  leave(userId: string): void {
    const member = this.members.get(userId)
    if (!member)
      return

    this.members.delete(userId)
    this.emit('presence:leave', member)
    this.emit('presence:update', this.getMembers())
  }

  getMembers(): PresenceState[] {
    return Array.from(this.members.values())
  }

  getMember(userId: string): PresenceState | undefined {
    return this.members.get(userId)
  }

  isMember(userId: string): boolean {
    return this.members.has(userId)
  }

  count(): number {
    return this.members.size
  }

  onJoin(handler: (member: PresenceState) => void): () => void {
    return this.on('presence:join', ((msg: { data: PresenceState }) => handler(msg.data)) as MessageHandler)
  }

  onLeave(handler: (member: PresenceState) => void): () => void {
    return this.on('presence:leave', ((msg: { data: PresenceState }) => handler(msg.data)) as MessageHandler)
  }

  onUpdate(handler: PresenceHandler): () => void {
    return this.on('presence:update', ((msg: { data: PresenceState[] }) => handler(msg.data)) as MessageHandler)
  }

  override destroy(): void {
    this.members.clear()
    super.destroy()
  }
}
