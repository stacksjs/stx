import { prepareTestBrowser } from '../packages/stx/test-utils/browser-readiness'

console.info(`Cold browser readiness: Bun ${Bun.version}, ${process.platform}/${process.arch}`)
const started = performance.now()
await prepareTestBrowser()
console.info(`Rendered readiness document in ${Math.round(performance.now() - started)}ms`)
