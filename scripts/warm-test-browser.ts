/**
 * Pay for the browser's cold start before the suite's own startup budget
 * begins, rather than inside it (stacksjs/stx#2160).
 *
 * The readiness probe in `browser-test-preload.ts` allows 25 seconds for
 * Chrome to launch and serve one local document. On a healthy runner that
 * costs about a second; the measured distribution is heavy-tailed, and the
 * tail has breached the budget in the publisher's exact-source gate. In the
 * failing runs Chrome produced no output at all for 19 seconds, where a
 * healthy run has it talking within 1 second and serving the document 0.3
 * seconds later, so the stall sits before the binary executes rather than in
 * the renderer, the navigation lifecycle or HTTP.
 *
 * Running the same probe first, in its own process, puts the executable and
 * its libraries in the page cache so the gate's budget is not spent on disk.
 *
 * This is deliberately NOT a retry and NOT a way to pass the gate: it runs
 * before the suite, it asserts nothing, and it always exits 0. The suite's
 * own probe keeps the only verdict, with its budget, page deadlines and
 * assertions untouched -- a browser that genuinely cannot start still fails
 * there. The duration is printed on every run so the cold cost stays visible
 * and it is possible to tell whether the tail went away or survived.
 */
import { prepareTestBrowser } from '../packages/stx/test-utils/browser-readiness'

const budgetMs = Number(process.env.STX_BROWSER_WARMUP_MS ?? 120_000)
const started = performance.now()
const elapsed = (): number => Math.round(performance.now() - started)

try {
  await prepareTestBrowser({ startupTimeoutMs: budgetMs })
  console.info(`[browser warm-up] cold start qualified in ${elapsed()}ms (budget ${budgetMs}ms)`)
}
catch (error) {
  // Report and continue. The suite's probe is the gate; failing here as well
  // would turn one startup stall into two, and hide nothing either way.
  console.warn(`[browser warm-up] cold start did not qualify in ${elapsed()}ms: ${error instanceof Error ? error.message : String(error)}`)
}
