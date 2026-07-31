import { describe, expect, test } from 'bun:test'
import { shouldLogBundlerDiagnostics } from '../../src/client-script-bundler'

describe('client script bundler diagnostics', () => {
  test('keeps routine diagnostics opt-in', () => {
    expect(shouldLogBundlerDiagnostics({})).toBe(false)
    expect(shouldLogBundlerDiagnostics({ STX_DEBUG: 'false' })).toBe(false)
  })

  test('supports the documented STX_DEBUG values', () => {
    expect(shouldLogBundlerDiagnostics({ STX_DEBUG: 'true' })).toBe(true)
    expect(shouldLogBundlerDiagnostics({ STX_DEBUG: '1' })).toBe(true)
  })
})
