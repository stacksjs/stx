import { describe, expect, it } from 'bun:test'
import {
  refDebounced,
  useDebounce,
  useDebounceFn,
  useDebouncedValue,
  useThrottle,
  useThrottleFn,
  useTimeout,
  useTimeoutFn,
} from '../../src/composables/use-timer'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('timer compatibility aliases', () => {
  it('keeps module aliases identical to their STX implementations', () => {
    expect(useDebounceFn).toBe(useDebounce)
    expect(refDebounced).toBe(useDebouncedValue)
    expect(useThrottleFn).toBe(useThrottle)
    expect(useTimeoutFn).toBe(useTimeout)
  })

  it('exposes the same aliases from the generated browser runtime', () => {
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()

    expect(window.stx.useDebounceFn).toBe(window.stx.useDebounce)
    expect(window.stx.refDebounced).toBe(window.stx.useDebouncedValue)
    expect(window.stx.useThrottleFn).toBe(window.stx.useThrottle)
    expect(window.stx.useTimeoutFn).toBe(window.stx.useTimeout)
  })
})
