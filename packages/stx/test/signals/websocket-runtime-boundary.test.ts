import { describe, expect, it } from 'bun:test'
import { SIGNALS_WEBSOCKET_RUNTIME } from '../../src/client/signals-websocket-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

function loadWebSocketRuntime(): Record<string, any> {
  const prelude = `
    function state(initial) {
      var value = initial;
      var signal = function() { return value; };
      signal.set = function(next) { value = next; };
      return signal;
    }
    var destroyed;
    function onDestroy(fn) { destroyed = fn; }
  `
  return new Function(`${prelude}\n${SIGNALS_WEBSOCKET_RUNTIME}\nreturn { useWebSocket, destroy: () => destroyed() }`)() as any
}

describe('signals websocket runtime boundary', () => {
  it('assembles the websocket fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_WEBSOCKET_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_WEBSOCKET_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps deferred connections and lifecycle cleanup intact', () => {
    const { useWebSocket, destroy } = loadWebSocketRuntime()
    const socket = useWebSocket('wss://example.test', { immediate: false })

    expect(socket.status()).toBe('CLOSED')
    expect(socket.ws()).toBeNull()
    expect(() => destroy()).not.toThrow()
  })
})
