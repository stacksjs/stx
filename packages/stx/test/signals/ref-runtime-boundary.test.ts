import { describe, expect, it } from 'bun:test'
import { SIGNALS_REF_RUNTIME } from '../../src/client/signals-ref-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

function loadUseRef(scope: Record<string, any>): (name: string) => any {
  const prelude = `
    var componentScope = arguments[0];
    function currentLifecycleScope() { return null; }
  `
  return new Function(`${prelude}\n${SIGNALS_REF_RUNTIME}\nreturn useRef`)(scope) as any
}

describe('signals ref runtime boundary', () => {
  it('assembles the ref fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_REF_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_REF_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps callable, current, and value access on the captured scope', () => {
    const scope = { $refs: { dialog: { open: true } } }
    const dialog = loadUseRef(scope)('dialog')
    scope.$refs.dialog = { open: false }

    expect(dialog()).toEqual({ open: false })
    expect(dialog.current).toEqual({ open: false })
    expect(dialog.value).toEqual({ open: false })
  })
})
