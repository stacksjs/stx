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
  let loopbackRequests = 0
  // How far startup actually got. A stall before the FIRST loopback request is
  // Chrome launching - measured locally, the process spends about 7s of a 7.5s
  // cold navigate before it asks for the document, and about 0.14s serving it.
  // A stall after one is the renderer or the navigation lifecycle instead.
  let firstLoopbackMs = -1
  const startedAt = performance.now()
  const fixture = createBrowserFixture({
    createServer: options.createServer ?? (() => Bun.serve({
      port: 0,
      hostname: '127.0.0.1',
      fetch: (request) => {
        if (firstLoopbackMs < 0) firstLoopbackMs = Math.round(performance.now() - startedAt)
        loopbackRequests++
        return new URL(request.url).pathname === '/'
          ? new Response('<!doctype html><html><head><title>STX browser readiness</title><style>#ready{color:rgb(1,2,3)}</style></head><body><div id="ready">ready</div></body></html>', { headers: { 'Content-Type': 'text/html' } })
          : new Response(null, { status: 404 })
      },
    })),
    createView: options.createView ?? (() => {
      const backend = isolatedBrowserBackend()
      // The first Chrome owns the process's stderr setting. Retain native
      // startup/crash diagnostics rather than losing them behind a JS timer.
      return new WebView({ headless: true, backend: backend ? { ...backend, stderr: 'inherit' } : { type: 'webkit', stderr: 'inherit' } })
    }),
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
      const reach = loopbackRequests === 0
        ? 'no loopback request, so it stalled before the renderer asked for the document'
        : `loopback requests: ${loopbackRequests}, first after ${firstLoopbackMs}ms, so the document was served and the stall is later`
      throw new Error(`Browser startup readiness failed: ${error instanceof Error ? error.message : String(error)} (Bun ${Bun.version}, ${process.platform}, ${reach})`, { cause: error })
    }
    finally { fixture.close() }
  }
