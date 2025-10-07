import { describe, expect, it } from 'bun:test'
import { escape, isSafe, sanitize, sanitizeWithInfo, stripTags } from '../src/sanitizer'

describe('html sanitizer', () => {
  it('should remove script tags', () => {
    const html = '<p>Hello</p><script>alert("xss")</script>'
    const result = sanitize(html, 'basic')

    expect(result).not.toContain('<script>')
    expect(result).toContain('<p>Hello</p>')
  })

  it('should remove event handlers', () => {
    const html = '<a href="#" onclick="alert(1)">Click</a>'
    const result = sanitize(html, 'basic')

    expect(result).not.toContain('onclick')
    expect(result).toContain('<a')
    expect(result).toContain('Click')
  })

  it('should remove javascript: URLs', () => {
    const html = '<a href="javascript:alert(1)">Click</a>'
    const result = sanitize(html, 'basic')

    expect(result).not.toContain('javascript:')
  })

  it('should allow safe HTML with basic preset', () => {
    const html = '<p>Hello <strong>world</strong></p>'
    const result = sanitize(html, 'basic')

    expect(result).toContain('<p>')
    expect(result).toContain('<strong>')
    expect(result).toContain('Hello')
    expect(result).toContain('world')
  })

  it('should allow images with basic preset', () => {
    const html = '<img src="test.jpg" alt="Test">'
    const result = sanitize(html, 'basic')

    expect(result).toContain('<img')
    expect(result).toContain('src="test.jpg"')
    expect(result).toContain('alt="Test"')
  })

  it('should allow links with basic preset', () => {
    const html = '<a href="https://example.com">Link</a>'
    const result = sanitize(html, 'basic')

    expect(result).toContain('<a')
    expect(result).toContain('href="https://example.com"')
  })

  it('should remove iframe tags', () => {
    const html = '<iframe src="evil.com"></iframe>'
    const result = sanitize(html, 'basic')

    expect(result).not.toContain('<iframe')
  })

  it('should remove style tags', () => {
    const html = '<style>body { background: red; }</style>'
    const result = sanitize(html, 'basic')

    expect(result).not.toContain('<style')
  })

  it('should strip all tags when using stripTags', () => {
    const html = '<p>Hello <strong>world</strong></p>'
    const result = stripTags(html)

    expect(result).toBe('Hello world')
  })

  it('should escape HTML entities', () => {
    const text = '<script>alert("test")</script>'
    const result = escape(text)

    expect(result).toContain('&lt;script&gt;')
    expect(result).not.toContain('<script>')
  })

  it('should detect safe HTML', () => {
    const safeHtml = '<p>Hello</p>'
    const unsafeHtml = '<script>alert(1)</script>'

    expect(isSafe(safeHtml, 'basic')).toBe(true)
    expect(isSafe(unsafeHtml, 'basic')).toBe(false)
  })

  it('should provide detailed sanitization info', () => {
    const html = '<script>bad</script><p onclick="alert(1)">Good</p>'
    const result = sanitizeWithInfo(html, 'basic')

    expect(result.modified).toBe(true)
    expect(result.removedTags).toContain('script')
    expect(result.removedAttributes).toContain('onclick')
  })

  it('should handle data attributes when allowed', () => {
    const html = '<div data-id="123">Content</div>'
    const result = sanitize(html, {
      allowedTags: ['div'],
      allowDataAttributes: true,
      allowedAttributes: { '*': [] },
    })

    expect(result).toContain('data-id="123"')
  })

  it('should remove data attributes when not allowed', () => {
    const html = '<div data-id="123">Content</div>'
    const result = sanitize(html, {
      allowedTags: ['div'],
      allowDataAttributes: false,
      allowedAttributes: { '*': [] },
    })

    expect(result).not.toContain('data-id')
  })

  it('should preserve aria attributes', () => {
    const html = '<button aria-label="Close">X</button>'
    const result = sanitize(html, {
      allowedTags: ['button'],
      allowAriaAttributes: true,
      allowedAttributes: { '*': [] },
    })

    expect(result).toContain('aria-label="Close"')
  })

  it('should handle strict preset', () => {
    const html = '<p>Text</p><img src="test.jpg"><a href="#">Link</a>'
    const result = sanitize(html, 'strict')

    expect(result).toContain('<p>')
    expect(result).not.toContain('<img')
    expect(result).not.toContain('<a')
  })

  it('should handle relaxed preset', () => {
    const html = '<video src="video.mp4"></video>'
    const result = sanitize(html, 'relaxed')

    expect(result).toContain('<video')
  })

  it('should handle markdown preset for task lists', () => {
    const html = '<input type="checkbox" checked disabled> Task'
    const result = sanitize(html, 'markdown')

    expect(result).toContain('<input')
    expect(result).toContain('checkbox')
    expect(result).toContain('checked')
  })

  it('should remove HTML comments by default', () => {
    const html = '<!-- Comment --><p>Text</p>'
    const result = sanitize(html, 'basic')

    expect(result).not.toContain('<!--')
    expect(result).toContain('<p>Text</p>')
  })

  it('should validate URLs in href attributes', () => {
    const cases = [
      { html: '<a href="http://example.com">Link</a>', shouldContain: true },
      { html: '<a href="https://example.com">Link</a>', shouldContain: true },
      { html: '<a href="javascript:alert(1)">Link</a>', shouldContain: false },
      { html: '<a href="data:text/html,<script>alert(1)</script>">Link</a>', shouldContain: false },
    ]

    for (const { html, shouldContain } of cases) {
      const result = sanitize(html, 'basic')
      if (shouldContain) {
        expect(result).toContain('href=')
      }
      else {
        expect(result).not.toContain('javascript:')
        expect(result).not.toContain('data:text/html')
      }
    }
  })
})
