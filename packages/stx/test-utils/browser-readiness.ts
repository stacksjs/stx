import { WebView } from 'bun'
import { createBrowserFixture, isolatedBrowserBackend } from './browser-fixture'

type FixtureOptions = Parameters<typeof createBrowserFixture>[0]
type ReadinessOptions = Partial<Pick<FixtureOptions, 'createServer' | 'createView'>> & { startupTimeoutMs?: number }

/**
 * Chrome is spawned once per Bun process, not once per page. Qualify its cold
 * startup before running browser cases: otherwise the first case alone pays
 * for loading Chrome and creating its first renderer inside a page deadline.
 * Closing this owned probe leaves Bun's pipe-mode browser available to later
 * views. No ambient browser, persistent profile, retry or assertion is skipped.
 */
export async function prepareTestBrowser(options: ReadinessOptions = {}): Promise<void> {
  const startupTimeoutMs = options.startupTimeoutMs ?? 25_000
  const fixture = createBrowserFixture({
    createServer: options.createServer ?? (() => Bun.serve({
      port: 0,
      hostname: '127.0.0.1',
      fetch: request => new URL(request.url).pathname === '/'
        ? new Response('<!doctype html><html><head><title>STX browser readiness</title><style>#ready{color:rgb(1,2,3)}</style></head><body><div id="ready">ready</div></body></html>', { headers: { 'Content-Type': 'text/html' } })
        : new Response(null, { status: 404 }),
    })),
    createView: options.createView ?? (() => new WebView({ headless: true, backend: isolatedBrowserBackend() })),
    // Startup has one bounded budget. This does not alter page navigation's
    // normal 15s limit or the 25s overall budget of individual browser cases.
    navigationTimeoutMs: startupTimeoutMs,
    overallTimeoutMs: startupTimeoutMs,
  })
  try {
    await fixture.view.navigate(fixture.url)
    const ready = await fixture.view.evaluate(`(() => {
      const node = document.getElementById('ready');
      return document.readyState === 'complete' && document.title === 'STX browser readiness'
        && node?.textContent === 'ready' && getComputedStyle(node).color === 'rgb(1, 2, 3)';
    })()`)
      if (ready !== true) throw new Error('Browser did not render the readiness document correctly')
    }
    catch (error) {
      try { fixture.close() }
      catch { /* Preserve the startup failure, not a secondary cleanup error. */ }
      throw new Error(`Browser startup readiness failed: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
    }
    finally { fixture.close() }
  }
