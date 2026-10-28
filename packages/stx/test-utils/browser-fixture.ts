interface BrowserView {
  navigate: (url: string) => Promise<unknown>
  evaluate: (script: string) => Promise<unknown>
  close: () => void
}

interface BrowserServer {
  url: { href: string }
  stop: (force: boolean) => unknown
}

interface BrowserFixtureOptions {
  createServer: () => BrowserServer
  createView: () => BrowserView
  navigationTimeoutMs?: number
  evaluationTimeoutMs?: number
  assertionTimeoutMs?: number
  overallTimeoutMs?: number
  intervalMs?: number
  now?: () => number
  sleep?: (ms: number) => Promise<unknown>
}

/** Never attach a test to an ambient Chrome session (or its permission dialog). */
export function isolatedBrowserBackend(platform = process.platform, browser = process.env.STX_IMAGE_BROWSER) {
  return platform !== 'darwin' || browser === 'chrome' ? { type: 'chrome' as const, url: false as const } : undefined
}

/**
 * Bound native browser operations, not just the number of polling attempts.
 * Bun's test timeout does not cancel a suspended operation or run its finally
 * block. Close both resources before that outer timeout can abandon the test.
 */
export function createBrowserFixture(options: BrowserFixtureOptions) {
  const navigationTimeout = options.navigationTimeoutMs ?? 15_000
  const evaluationTimeout = options.evaluationTimeoutMs ?? 2000
  const assertionTimeout = options.assertionTimeoutMs ?? 3000
  const interval = options.intervalMs ?? 20
  const now = options.now ?? (() => performance.now())
  const sleep = options.sleep ?? (ms => Bun.sleep(ms))
  const overallTimeout = options.overallTimeoutMs ?? 25_000
  const expires = now() + overallTimeout
  let server: BrowserServer | undefined
  let view: BrowserView | undefined
  let closed = false

  function close() {
    if (closed) return
    closed = true
    try { view?.close() }
    finally { server?.stop(true) }
  }

  function fail(error: unknown): never {
    try { close() }
    catch { /* Preserve the failing operation, not a secondary teardown error. */ }
    throw error
  }

  try {
    server = options.createServer()
    view = options.createView()
  }
  catch (error) { fail(error) }

  async function run<T>(phase: string, timeout: number, operation: () => Promise<unknown>): Promise<T> {
    if (closed) throw new Error('Browser fixture is closed')
    const remaining = expires - now()
    if (remaining <= 0) return fail(new Error(`Browser fixture exceeded its ${overallTimeout}ms budget before ${phase}`))
    const limit = Math.min(timeout, remaining)
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      return await Promise.race([
        Promise.resolve().then(operation),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => reject(new Error(`Browser ${phase} timed out after ${Math.ceil(limit)}ms`)), limit)
        }),
      ]) as T
    }
    catch (error) { return fail(error) }
    finally { clearTimeout(timer) }
  }

  return {
    url: server!.url.href,
    view: {
      navigate: (url: string) => run<void>('navigation', navigationTimeout, () => view!.navigate(url)),
      evaluate: <T = unknown>(script: string) => run<T>('evaluation', evaluationTimeout, () => view!.evaluate(script)),
    },
    async waitFor<T>(script: string, matches: (value: T) => boolean): Promise<T> {
      const deadline = now() + assertionTimeout
      const read = () => run<T>('snapshot', Math.max(1, Math.min(evaluationTimeout, deadline - now())), () => view!.evaluate(script))
      let actual = await read()
      while (!matches(actual) && now() < deadline) {
        await sleep(Math.min(interval, deadline - now()))
        if (now() >= deadline) break
        actual = await read()
      }
      // Return the last observed value for the caller's real assertion. Never
      // turn a missed condition into success or issue an unbounded final read.
      return actual
    },
    close,
  }
}
