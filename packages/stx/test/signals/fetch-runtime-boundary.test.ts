import { describe, expect, it } from 'bun:test'
import { signalsFetchRuntime } from '../../src/client/signals-fetch-runtime'
import { clearServerData, readHydratedData } from '../../src/composables/use-fetch'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals fetch runtime boundary', () => {
  it('assembles the fetch fragment exactly once', () => {
    const fragment = signalsFetchRuntime(readHydratedData.toString(), clearServerData.toString())
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(fragment)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(fragment, first + 1)).toBe(-1)
  })

  it('embeds hydration helpers supplied by the assembler', () => {
    const fragment = signalsFetchRuntime('function readProbe() {}', 'function clearProbe() {}')

    expect(fragment).toContain('var readHydratedData = function readProbe() {};')
    expect(fragment).toContain('var clearServerData = function clearProbe() {};')
  })
})
