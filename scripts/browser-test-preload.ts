import { beforeAll } from 'bun:test'
import { prepareTestBrowser } from '../packages/stx/test-utils/browser-readiness'

// Explicit CI prerequisite, once per test process. Individual tests retain
// their existing navigation/evaluation deadlines and their own real assertions.
beforeAll(async () => {
  const started = performance.now()
  await prepareTestBrowser()
  console.info(`[browser readiness] renderer qualified in ${Math.round(performance.now() - started)}ms`)
}, 30_000)
