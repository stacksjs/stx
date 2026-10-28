import { describe, expect, it } from 'bun:test'
import { createBrowserFixture, isolatedBrowserBackend } from '../test-utils/browser-fixture'

function resources() {
  const calls = { closed: 0, stopped: 0, reads: 0 }
  const server = { url: new URL('http://127.0.0.1:12345'), stop() { calls.stopped++ } }
  const view = {
    async navigate() {},
    async evaluate(): Promise<unknown> { calls.reads++; return { ready: true } },
    close() { calls.closed++ },
  }
  return { calls, server, view }
}

describe('bounded browser fixture', () => {
  it('owns Chrome on Linux/Windows and preserves WebKit on macOS unless requested', () => {
    expect(isolatedBrowserBackend('linux', '')).toEqual({ type: 'chrome', url: false })
    expect(isolatedBrowserBackend('win32', undefined)).toEqual({ type: 'chrome', url: false })
    expect(isolatedBrowserBackend('darwin', '')).toBeUndefined()
    expect(isolatedBrowserBackend('darwin', 'chrome')).toEqual({ type: 'chrome', url: false })
  })

  it('closes its server when constructing the browser fails', () => {
    const { calls, server } = resources()
    const error = new Error('Browser unavailable')
    expect(() => createBrowserFixture({ createServer: () => server, createView() { throw error } })).toThrow(error)
    expect(calls.stopped).toBe(1)
  })

  it('closes a stalled navigation and its real HTTP listener before the test timeout', async () => {
    const { calls, view } = resources()
    view.navigate = () => new Promise(() => {})
    const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: () => new Response('fixture') })
    const fixture = createBrowserFixture({ createServer: () => server, createView: () => view, navigationTimeoutMs: 20 })
    try {
      expect((await fetch(fixture.url)).status).toBe(200)
      await expect(fixture.view.navigate(fixture.url)).rejects.toThrow('Browser navigation timed out')
      expect(calls.closed).toBe(1)
      await expect(fetch(fixture.url)).rejects.toThrow()
      fixture.close()
      expect(calls.closed).toBe(1)
    }
    finally { fixture.close() }
  }, 1000)

  it('bounds a stuck evaluation and does not let closing it mask the timeout', async () => {
    const { calls, server, view } = resources()
    let rejectNative: (error: Error) => void = () => {}
    view.evaluate = () => new Promise((_resolve, reject) => { rejectNative = reject })
    view.close = () => { calls.closed++; rejectNative(new Error('Native view closed')) }
    const fixture = createBrowserFixture({ createServer: () => server, createView: () => view, evaluationTimeoutMs: 20 })
    await expect(fixture.view.evaluate('snapshot()')).rejects.toThrow('Browser evaluation timed out')
    expect(calls.closed).toBe(1)
    expect(calls.stopped).toBe(1)
    fixture.close()
    expect(calls.stopped).toBe(1)
  }, 1000)

  it('uses the remaining assertion budget for an in-flight snapshot', async () => {
    const { calls, server, view } = resources()
    view.evaluate = () => new Promise(() => {})
    const fixture = createBrowserFixture({ createServer: () => server, createView: () => view, evaluationTimeoutMs: 10_000, assertionTimeoutMs: 20 })
    await expect(fixture.waitFor('snapshot()', () => true)).rejects.toThrow('Browser snapshot timed out')
    expect(calls.closed).toBe(1)
    expect(calls.stopped).toBe(1)
  }, 1000)

  it('returns the last mismatching snapshot when elapsed time expires, without another read', async () => {
    const { calls, server, view } = resources()
    let clock = 0
    view.evaluate = async () => { calls.reads++; return { ready: false } }
    const fixture = createBrowserFixture({
      createServer: () => server, createView: () => view,
      now: () => clock, sleep: async () => { clock += 10_000 },
    })
    try {
      expect(await fixture.waitFor<{ ready: boolean }>('snapshot()', value => value.ready)).toEqual({ ready: false })
      expect(calls.reads).toBe(1)
      expect(calls.closed).toBe(0)
    }
    finally { fixture.close() }
  })

  it('does not hide a native error or skip server cleanup if closing the view also throws', async () => {
    const { calls, server, view } = resources()
    const error = new Error('Native evaluation failed')
    view.evaluate = async () => { throw error }
    view.close = () => { calls.closed++; throw new Error('Secondary cleanup failure') }
    const fixture = createBrowserFixture({ createServer: () => server, createView: () => view })
    await expect(fixture.view.evaluate('bad()')).rejects.toBe(error)
    expect(calls.closed).toBe(1)
    expect(calls.stopped).toBe(1)
  })

  it('keeps polling until a real matching snapshot arrives', async () => {
    const { calls, server, view } = resources()
    let clock = 0
    view.evaluate = async () => ({ ready: ++calls.reads === 3 })
    const fixture = createBrowserFixture({ createServer: () => server, createView: () => view,
      now: () => clock, sleep: async ms => { clock += ms } })
    try {
      expect(await fixture.waitFor<{ ready: boolean }>('snapshot()', value => value.ready)).toEqual({ ready: true })
      expect(calls.reads).toBe(3)
    }
    finally { fixture.close() }
  })

  it('does not reset the overall budget between successful operations', async () => {
    const { calls, server, view } = resources()
    let clock = 0
    const fixture = createBrowserFixture({ createServer: () => server, createView: () => view, now: () => clock })
    expect(await fixture.view.evaluate('snapshot()')).toEqual({ ready: true })
    clock = 25_001
    await expect(fixture.view.evaluate('another()')).rejects.toThrow('exceeded its 25000ms budget')
    expect(calls.reads).toBe(1)
    expect(calls.closed).toBe(1)
    expect(calls.stopped).toBe(1)
  })

  it('caps an in-flight operation by the total budget too', async () => {
    const { calls, server, view } = resources()
    view.navigate = () => new Promise(() => {})
    const fixture = createBrowserFixture({ createServer: () => server, createView: () => view, navigationTimeoutMs: 10_000, overallTimeoutMs: 20 })
    await expect(fixture.view.navigate(fixture.url)).rejects.toThrow('Browser navigation timed out')
    expect(calls.closed).toBe(1)
    expect(calls.stopped).toBe(1)
  }, 1000)

  it('clears settled operation timers and closes both resources exactly once', async () => {
    const { calls, server, view } = resources()
    const fixture = createBrowserFixture({ createServer: () => server, createView: () => view, evaluationTimeoutMs: 20 })
    expect(await fixture.view.evaluate('snapshot()')).toEqual({ ready: true })
    await Bun.sleep(30)
    expect(await fixture.view.evaluate('snapshot()')).toEqual({ ready: true })
    expect(calls.closed).toBe(0)
    fixture.close()
    fixture.close()
    expect(calls.closed).toBe(1)
    expect(calls.stopped).toBe(1)
    await expect(fixture.view.evaluate('snapshot()')).rejects.toThrow('Browser fixture is closed')
  })
})
