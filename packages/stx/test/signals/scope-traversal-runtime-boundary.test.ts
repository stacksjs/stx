import { describe, expect, it } from 'bun:test'
import { SIGNALS_SCOPE_TRAVERSAL_RUNTIME } from '../../src/client/signals-scope-traversal-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals scope-traversal runtime boundary', () => {
  it('assembles the scope-traversal fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_SCOPE_TRAVERSAL_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_SCOPE_TRAVERSAL_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps scoped-container skipping and structural dispatch together', () => {
    expect(SIGNALS_SCOPE_TRAVERSAL_RUNTIME).toContain('function processElementSkipScopes(el, processedScopes)')
    expect(SIGNALS_SCOPE_TRAVERSAL_RUNTIME).toContain("el.hasAttribute('data-stx-scope')")
    expect(SIGNALS_SCOPE_TRAVERSAL_RUNTIME).toContain('bindIfChain(ic, componentScope)')
    expect(SIGNALS_SCOPE_TRAVERSAL_RUNTIME).toContain('processElementSkipScopes(child, processedScopes)')
  })
})
