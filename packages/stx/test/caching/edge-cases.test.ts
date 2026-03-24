/**
 * Caching edge case tests - redistributed from bugs/ directory.
 *
 * Covers: Caching Edge Cases from deep-edge-cases.ts and discovered-bugs.ts.
 */
import { describe, expect, it } from 'bun:test'
import { hashFilePath } from '../../src/caching'

describe('Caching Edge Cases', () => {
  it('hashFilePath produces consistent hashes', () => {
    const hash1 = hashFilePath('/path/to/file.stx')
    const hash2 = hashFilePath('/path/to/file.stx')
    expect(hash1).toBe(hash2)
  })

  it('hashFilePath produces different hashes for different paths', () => {
    const hash1 = hashFilePath('/path/to/file1.stx')
    const hash2 = hashFilePath('/path/to/file2.stx')
    expect(hash1).not.toBe(hash2)
  })

  it('hashFilePath returns 16-char hex string', () => {
    const hash = hashFilePath('/some/path/template.stx')
    expect(hash.length).toBe(16)
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true)
  })

  it('hashFilePath handles empty string', () => {
    const hash = hashFilePath('')
    expect(hash.length).toBe(16)
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true)
  })

  it('hashFilePath handles very long paths', () => {
    const longPath = '/a'.repeat(5000) + '.stx'
    const hash = hashFilePath(longPath)
    expect(hash.length).toBe(16)
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true)
  })

  it('hashFilePath handles special characters in path', () => {
    const hash = hashFilePath('/path/with spaces/and-dashes/file (1).stx')
    expect(hash.length).toBe(16)
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true)
  })

  it('hashFilePath handles unicode in path', () => {
    const hash = hashFilePath('/path/\u65E5\u672C\u8A9E/\u30D5\u30A1\u30A4\u30EB.stx')
    expect(hash.length).toBe(16)
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true)
  })
})
