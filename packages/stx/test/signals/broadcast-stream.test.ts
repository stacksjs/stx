import { beforeAll, describe, expect, it } from 'bun:test'
import { useBroadcastStream as moduleStream } from '../../src/composables/use-broadcast-stream'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { STX_RUNTIME_GLOBALS } from '../../src/runtime-globals'

beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

for (const name of ['module', 'runtime'] as const) {
  describe(`authenticated broadcast stream (${name})`, () => {
    it('reads split frames and closes without reconnecting', async () => {
      const useBroadcastStream: typeof moduleStream = name === 'module'
        ? moduleStream
        : (globalThis as unknown as { window: { stx: { useBroadcastStream: typeof moduleStream } } }).window.stx.useBroadcastStream
      expect(typeof useBroadcastStream).toBe('function')
      expect(STX_RUNTIME_GLOBALS).toContain('useBroadcastStream')
      let requests = 0
      let signal: AbortSignal | undefined
      let received!: (frame: unknown) => void
      const message = new Promise(resolve => { received = resolve })
      const encoder = new TextEncoder()
      const statuses: boolean[] = []
      const stream = useBroadcastStream({
        endpoint: '/notifications/events', reconnectDelay: 5,
        request: async (path, init) => {
          requests++
          expect(path).toBe('/notifications/events')
          expect(init?.cache).toBe('no-store')
          expect(new Headers(init?.headers).get('accept')).toBe('text/event-stream')
          signal = init?.signal as AbortSignal
          return new Response(new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode('data: {"channel":"private.account.7","event":"notifications.'))
              controller.enqueue(encoder.encode('created","data":{"unread":1}}\n\n'))
              controller.close()
            },
          }), { headers: { 'content-type': 'text/event-stream' } })
        },
        onStatus: value => { statuses.push(value) },
        onMessage: frame => { stream.close(); received(frame) },
      })
      try {
        expect(await message).toEqual({ channel: 'private.account.7', event: 'notifications.created', data: { unread: 1 } })
        await Bun.sleep(20)
        expect(signal?.aborted).toBe(true)
        expect(statuses).toContain(true)
        expect(statuses.at(-1)).toBe(false)
        expect(requests).toBe(1)
      }
      finally { stream.close() }
    })
  })
}
