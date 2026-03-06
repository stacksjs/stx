import { describe, expect, test } from 'bun:test'
import type { PresenceState } from '../src/types'
import { PresenceChannel } from '../src/presence'

describe('PresenceChannel', () => {
  test('should create a presence channel', () => {
    const ch = new PresenceChannel({ name: 'room' })
    expect(ch.name).toBe('room')
    expect(ch.count()).toBe(0)
  })

  test('join adds a member', () => {
    const ch = new PresenceChannel({ name: 'room' })
    ch.join('user1')

    expect(ch.count()).toBe(1)
    expect(ch.isMember('user1')).toBe(true)
  })

  test('join with data', () => {
    const ch = new PresenceChannel({ name: 'room' })
    ch.join('user1', { name: 'Alice' })

    const member = ch.getMember('user1')
    expect(member).toBeDefined()
    expect(member!.userId).toBe('user1')
    expect(member!.data).toEqual({ name: 'Alice' })
    expect(typeof member!.joinedAt).toBe('number')
  })

  test('leave removes a member', () => {
    const ch = new PresenceChannel({ name: 'room' })
    ch.join('user1')
    ch.join('user2')

    ch.leave('user1')

    expect(ch.count()).toBe(1)
    expect(ch.isMember('user1')).toBe(false)
    expect(ch.isMember('user2')).toBe(true)
  })

  test('leave non-existent member does nothing', () => {
    const ch = new PresenceChannel({ name: 'room' })
    expect(() => ch.leave('nobody')).not.toThrow()
  })

  test('getMembers returns all members', () => {
    const ch = new PresenceChannel({ name: 'room' })
    ch.join('user1')
    ch.join('user2')
    ch.join('user3')

    const members = ch.getMembers()
    expect(members.length).toBe(3)
    expect(members.map(m => m.userId).sort()).toEqual(['user1', 'user2', 'user3'])
  })

  test('getMember returns undefined for non-existent user', () => {
    const ch = new PresenceChannel({ name: 'room' })
    expect(ch.getMember('nobody')).toBeUndefined()
  })

  test('isMember returns correct value', () => {
    const ch = new PresenceChannel({ name: 'room' })
    ch.join('user1')

    expect(ch.isMember('user1')).toBe(true)
    expect(ch.isMember('user2')).toBe(false)
  })

  test('onJoin fires when member joins', () => {
    const ch = new PresenceChannel({ name: 'room' })
    const joined: PresenceState[] = []

    ch.onJoin((member) => {
      joined.push(member)
    })

    ch.join('user1', { name: 'Alice' })
    ch.join('user2')

    expect(joined.length).toBe(2)
    expect(joined[0].userId).toBe('user1')
    expect(joined[1].userId).toBe('user2')
  })

  test('onLeave fires when member leaves', () => {
    const ch = new PresenceChannel({ name: 'room' })
    const left: PresenceState[] = []

    ch.onLeave((member) => {
      left.push(member)
    })

    ch.join('user1')
    ch.join('user2')
    ch.leave('user1')

    expect(left.length).toBe(1)
    expect(left[0].userId).toBe('user1')
  })

  test('onUpdate fires with current members list', () => {
    const ch = new PresenceChannel({ name: 'room' })
    const updates: PresenceState[][] = []

    ch.onUpdate((members) => {
      updates.push([...members])
    })

    ch.join('user1')
    ch.join('user2')
    ch.leave('user1')

    // join user1 -> update with [user1]
    // join user2 -> update with [user1, user2]
    // leave user1 -> update with [user2]
    expect(updates.length).toBe(3)
    expect(updates[0].length).toBe(1)
    expect(updates[1].length).toBe(2)
    expect(updates[2].length).toBe(1)
    expect(updates[2][0].userId).toBe('user2')
  })

  test('onJoin returns unsubscribe function', () => {
    const ch = new PresenceChannel({ name: 'room' })
    let count = 0

    const unsub = ch.onJoin(() => { count++ })

    ch.join('user1')
    unsub()
    ch.join('user2')

    expect(count).toBe(1)
  })

  test('onLeave returns unsubscribe function', () => {
    const ch = new PresenceChannel({ name: 'room' })
    let count = 0

    const unsub = ch.onLeave(() => { count++ })

    ch.join('user1')
    ch.leave('user1')
    unsub()
    ch.join('user2')
    ch.leave('user2')

    expect(count).toBe(1)
  })

  test('destroy clears members and listeners', () => {
    const ch = new PresenceChannel({ name: 'room' })
    ch.join('user1')
    ch.join('user2')
    ch.on('custom', () => {})

    ch.destroy()

    expect(ch.count()).toBe(0)
    expect(ch.listenerCount()).toBe(0)
  })

  test('presence channel also works as regular channel', () => {
    const ch = new PresenceChannel({ name: 'room' })
    let received: unknown = null

    ch.on('custom-event', (msg) => {
      received = msg.data
    })

    ch.emit('custom-event', 'hello')
    expect(received).toBe('hello')
  })
})
