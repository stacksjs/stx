import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

interface SocketHandler {
  (event?: any): void
}

class MockWebSocket {
  static OPEN = 1
  static instances: MockWebSocket[] = []

  readyState = 0
  sent: string[] = []
  onopen: SocketHandler | null = null
  onmessage: SocketHandler | null = null
  onerror: SocketHandler | null = null
  onclose: SocketHandler | null = null

  constructor(public url: string) {
    MockWebSocket.instances.push(this)
  }

  open(): void {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.()
  }

  send(message: string): void {
    this.sent.push(message)
  }

  close(): void {
    this.readyState = 3
    this.onclose?.({ code: 1000 })
  }
}

const originalWebSocket = globalThis.WebSocket

beforeEach(() => {
  MockWebSocket.instances = []
  Object.assign(globalThis, { WebSocket: MockWebSocket })
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

afterEach(() => {
  Object.assign(globalThis, { WebSocket: originalWebSocket })
})

describe('useWebSocket broadcasting protocol', () => {
  it('queues a subscription until the socket opens', () => {
    const client = (window as any).stx.useWebSocket('wss://example.test/ws', { reconnect: false })
    client.subscribe('prediction-markets')
    const socket = MockWebSocket.instances[0]

    expect(socket.sent).toEqual([])
    socket.open()

    expect(socket.sent.map(JSON.parse)).toEqual([
      { event: 'subscribe', channel: 'prediction-markets' },
    ])
  })

  it('uses the ts-broadcasting event field when leaving', () => {
    const client = (window as any).stx.useWebSocket('wss://example.test/ws', { reconnect: false })
    const subscription = client.subscribe('prediction-markets')
    const socket = MockWebSocket.instances[0]
    socket.open()

    subscription.leave()

    expect(socket.sent.map(JSON.parse)).toEqual([
      { event: 'subscribe', channel: 'prediction-markets' },
      { event: 'unsubscribe', channel: 'prediction-markets' },
    ])
  })

  it('restores active subscriptions after reconnecting', () => {
    const client = (window as any).stx.useWebSocket('wss://example.test/ws', { reconnect: false })
    client.subscribe('prediction-markets')
    const firstSocket = MockWebSocket.instances[0]
    firstSocket.open()
    firstSocket.close()

    client.connect()
    const replacementSocket = MockWebSocket.instances[1]
    replacementSocket.open()

    expect(replacementSocket.sent.map(JSON.parse)).toEqual([
      { event: 'subscribe', channel: 'prediction-markets' },
    ])
  })
})
