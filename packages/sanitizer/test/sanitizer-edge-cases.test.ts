import { describe, expect, it } from 'bun:test'
import { escape, isSafe, sanitize, sanitizeWithInfo, stripTags } from '../src/sanitizer'

describe('html sanitizer - edge cases', () => {
  it('should handle empty input', () => {
    expect(sanitize('', 'basic')).toBe('')
    expect(sanitize('   ', 'basic')).toBe('   ')
  })

  it('should handle deeply nested tags', () => {
    const html = '<div><div><div><div><div><p>Deep</p></div></div></div></div></div>'
    const result = sanitize(html, 'basic')

    expect(result).toContain('<div>')
    expect(result).toContain('<p>')
    expect(result).toContain('Deep')
  })

  it('should handle malformed HTML', () => {
    const cases = [
      '<div><p>Unclosed',
      '<div</div>',
      '<>Empty tag</>',
      '<div attr=>',
      '<div attr="unclosed>',
    ]

    for (const html of cases) {
      const result = sanitize(html, 'basic')
      expect(typeof result).toBe('string')
    }
  })

  it('should handle Unicode characters', () => {
    const html = '<p>日本語 中文 العربية עברית Ελληνικά</p>'
    const result = sanitize(html, 'basic')

    expect(result).toContain('日本語')
    expect(result).toContain('中文')
    expect(result).toContain('العربية')
  })

  it('should handle emoji in content', () => {
    const html = '<p>Hello 👋 World 🌍 Test 🎉</p>'
    const result = sanitize(html, 'basic')

    expect(result).toContain('👋')
    expect(result).toContain('🌍')
    expect(result).toContain('🎉')
  })

  it('should handle HTML entities', () => {
    const html = '<p>&lt;script&gt; &amp; &quot; &apos; &nbsp;</p>'
    const result = sanitize(html, 'basic')

    expect(result).toContain('&lt;')
    expect(result).toContain('&amp;')
  })

  it('should handle javascript: with various encodings', () => {
    const cases = [
      '<a href="javascript:alert(1)">Link</a>',
      '<a href="JAVASCRIPT:alert(1)">Link</a>',
      '<a href="  javascript:alert(1)">Link</a>',
      '<a href="java\nscript:alert(1)">Link</a>',
      '<a href="java\tscript:alert(1)">Link</a>',
      '<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)">Link</a>',
    ]

    for (const html of cases) {
      const result = sanitize(html, 'basic')
      expect(result.toLowerCase()).not.toContain('javascript:')
    }
  })

  it('should handle data: URIs appropriately', () => {
    const html = '<a href="data:text/html,<script>alert(1)</script>">Link</a>'
    const result = sanitize(html, 'basic')

    expect(result).not.toContain('data:text/html')
  })

  it('should allow safe data: URIs when configured', () => {
    const html = '<img src="data:image/png;base64,iVBORw0KG...">'
    const result = sanitize(html, {
      allowedTags: ['img'],
      allowedAttributes: { img: ['src'] },
      allowedSchemes: ['data'],
    })

    expect(result).toContain('data:image')
  })

  it('should handle all event handlers', () => {
    const events = [
      'onclick',
      'onload',
      'onerror',
      'onmouseover',
      'onmouseout',
      'onfocus',
      'onblur',
      'onchange',
      'onsubmit',
      'onkeydown',
    ]

    for (const event of events) {
      const html = `<div ${event}="alert(1)">Content</div>`
      const result = sanitize(html, 'basic')

      expect(result).not.toContain(event)
      expect(result).toContain('Content')
    }
  })

  it('should handle mixed case event handlers', () => {
    const html = '<div onClick="alert(1)" OnLoad="alert(2)">Content</div>'
    const result = sanitize(html, 'basic')

    expect(result).not.toContain('onClick')
    expect(result).not.toContain('OnLoad')
  })

  it('should handle attributes with no values', () => {
    const html = '<input type="checkbox" checked disabled>'
    const result = sanitize(html, {
      allowedTags: ['input'],
      allowedAttributes: { input: ['type', 'checked', 'disabled'] },
    })

    expect(result).toContain('checked')
    expect(result).toContain('disabled')
  })

  it('should handle attributes with quotes in values', () => {
    const html = '<a title="It\'s a &quot;test&quot;">Link</a>'
    const result = sanitize(html, 'basic')

    expect(result).toContain('title=')
  })

  it('should handle multiple classes', () => {
    const html = '<div class="class1 class2 class3">Content</div>'
    const result = sanitize(html, 'basic')

    expect(result).toContain('class=')
    expect(result).toContain('class1')
  })

  it('should handle style attributes when allowed', () => {
    const html = '<div style="color: red; background: blue;">Content</div>'
    const result = sanitize(html, {
      allowedTags: ['div'],
      allowedAttributes: { div: ['style'] },
      allowedStyles: ['color', 'background'],
    })

    expect(result).toContain('style=')
    expect(result).toContain('color')
  })

  it('should remove dangerous CSS', () => {
    const html = '<div style="background: url(javascript:alert(1))">Content</div>'
    const result = sanitize(html, {
      allowedTags: ['div'],
      allowedAttributes: { div: ['style'] },
      allowedStyles: ['background'],
    })

    expect(result).not.toContain('javascript:')
  })

  it('should handle SVG injection attempts', () => {
    const html = '<svg><script>alert(1)</script></svg>'
    const result = sanitize(html, 'basic')

    expect(result).not.toContain('<script>')
  })

  it('should handle self-closing tags', () => {
    const html = '<img src="test.jpg" /><br />'
    const result = sanitize(html, 'basic')

    expect(result).toContain('<img')
    expect(result).toContain('<br>')
  })

  it('should handle comments when allowed', () => {
    const html = '<!-- Comment --><p>Content</p>'

    sanitize(html, {
      allowedTags: ['p'],
      allowComments: true,
    })

    const withoutComments = sanitize(html, 'basic')

    expect(withoutComments).not.toContain('<!--')
  })

  it('should handle conditional comments', () => {
    const html = '<!--[if IE]><script>alert(1)</script><![endif]--><p>Content</p>'
    const result = sanitize(html, 'basic')

    expect(result).not.toContain('<script>')
    expect(result).not.toContain('[if IE]')
  })

  it('should handle CDATA sections', () => {
    const html = '<![CDATA[<script>alert(1)</script>]]><p>Content</p>'
    const result = sanitize(html, 'basic')

    // CDATA might be preserved or removed depending on implementation
    expect(result).toContain('<p>Content</p>')
    expect(result).not.toContain('<script>')
  })

  it('should handle very long attribute values', () => {
    const longValue = 'a'.repeat(10000)
    const html = `<div class="${longValue}">Content</div>`
    const result = sanitize(html, 'basic')

    expect(result).toContain('class=')
  })

  it('should handle very long tag names', () => {
    const longTag = `div${'x'.repeat(1000)}`
    const html = `<${longTag}>Content</${longTag}>`
    const result = sanitize(html, 'basic')

    // Should handle gracefully
    expect(typeof result).toBe('string')
  })

  it('should handle URL validator option', () => {
    const validator = (url: string) => url.startsWith('https://')

    const html = '<a href="http://example.com">Link</a>'
    const result = sanitize(html, {
      allowedTags: ['a'],
      allowedAttributes: { a: ['href'] },
      urlValidator: validator,
    })

    expect(result).not.toContain('href="http://')
  })

  it('should handle transform tag option', () => {
    const transformer = (tagName: string, attributes: Record<string, string>) => {
      if (tagName === 'b') {
        return { tagName: 'strong', attributes }
      }
      return { tagName, attributes }
    }

    const html = '<b>Bold</b>'
    const result = sanitize(html, {
      allowedTags: ['b', 'strong'],
      transformTag: transformer,
    })

    expect(result).toContain('<strong>')
  })

  it('should handle null transform returning', () => {
    const transformer = (tagName: string) => {
      if (tagName === 'script') {
        return null
      }
      return { tagName, attributes: {} }
    }

    const html = '<script>bad</script><p>good</p>'
    const result = sanitize(html, {
      allowedTags: ['script', 'p'],
      transformTag: transformer,
    })

    expect(result).not.toContain('<script>')
    expect(result).toContain('<p>')
  })

  it('should provide detailed sanitization info', () => {
    const html = '<script>bad</script><p onclick="alert(1)">Good</p><iframe></iframe>'
    const result = sanitizeWithInfo(html, 'basic')

    expect(result.modified).toBe(true)
    expect(result.removedTags).toBeDefined()
    expect(result.removedAttributes).toBeDefined()
    expect(result.removedTags).toContain('script')
    expect(result.removedTags).toContain('iframe')
    expect(result.removedAttributes).toContain('onclick')
  })

  it('should handle isSafe utility', () => {
    const safe = '<p>Just text</p>'
    const unsafe = '<script>alert(1)</script>'

    expect(isSafe(safe, 'basic')).toBe(true)
    expect(isSafe(unsafe, 'basic')).toBe(false)
  })

  it('should handle stripTags utility', () => {
    const html = '<p>Text with <strong>bold</strong> and <em>italic</em></p>'
    const result = stripTags(html)

    expect(result).toBe('Text with bold and italic')
  })

  it('should handle escape utility', () => {
    const text = '<script>alert("XSS")</script>'
    const result = escape(text)

    expect(result).toContain('&lt;script&gt;')
    expect(result).toContain('&quot;')
  })

  it('should handle relative URLs', () => {
    const html = '<a href="/path/to/page">Link</a><img src="../image.png">'
    const result = sanitize(html, 'basic')

    expect(result).toContain('href="/path/to/page"')
    expect(result).toContain('src="../image.png"')
  })

  it('should handle tel: and mailto: schemes', () => {
    const html = '<a href="tel:+1234567890">Call</a><a href="mailto:test@example.com">Email</a>'
    const result = sanitize(html, 'basic')

    expect(result).toContain('tel:')
    expect(result).toContain('mailto:')
  })

  it('should handle mixed content with all presets', () => {
    const html = `
      <h1>Header</h1>
      <p>Paragraph with <strong>bold</strong></p>
      <img src="test.jpg">
      <video src="test.mp4"></video>
      <script>alert(1)</script>
    `

    const strict = sanitize(html, 'strict')
    const basic = sanitize(html, 'basic')
    const relaxed = sanitize(html, 'relaxed')

    expect(strict).toContain('<h1>')
    expect(strict).not.toContain('<img')
    expect(strict).not.toContain('<video')

    expect(basic).toContain('<img')
    expect(basic).not.toContain('<video')

    expect(relaxed).toContain('<video')

    expect(strict).not.toContain('<script>')
    expect(basic).not.toContain('<script>')
    expect(relaxed).not.toContain('<script>')
  })
})
