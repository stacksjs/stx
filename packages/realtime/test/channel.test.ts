import { describe, expect, test } from 'bun:test'
import type { ChannelMessage } from '../src/types'
import { Channel, createChannel } from '../src/channel'

describe('Channel', () => {
  test('should create a channel with name', () => {
    const ch = new Channel({ name: 'test' })
    expect(ch.name).toBe('test')
    expect(ch.private).toBe(false)
  })

  test('should create a private channel', () => {
    const ch = new Channel({ name: 'secret', private: true })
    expect(ch.private).toBe(true)
  })

  test('on() should register a listener and emit should call it', () => {
    const ch = createChannel('test')
    const received: string[] = []

    ch.on<string>('msg', (message) => {
      received.push(message.data)
    })

    ch.emit('msg', 'hello')
    expect(received).toEqual(['hello'])
  })

  test('on() should return an unsubscribe function', () => {
    const ch = createChannel('test')
    const received: string[] = []

    const unsub = ch.on<string>('msg', (message) => {
      received.push(message.data)
    })

    ch.emit('msg', 'first')
    unsub()
    ch.emit('msg', 'second')

    expect(received).toEqual(['first'])
  })

  test('off() should remove a specific handler', () => {
    const ch = createChannel('test')
    const received: string[] = []

    const handler = (message: ChannelMessage<string>) => {
      received.push(message.data)
    }

    ch.on('msg', handler)
    ch.emit('msg', 'first')
    ch.off('msg', handler)
    ch.emit('msg', 'second')

    expect(received).toEqual(['first'])
  })

  test('off() without handler should remove all handlers for event', () => {
    const ch = createChannel('test')
    let count = 0

    ch.on('msg', () => { count++ })
    ch.on('msg', () => { count++ })

    ch.emit('msg', null)
    expect(count).toBe(2)

    ch.off('msg')
    ch.emit('msg', null)
    expect(count).toBe(2)
  })

  test('multiple listeners on same event', () => {
    const ch = createChannel('test')
    const results: number[] = []

    ch.on('msg', () => results.push(1))
    ch.on('msg', () => results.push(2))
    ch.on('msg', () => results.push(3))

    ch.emit('msg', null)
    expect(results).toEqual([1, 2, 3])
  })

  test('once() should fire handler only once', () => {
    const ch = createChannel('test')
    let count = 0

    ch.once('msg', () => { count++ })

    ch.emit('msg', null)
    ch.emit('msg', null)
    ch.emit('msg', null)

    expect(count).toBe(1)
  })

  test('once() should return an unsubscribe function', () => {
    const ch = createChannel('test')
    let count = 0

    const unsub = ch.once('msg', () => { count++ })
    unsub()

    ch.emit('msg', null)
    expect(count).toBe(0)
  })

  test('listenerCount() for specific event', () => {
    const ch = createChannel('test')

    ch.on('a', () => {})
    ch.on('a', () => {})
    ch.on('b', () => {})

    expect(ch.listenerCount('a')).toBe(2)
    expect(ch.listenerCount('b')).toBe(1)
    expect(ch.listenerCount('c')).toBe(0)
  })

  test('listenerCount() without event returns total', () => {
    const ch = createChannel('test')

    ch.on('a', () => {})
    ch.on('a', () => {})
    ch.on('b', () => {})

    expect(ch.listenerCount()).toBe(3)
  })

  test('removeAllListeners() for specific event', () => {
    const ch = createChannel('test')

    ch.on('a', () => {})
    ch.on('b', () => {})

    ch.removeAllListeners('a')

    expect(ch.listenerCount('a')).toBe(0)
    expect(ch.listenerCount('b')).toBe(1)
  })

  test('removeAllListeners() without event removes all', () => {
    const ch = createChannel('test')

    ch.on('a', () => {})
    ch.on('b', () => {})

    ch.removeAllListeners()

    expect(ch.listenerCount()).toBe(0)
  })

  test('destroy() clears all listeners', () => {
    const ch = createChannel('test')

    ch.on('a', () => {})
    ch.on('b', () => {})

    ch.destroy()

    expect(ch.listenerCount()).toBe(0)
  })

  test('emit with no listeners does not throw', () => {
    const ch = createChannel('test')
    expect(() => ch.emit('nonexistent', 'data')).not.toThrow()
  })

  test('emit includes correct message shape', () => {
    const ch = createChannel('my-channel')
    let received: ChannelMessage<string> | null = null

    ch.on<string>('test', (msg) => {
      received = msg
    })

    ch.emit('test', 'payload')

    expect(received).not.toBeNull()
    expect(received!.event).toBe('test')
    expect(received!.data).toBe('payload')
    expect(received!.channel).toBe('my-channel')
    expect(typeof received!.timestamp).toBe('number')
  })

  test('maxListeners should throw when exceeded', () => {
    const ch = new Channel({ name: 'test', maxListeners: 2 })

    ch.on('msg', () => {})
    ch.on('msg', () => {})

    expect(() => ch.on('msg', () => {})).toThrow('Max listeners')
  })

  test('maxListeners applies per event', () => {
    const ch = new Channel({ name: 'test', maxListeners: 1 })

    ch.on('a', () => {})
    ch.on('b', () => {})

    // Each event has 1 listener, which is at the max
    expect(() => ch.on('a', () => {})).toThrow('Max listeners')
  })

  test('duplicate listener reference is ignored by Set', () => {
    const ch = createChannel('test')
    const handler = () => {}

    ch.on('msg', handler)
    ch.on('msg', handler)

    expect(ch.listenerCount('msg')).toBe(1)
  })

  test('createChannel helper', () => {
    const ch = createChannel('helpers', { private: true })
    expect(ch.name).toBe('helpers')
    expect(ch.private).toBe(true)
  })
})
