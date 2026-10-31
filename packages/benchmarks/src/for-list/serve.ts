/**
 * Serves the `:for` benchmark page, built from the CURRENT runtime source on
 * every request so an edit shows up on reload.
 *
 *   bun run packages/benchmarks/src/for-list/serve.ts [port]
 *
 * Query: ?row=simple|todo  ?scope=<extra scope names>  ?prof=1 (exclusive timers).
 * Open http://127.0.0.1:<port>/ in a browser and run, in its console:
 *   JSON.stringify(window.bench.run(60))      // or 1000
 *   window.bench.mutations(60)
 *   window.bench.profile(60)                  // with ?prof=1
 */
import { benchPage } from './page'

const port = Number(process.argv[2] || 3911)
Bun.serve({
  port,
  hostname: '127.0.0.1',
  fetch: req => new Response(benchPage(new URL(req.url).search), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }),
})
console.log(`for-list benchmark on http://127.0.0.1:${port}/`)
