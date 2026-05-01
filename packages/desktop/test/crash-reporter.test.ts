import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { crashReporter, redactPII, signPayload } from '../src/crash-reporter'
import { findCall, installMockBridge } from './_mock-bridge'

describe('crashReporter (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['crashReporter'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('report normalizes Error objects', async () => {
    const err = new Error('boom')
    await crashReporter.report(err)
    const c = findCall(bridge.calls, 'crashReporter', 'report')!
    expect(c.args[0]).toBe(err)
  })

  it('report forwards plain CrashReport objects', async () => {
    await crashReporter.report({ message: 'oops', severity: 'warning' })
    const c = findCall(bridge.calls, 'crashReporter', 'report')!
    expect((c.args[0] as any).message).toBe('oops')
  })

  it('flush returns array from native', async () => {
    bridge.whenCalled('crashReporter', 'flush', [
      { timestamp: 1, severity: 'error', message: 'a', source: 'js', stack: '' },
    ])
    const r = await crashReporter.flush()
    expect(r).toHaveLength(1)
    expect(r[0].message).toBe('a')
  })

  it('clear / setEnabled / setUser / setAppVersion forward', async () => {
    await crashReporter.clear()
    await crashReporter.setEnabled(false)
    await crashReporter.setUser('u-1')
    await crashReporter.setAppVersion('1.2.3')
    expect(findCall(bridge.calls, 'crashReporter', 'clear')).toBeDefined()
    expect(findCall(bridge.calls, 'crashReporter', 'setEnabled')).toBeDefined()
    expect(findCall(bridge.calls, 'crashReporter', 'setUser')).toBeDefined()
    expect(findCall(bridge.calls, 'crashReporter', 'setAppVersion')).toBeDefined()
  })

  it('isEnabled returns boolean', async () => {
    bridge.whenCalled('crashReporter', 'isEnabled', true)
    expect(await crashReporter.isEnabled()).toBe(true)
  })
})

describe('crashReporter (no bridge — JS fallback queue)', () => {
  beforeEach(() => {
    delete (window as any).craft
    // Reset the JS-side queue between tests via the public API
    crashReporter.clear()
  })

  it('queues reports up to 64 entries (ring buffer)', async () => {
    for (let i = 0; i < 70; i++) {
      await crashReporter.report({ message: `m${i}` })
    }
    const r = await crashReporter.flush()
    expect(r).toHaveLength(64)
    // Oldest 6 dropped — first remaining should be m6.
    expect(r[0].message).toBe('m6')
  })

  it('Error normalisation pulls message + stack', async () => {
    const err = new Error('boom')
    await crashReporter.report(err)
    const r = await crashReporter.flush()
    expect(r[0].message).toBe('boom')
    expect(r[0].stack).toContain('boom')
  })

  it('respects setEnabled(false)', async () => {
    await crashReporter.setEnabled(false)
    await crashReporter.report({ message: 'should-not-store' })
    expect(await crashReporter.flush()).toHaveLength(0)
    await crashReporter.setEnabled(true)
  })

  it('attachGlobalHandlers wires window.error/unhandledrejection', () => {
    crashReporter.clear()
    const off = crashReporter.attachGlobalHandlers()

    // Synthetic error event (Happy DOM-ish — fire ErrorEvent directly).
    window.dispatchEvent(Object.assign(new Event('error'), {
      message: 'global-error',
      filename: 'a.js',
      lineno: 1,
      colno: 2,
      error: new Error('global-error'),
    }))
    // Microtask drain so async report() landed.
    return Promise.resolve().then(async () => {
      const r = await crashReporter.flush()
      expect(r.length).toBeGreaterThanOrEqual(1)
      expect(r[r.length - 1].message).toBe('global-error')
      off()
    })
  })

  it('user + appVersion get attached to entries', async () => {
    await crashReporter.setUser('alice')
    await crashReporter.setAppVersion('2.0.0')
    await crashReporter.report({ message: 'tagged' })
    const r = await crashReporter.flush()
    expect(r[0].userId).toBe('alice')
    expect(r[0].appVersion).toBe('2.0.0')
  })
})

describe('crashReporter — PII redaction', () => {
  it('redactPII strips email, IPv4, and home paths', () => {
    const out = redactPII({
      timestamp: 0,
      severity: 'error',
      source: 'js',
      message: 'reach me at alice@example.com from 10.0.0.5',
      stack: 'at /Users/alice/secret/file.js:1:1',
    })
    expect(out.message).not.toContain('alice@example.com')
    expect(out.message).toContain('<email>')
    expect(out.message).toContain('<ip>')
    expect(out.stack).not.toContain('/Users/alice')
    expect(out.stack).toContain('/<home>')
  })
})

