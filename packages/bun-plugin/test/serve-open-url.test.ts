import { describe, expect, it } from 'bun:test'
import { resolveServeOpenUrl } from '../src/serve'

describe('serve browser open URL', () => {
  it('opens the root path by default', () => {
    expect(resolveServeOpenUrl(3000)).toBe('http://localhost:3000/')
  })

  it('opens a configured application path', () => {
    expect(resolveServeOpenUrl(3000, '/composer?draft=1')).toBe('http://localhost:3000/composer?draft=1')
  })

  it('does not allow an external open target', () => {
    expect(resolveServeOpenUrl(3000, 'https://example.com/phishing')).toBe('http://localhost:3000/')
  })
})
