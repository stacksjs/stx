import { describe, expect, test } from 'bun:test'
import { BroadcastManager, configureBroadcast, useBroadcast } from '../src/broadcast'
import { PresenceChannel } from '../src/presence'

describe('BroadcastManager', () => {
  test('should create a channel', () => {
    const manager = new BroadcastManager()
    const ch = manager.channel('chat')
    expect(ch.name).toBe('chat')
  })

  test('should reuse existing channel', () => {
    const manager = new BroadcastManager()
    const ch1 = manager.channel('chat')
    const ch2 = manager.channel('chat')
    expect(ch1).toBe(ch2)
  })

  test('should create a private channel', () => {
    const manager = new BroadcastManager()
    const ch = manager.private('secret')
    expect(ch.name).toBe('private-secret')
    expect(ch.private).toBe(true)
  })

  test('should create a presence channel', () => {
    const manager = new BroadcastManager()
    const ch = manager.presence('room')
    expect(ch).toBeInstanceOf(PresenceChannel)
    expect(ch.name).toBe('presence-room')
  })

  test('should apply prefix', () => {
    const manager = new BroadcastManager({ prefix: 'app' })
    const ch = manager.channel('chat')
    expect(ch.name).toBe('app.chat')
  })

  test('broadcast should emit to channel', () => {
    const manager = new BroadcastManager()
    const ch = manager.channel('chat')
    let received: unknown = null

    ch.on('msg', (message) => {
      received = message.data
    })

    manager.broadcast('chat', 'msg', 'hello')
    expect(received).toBe('hello')
  })

  test('broadcast to non-existent channel does not throw', () => {
    const manager = new BroadcastManager()
    expect(() => manager.broadcast('nope', 'msg', 'data')).not.toThrow()
  })

  test('disconnect specific channel', () => {
    const manager = new BroadcastManager()
    manager.channel('a')
    manager.channel('b')

    manager.disconnect('a')

    expect(manager.getChannels()).toEqual(['b'])
  })

  test('disconnect all channels', () => {
    const manager = new BroadcastManager()
    manager.channel('a')
    manager.channel('b')

    manager.disconnect()

    expect(manager.getChannels()).toEqual([])
  })

  test('getChannels returns all channel names', () => {
    const manager = new BroadcastManager()
    manager.channel('a')
    manager.channel('b')
    manager.private('c')

    expect(manager.getChannels()).toEqual(['a', 'b', 'private-c'])
  })
})

describe('useBroadcast', () => {
  test('should return channel, send, on, disconnect', () => {
    const result = useBroadcast('test')
    expect(result.channel).toBeDefined()
    expect(typeof result.send).toBe('function')
    expect(typeof result.on).toBe('function')
    expect(typeof result.disconnect).toBe('function')
  })

  test('send should emit on channel', () => {
    const { on, send } = useBroadcast('test')
    let received: unknown = null

    on('msg', (message) => {
      received = message.data
    })

    send('msg', 'payload')
    expect(received).toBe('payload')
  })

  test('on should return unsubscribe function', () => {
    const { on, send } = useBroadcast('test')
    let count = 0

    const unsub = on('msg', () => { count++ })

    send('msg', null)
    unsub()
    send('msg', null)

    expect(count).toBe(1)
  })

  test('disconnect should clean up', () => {
    const { channel, disconnect, send } = useBroadcast('test')
    let count = 0

    channel.on('msg', () => { count++ })
    send('msg', null)
    disconnect()
    // After disconnect, the channel is destroyed, so further emits are no-ops
    // (listeners were cleared)
    send('msg', null)

    expect(count).toBe(1)
  })
})

describe('configureBroadcast', () => {
  test('should set global config for new managers', () => {
    configureBroadcast({ prefix: 'global', driver: 'sse' })
    const manager = new BroadcastManager()
    expect(manager.config.prefix).toBe('global')
    expect(manager.config.driver).toBe('sse')

    // Reset
    configureBroadcast({ prefix: '', driver: 'websocket' })
  })
})