describe('crashReporter — signPayload', () => {
  it('produces a stable HMAC-SHA256 hex digest', async () => {
    const sig1 = await signPayload('secret', 'hello')
    const sig2 = await signPayload('secret', 'hello')
    expect(sig1).toBe(sig2)
    expect(sig1).toMatch(/^[0-9a-f]{64}$/)
  })

  it('different secrets give different signatures', async () => {
    const a = await signPayload('s1', 'body')
    const b = await signPayload('s2', 'body')
    expect(a).not.toBe(b)
  })
})

describe('crashReporter.forwardTo', () => {
  let originalFetch: typeof fetch
  let calls: Array<{ url: string, init: RequestInit }>

  beforeEach(() => {
    delete (window as any).craft
    crashReporter.clear()
    calls = []
    originalFetch = globalThis.fetch
    globalThis.fetch = ((url: string, init: RequestInit) => {
      calls.push({ url, init })
      return Promise.resolve(new Response('', { status: 200 }))
    }) as typeof fetch
    // Use real localStorage from happy-dom; reset key.
    if (typeof localStorage !== 'undefined') localStorage.clear()
  })
  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('drains the queue on flushNow and POSTs entries', async () => {
    await crashReporter.report({ message: 'first' })
    await crashReporter.report({ message: 'second' })
    const handle = crashReporter.forwardTo({ endpoint: 'https://x/y', intervalMs: 0 })
    await handle.flushNow()
    handle.stop()

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://x/y')
    const body = JSON.parse(calls[0].init.body as string)
    expect(body.entries).toHaveLength(2)
  })

  it('redacts PII by default before sending', async () => {
    await crashReporter.report({ message: 'reach me at alice@example.com', stack: '/Users/alice/x.js' })
    const handle = crashReporter.forwardTo({ endpoint: 'https://x/y', intervalMs: 0 })
    await handle.flushNow()
    handle.stop()

    const body = JSON.parse(calls[0].init.body as string)
    expect(body.entries[0].message).toContain('<email>')
    expect(body.entries[0].stack).toContain('/<home>')
  })

  it('attaches HMAC signature header when signingSecret is set', async () => {
    await crashReporter.report({ message: 'sign-me' })
    const handle = crashReporter.forwardTo({ endpoint: 'https://x/y', intervalMs: 0, signingSecret: 'top' })
    await handle.flushNow()
    handle.stop()

    const headers = calls[0].init.headers as Record<string, string>
    expect(headers['X-Craft-Signature']).toMatch(/^[0-9a-f]{64}$/)
  })

  it('persists pending batch on transport failure for next attempt', async () => {
    let attempts = 0
    globalThis.fetch = (() => {
      attempts += 1
      return Promise.reject(new Error('network'))
    }) as typeof fetch

    await crashReporter.report({ message: 'lost' })
    const handle = crashReporter.forwardTo({
      endpoint: 'https://x/y',
      intervalMs: 0,
      maxRetries: 1,
      // Skip backoff sleep — first try then one retry returns control quickly enough.
    })
    await handle.flushNow()

    expect(attempts).toBeGreaterThanOrEqual(2)
    // Pending should contain the dropped batch so a future tick can retry.
    expect(handle.pending().length).toBeGreaterThan(0)
    handle.stop()
  }, 30_000)

  it('drops 4xx responses without retrying', async () => {
    let attempts = 0
    globalThis.fetch = (() => {
      attempts += 1
      return Promise.resolve(new Response('bad', { status: 400 }))
    }) as typeof fetch

    await crashReporter.report({ message: 'rejected' })
    const handle = crashReporter.forwardTo({ endpoint: 'https://x/y', intervalMs: 0 })
    await handle.flushNow()
    handle.stop()

    expect(attempts).toBe(1)
    expect(handle.pending()).toHaveLength(0)
  })

  it('honours custom redact function', async () => {
    await crashReporter.report({ message: 'keep' })
    const handle = crashReporter.forwardTo({
      endpoint: 'https://x/y',
      intervalMs: 0,
      redact: e => ({ ...e, message: `[redacted:${e.message}]` }),
    })
    await handle.flushNow()
    handle.stop()

    const body = JSON.parse(calls[0].init.body as string)
    expect(body.entries[0].message).toBe('[redacted:keep]')
  })

  it('persistKey:null disables localStorage usage', async () => {
    if (typeof localStorage === 'undefined') return
    let attempts = 0
    globalThis.fetch = (() => {
      attempts += 1
      return Promise.reject(new Error('boom'))
    }) as typeof fetch

    await crashReporter.report({ message: 'no-persist' })
    const handle = crashReporter.forwardTo({
      endpoint: 'https://x/y',
      intervalMs: 0,
      persistKey: null,
      maxRetries: 0,
    })
    await handle.flushNow()
    handle.stop()

    expect(attempts).toBe(1)
    // Default key should remain empty.
    expect(localStorage.getItem('craft:crashReporter:pending')).toBeNull()
  })
})
