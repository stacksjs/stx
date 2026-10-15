import { describe, expect, it } from 'bun:test'
import { signalsAuthoringRuntime } from '../../src/client/signals-authoring-runtime'
import { createModelSignal } from '../../src/component-model'
import { generateSignalsRuntimeDev } from '../../src/signals'

const authoringRuntime = signalsAuthoringRuntime(createModelSignal.toString())

describe('signals authoring runtime boundary', () => {
  it('assembles the authoring fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(authoringRuntime)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(authoringRuntime, first + 1)).toBe(-1)
  })

  it('keeps component identity, models, props, and listeners together', () => {
    expect(authoringRuntime).toContain('function useId(prefix)')
    expect(authoringRuntime).toContain('function useModel(name, options)')
    expect(authoringRuntime).toContain('function useReactiveProp(name, defaultValue, opts)')
    expect(authoringRuntime).toContain('function useEventListener(event, handler, options)')
  })
})
