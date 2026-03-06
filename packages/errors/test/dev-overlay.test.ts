import { describe, expect, test } from 'bun:test'
import { StxError } from '../src/error-types'
import { generateDevOverlay } from '../src/dev-overlay'

describe('generateDevOverlay', () => {
  test('returns valid HTML with error message', () => {
    const error = new Error('Something broke')
    const html = generateDevOverlay(error)

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html')
    expect(html).toContain('</html>')
    expect(html).toContain('Something broke')
  })

  test('includes error name', () => {
    const error = new TypeError('Invalid type')
    const html = generateDevOverlay(error)

    expect(html).toContain('TypeError')
    expect(html).toContain('Invalid type')
  })

  test('includes stack trace by default', () => {
    const error = new Error('test')
    const html = generateDevOverlay(error)

    expect(html).toContain('Stack Trace')
  })

  test('hides stack trace when showStack is false', () => {
    const error = new Error('test')
    const html = generateDevOverlay(error, { showStack: false })

    expect(html).not.toContain('Stack Trace')
  })

  test('shows StxError code', () => {
    const error = new StxError('bad config', { code: 'CONFIG_ERROR' })
    const html = generateDevOverlay(error)

    expect(html).toContain('CONFIG_ERROR')
  })

  test('shows file location for StxError', () => {
    const error = new StxError('parse error', {
      filePath: '/app/template.stx',
      line: 42,
      column: 10,
    })
    const html = generateDevOverlay(error)

    expect(html).toContain('/app/template.stx:42:10')
  })

  test('shows hints for known errors', () => {
    const error = new Error('Cannot find module "foo"')
    const html = generateDevOverlay(error)

    expect(html).toContain('Hint')
    expect(html).toContain('bun install')
  })

  test('shows StxError hint over generic hint', () => {
    const error = new StxError('Cannot find module', { hint: 'Custom hint here' })
    const html = generateDevOverlay(error)

    expect(html).toContain('Custom hint here')
  })

  test('hides hints when showHints is false', () => {
    const error = new Error('Cannot find module "foo"')
    const html = generateDevOverlay(error, { showHints: false })

    expect(html).not.toContain('Hint')
  })

  test('supports light theme', () => {
    const error = new Error('test')
    const html = generateDevOverlay(error, { theme: 'light' })

    expect(html).toContain('#ffffff')
  })

  test('dark theme is default', () => {
    const error = new Error('test')
    const html = generateDevOverlay(error)

    expect(html).toContain('#1a1a2e')
  })

  test('escapes HTML in error messages', () => {
    const error = new Error('<script>alert("xss")</script>')
    const html = generateDevOverlay(error)

    expect(html).not.toContain('<script>alert')
    expect(html).toContain('&lt;script&gt;')
  })
})
