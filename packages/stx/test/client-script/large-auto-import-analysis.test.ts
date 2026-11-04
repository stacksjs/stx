import { expect, spyOn, test } from 'bun:test'
import { transformAutoImports } from '../../src/client-script'
import * as literals from '../../src/strip-literals'

// The bounded global analysis cache deliberately refuses oversized bundles.
// One transformation must still analyze each source only once per phase,
// rather than once for every potential ambient helper (HQ native CI).
test('large bundles reuse lexical analysis for the whole auto-import pass', () => {
  const scanner = spyOn(literals, 'stripCommentsAndLiterals')
  try {
    const source = `/*${'large-native-bundle '.repeat(32_000)}*/\nfunction local(delay) { return delay(1) }\nconst value = state(0); await retry(() => value(), 3)`
    const result = transformAutoImports(source)
    expect(result.stxImports).toContain('state')
    expect(result.browserImports).toContain('retry')
    expect(result.browserImports).not.toContain('delay')
    expect(scanner.mock.calls.length).toBeLessThanOrEqual(5)
  }
  finally { scanner.mockRestore() }
}, 60_000)
