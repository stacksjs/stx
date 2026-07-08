import { describe, expect, it } from 'bun:test'
import { generateSignalsRuntime, generateSignalsRuntimeDev } from '../src/signals'

// Regression: the signals runtime is emitted as an inline <script> in the page
// and other passes inject scripts anchored on `<body ...>`. If the runtime
// string itself contains `<body`/`<head` (e.g. in a comment), the `<body>`
// anchored injection matches INSIDE the runtime and splices the setup <script>
// into the middle of it, producing one invalid merged script that never runs —
// so window.stx is never created and NOTHING on the page hydrates. `</script`
// would likewise terminate the inline script early. Keep the runtime free of
// these tokens.
describe('signals runtime — free of injection/embedding-breaking HTML tokens', () => {
  const cases: Array<[string, () => string]> = [
    ['prod', generateSignalsRuntime],
    ['dev', generateSignalsRuntimeDev],
  ]

  for (const [name, gen] of cases) {
    it(`${name} runtime has no <body / <head / </script tokens`, () => {
      const rt = gen()
      expect(rt).not.toMatch(/<body/i)
      expect(rt).not.toMatch(/<head/i)
      expect(rt).not.toMatch(/<\/script/i)
    })
  }
})
