import { describe, expect, it } from 'bun:test'
import { signalsProcessElementRuntime } from '../../src/client/signals-process-element-runtime'
import { runtimeDirectiveNamesLiteral, runtimeEventRegexLiteral, runtimeHandledXAttrsLiteral } from '../../src/runtime-globals'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals process-element runtime boundary', () => {
  const fragment = signalsProcessElementRuntime(
    runtimeDirectiveNamesLiteral(),
    runtimeEventRegexLiteral(),
    runtimeHandledXAttrsLiteral(),
  )

  it('assembles the element processor exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(fragment)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(fragment, first + 1)).toBe(-1)
  })

  it('keeps structural, attribute, event, and child binding together', () => {
    expect(fragment).toContain('function processElement')
    expect(fragment).toContain('bindFor(el, scope, forAttr)')
    expect(fragment).toContain('getElementAttributes(el).forEach')
    expect(fragment).toContain('stxHost.listen(el, eventName')
    expect(fragment).toContain('children.forEach(function(child)')
  })
})
