import { describe, expect, it } from 'bun:test'
import { SIGNALS_HEAD_RUNTIME } from '../../src/client/signals-head-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals head runtime boundary', () => {
  it('assembles the head fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_HEAD_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_HEAD_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps document head and SEO helpers together', () => {
    expect(SIGNALS_HEAD_RUNTIME).toContain('function useHead(config)')
    expect(SIGNALS_HEAD_RUNTIME).toContain('function useSeoMeta(config)')
    expect(SIGNALS_HEAD_RUNTIME).toContain('document.documentElement.setAttribute(hk, hv)')
  })
})
