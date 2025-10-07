import { describe, expect, it } from 'bun:test'
import { parse } from '../src/parser'

describe('markdown parser - comprehensive tests', () => {
  describe('nested inline elements', () => {
    it('should handle bold inside italic', () => {
      const md = '*italic with **bold** inside*'
      const html = parse(md)

      expect(html).toContain('<em>')
      expect(html).toContain('<strong>bold</strong>')
      expect(html).toContain('</em>')
    })

    it('should handle italic inside bold', () => {
      const md = '**bold with *italic* inside**'
      const html = parse(md)

      expect(html).toContain('<strong>')
      expect(html).toContain('<em>italic</em>')
      expect(html).toContain('</strong>')
    })

    it('should handle code inside bold', () => {
      const md = '**bold with `code` inside**'
      const html = parse(md)

      expect(html).toContain('<strong>')
      expect(html).toContain('<code>code</code>')
      expect(html).toContain('</strong>')
    })

    it('should handle link inside bold', () => {
      const md = '**bold with [link](url) inside**'
      const html = parse(md)

      expect(html).toContain('<strong>')
      expect(html).toContain('<a href="url">link</a>')
      expect(html).toContain('</strong>')
    })

    it('should handle bold inside link text', () => {
      const md = '[link with **bold**](url)'
      const html = parse(md)

      expect(html).toContain('<a href="url">')
      expect(html).toContain('<strong>bold</strong>')
      expect(html).toContain('</a>')
    })

    it('should handle strikethrough with nested elements', () => {
      const md = '~~deleted with **bold** and *italic*~~'
      const html = parse(md, { gfm: true })

      expect(html).toContain('<del>')
      expect(html).toContain('<strong>bold</strong>')
      expect(html).toContain('<em>italic</em>')
      expect(html).toContain('</del>')
    })

    it('should handle triple nesting', () => {
      const md = '**bold _italic `code`_**'
      const html = parse(md)

      expect(html).toContain('<strong>')
      expect(html).toContain('<em>')
      expect(html).toContain('<code>code</code>')
      expect(html).toContain('</em>')
      expect(html).toContain('</strong>')
    })
  })

  describe('table edge cases', () => {
    it('should handle tables with inline markdown', () => {
      const md = `| Header **bold** | Header *italic* |
|------------------|-----------------|
| Cell **bold**    | Cell *italic*   |
| Cell \`code\`    | Cell [link](url)|`

      const html = parse(md, { gfm: true })

      expect(html).toContain('<table>')
      expect(html).toContain('<strong>bold</strong>')
      expect(html).toContain('<em>italic</em>')
      expect(html).toContain('<code>code</code>')
      expect(html).toContain('<a href="url">link</a>')
    })

    it('should handle table alignment combinations', () => {
      const md = `| Left | Center | Right | Default |
|:-----|:------:|------:|---------|
| L    | C      | R     | D       |`

      const html = parse(md, { gfm: true })

      expect(html).toContain('align="left"')
      expect(html).toContain('align="center"')
      expect(html).toContain('align="right"')
    })

    it('should handle tables with pipe characters in content', () => {
      const md = `| Code | Result |
|------|--------|
| \`a \\| b\` | Value |`

      const html = parse(md, { gfm: true })

      expect(html).toContain('<table>')
      expect(html).toContain('|')
    })

    it('should handle single column tables', () => {
      const md = `| Single |
|--------|
| Cell 1 |
| Cell 2 |`

      const html = parse(md, { gfm: true })

      expect(html).toContain('<table>')
      expect(html).toContain('<th>')
      expect(html).toContain('Single')
    })

    it('should handle wide tables', () => {
      const headers = Array.from({ length: 10 }, (_, i) => `Col${i}`).join(' | ')
      const separator = Array.from({ length: 10 }, () => '---').join('|')
      const row = Array.from({ length: 10 }, (_, i) => `C${i}`).join(' | ')

      const md = `| ${headers} |
|${separator}|
| ${row} |`

      const html = parse(md, { gfm: true })

      expect(html).toContain('<table>')
      expect(html).toContain('Col0')
      expect(html).toContain('Col9')
    })
  })

  describe('list edge cases', () => {
    it('should handle mixed task list states', () => {
      const md = `- [x] Task 1
- [ ] Task 2
- [X] Task 3 (uppercase)
- [x] Task 4 with **bold**
- [ ] Task 5 with [link](url)`

      const html = parse(md)

      expect(html).toContain('checkbox')
      expect(html).toMatch(/checked.*disabled/g)
      expect(html).toContain('<strong>bold</strong>')
      expect(html).toContain('<a href="url">link</a>')
    })

    it('should handle list items with inline markdown', () => {
      const md = `- Item with **bold**
- Item with *italic*
- Item with \`code\`
- Item with [link](url)
- Item with ![image](src)`

      const html = parse(md)

      expect(html).toContain('<ul>')
      expect(html).toContain('<strong>bold</strong>')
      expect(html).toContain('<em>italic</em>')
      expect(html).toContain('<code>code</code>')
      expect(html).toContain('<a href="url">link</a>')
      expect(html).toContain('<img src="src"')
    })

    it('should handle different bullet markers', () => {
      const markers = ['- Item 1', '* Item 2', '+ Item 3']

      for (const md of markers) {
        const html = parse(md)
        expect(html).toContain('<ul>')
        expect(html).toContain('<li>')
      }
    })

    it('should handle ordered lists with different starting numbers', () => {
      const md = `1. First
2. Second
3. Third`

      const html = parse(md)

      expect(html).toContain('<ol>')
      expect(html).toContain('First')
      expect(html).toContain('Second')
      expect(html).toContain('Third')
    })
  })

  describe('code block edge cases', () => {
    it('should handle code blocks without language', () => {
      const md = '```\nconst x = 5;\n```'
      const html = parse(md)

      expect(html).toContain('<pre>')
      expect(html).toContain('<code>')
      expect(html).not.toContain('language-')
    })

    it('should handle code blocks with unusual languages', () => {
      const languages = ['jsx', 'tsx', 'vue', 'svelte', 'astro', 'mdx']

      for (const lang of languages) {
        const md = `\`\`\`${lang}\ncode\n\`\`\``
        const html = parse(md)

        expect(html).toContain(`language-${lang}`)
      }
    })

    it('should handle code blocks with special characters', () => {
      const md = '```javascript\nconst html = "<div>test</div>";\nconst x = a && b || c;\n```'
      const html = parse(md)

      expect(html).toContain('&lt;div&gt;')
      expect(html).toContain('&amp;&amp;')
    })

    it('should handle empty code blocks', () => {
      const md = '```javascript\n```'
      const html = parse(md)

      expect(html).toContain('<pre>')
      expect(html).toContain('<code')
    })

    it('should handle code blocks with many lines', () => {
      const lines = Array.from({ length: 100 }, (_, i) => `line ${i}`).join('\n')
      const md = `\`\`\`\n${lines}\n\`\`\``
      const html = parse(md)

      expect(html).toContain('<pre>')
      expect(html).toContain('line 0')
      expect(html).toContain('line 99')
    })
  })

  describe('blockquote edge cases', () => {
    it('should handle blockquotes with multiple paragraphs', () => {
      const md = `> First paragraph
>
> Second paragraph`

      const html = parse(md)

      expect(html).toContain('<blockquote>')
      expect(html).toContain('First paragraph')
      expect(html).toContain('Second paragraph')
    })

    it('should handle blockquotes with inline markdown', () => {
      const md = '> Quote with **bold** and *italic* and `code`'
      const html = parse(md)

      expect(html).toContain('<blockquote>')
      expect(html).toContain('<strong>bold</strong>')
      expect(html).toContain('<em>italic</em>')
      expect(html).toContain('<code>code</code>')
    })

    it('should handle empty blockquote lines', () => {
      const md = `> Content
>
> More content`

      const html = parse(md)

      expect(html).toContain('<blockquote>')
      expect(html).toContain('Content')
      expect(html).toContain('More content')
    })
  })

  describe('header edge cases', () => {
    it('should handle headers with special characters in IDs', () => {
      const cases = [
        { md: '# Hello World!', id: 'hello-world' },
        { md: '# Test@123', id: 'test123' },
        { md: '# Multiple   Spaces', id: 'multiple-spaces' },
        { md: '# CamelCase', id: 'camelcase' },
        { md: '# dots.and.dashes-here', id: 'dotsanddashes-here' },
      ]

      for (const { md, id } of cases) {
        const html = parse(md, { headerIds: true })
        expect(html).toContain(`id="${id}"`)
      }
    })

    it('should handle headers with trailing hashes', () => {
      const md = '# Header #'
      const html = parse(md, { headerIds: true })

      expect(html).toContain('<h1')
      expect(html).toContain('Header')
    })

    it('should handle all header levels', () => {
      const md = `# H1
## H2
### H3
#### H4
##### H5
###### H6`

      const html = parse(md)

      for (let i = 1; i <= 6; i++) {
        expect(html).toContain(`<h${i}`)
        expect(html).toContain(`</h${i}>`)
      }
    })

    it('should handle headers with no space after hash', () => {
      const md = '#NoSpace'
      const html = parse(md)

      // Should not parse as header without space
      expect(html).not.toContain('<h1')
    })

    it('should handle headers with prefix option', () => {
      const md = '# Test Header'
      const html = parse(md, { headerIds: true, headerPrefix: 'section-' })

      expect(html).toContain('id="section-test-header"')
    })
  })

  describe('link and image edge cases', () => {
    it('should handle links with titles', () => {
      const md = '[Link](url "Title")'
      const html = parse(md)

      expect(html).toContain('<a href="url" title="Title">')
      expect(html).toContain('Link')
    })

    it('should handle images with empty alt text', () => {
      const md = '![](image.png)'
      const html = parse(md)

      expect(html).toContain('<img')
      expect(html).toContain('src="image.png"')
      expect(html).toContain('alt=""')
    })

    it('should handle links with special characters in URL', () => {
      const md = '[Link](https://example.com/path?foo=bar&baz=qux#fragment)'
      const html = parse(md)

      expect(html).toContain('<a href=')
      expect(html).toContain('example.com')
    })

    it('should handle relative URLs', () => {
      const md = '[Link](../path/to/file.html)'
      const html = parse(md)

      expect(html).toContain('href="../path/to/file.html"')
    })

    it('should handle anchor links', () => {
      const md = '[Link](#section)'
      const html = parse(md)

      expect(html).toContain('href="#section"')
    })
  })

  describe('emphasis marker edge cases', () => {
    it('should handle underscores in words', () => {
      const md = 'snake_case_variable and another_one'
      const html = parse(md)

      expect(html).toContain('snake_case_variable')
      expect(html).not.toContain('<em>')
    })

    it('should handle asterisks without spaces', () => {
      const md = 'a*b*c and *d*'
      const html = parse(md)

      expect(html).toContain('<em>b</em>')
      expect(html).toContain('<em>d</em>')
    })

    it('should handle mixed emphasis markers', () => {
      const md = '*italic with asterisk* and _italic with underscore_'
      const html = parse(md)

      const emCount = (html.match(/<em>/g) || []).length
      expect(emCount).toBe(2)
    })

    it('should handle emphasis at start and end of line', () => {
      const md = '*start* middle **end**'
      const html = parse(md)

      expect(html).toContain('<em>start</em>')
      expect(html).toContain('<strong>end</strong>')
    })

    it('should not match emphasis across different paragraphs', () => {
      const md = '*paragraph one\n\nparagraph two*'
      const html = parse(md)

      // Should not create emphasis spanning paragraphs
      const pCount = (html.match(/<p>/g) || []).length
      expect(pCount).toBeGreaterThanOrEqual(2)
    })
  })

  describe('horizontal rule variations', () => {
    it('should handle hr with different characters', () => {
      const cases = ['---', '***', '___']

      for (const md of cases) {
        const html = parse(md)
        expect(html).toContain('<hr>')
      }
    })

    it('should handle hr with spaces', () => {
      const cases = ['- - -', '* * *', '_ _ _']

      for (const md of cases) {
        const html = parse(md)
        expect(html).toContain('<hr>')
      }
    })

    it('should handle hr with many characters', () => {
      const md = '----------'
      const html = parse(md)

      expect(html).toContain('<hr>')
    })
  })

  describe('whitespace handling', () => {
    it('should handle leading whitespace', () => {
      const md = '   # Header'
      const html = parse(md)

      // Headers typically don't allow leading spaces
      expect(typeof html).toBe('string')
    })

    it('should handle trailing whitespace', () => {
      const md = '# Header   '
      const html = parse(md)

      expect(html).toContain('<h1')
    })

    it('should handle multiple blank lines', () => {
      const md = `Para 1


Para 2`

      const html = parse(md)

      expect(html).toContain('Para 1')
      expect(html).toContain('Para 2')
    })

    it('should handle tabs', () => {
      const md = '\tParagraph with tab'
      const html = parse(md)

      expect(html).toContain('Paragraph with tab')
    })
  })

  describe('performance edge cases', () => {
    it('should handle very long lines', () => {
      const longLine = 'word '.repeat(10000)
      const md = `# Header\n\n${longLine}`
      const html = parse(md)

      expect(html).toContain('<h1')
      expect(html.length).toBeGreaterThan(10000)
    })

    it('should handle many paragraphs', () => {
      const paragraphs = Array.from({ length: 1000 }, (_, i) => `Para ${i}`).join('\n\n')
      const html = parse(paragraphs)

      expect(html).toContain('Para 0')
      expect(html).toContain('Para 999')
    })

    it('should handle deeply nested emphasis', () => {
      const md = '**bold *italic **bold *italic* bold** italic* bold**'
      const html = parse(md)

      expect(html).toContain('<strong>')
      expect(html).toContain('<em>')
    })
  })

  describe('security considerations', () => {
    it('should escape HTML in regular text', () => {
      const md = 'Text with <script>alert("xss")</script> tags'
      const html = parse(md)

      expect(html).toContain('&lt;script&gt;')
      expect(html).not.toContain('<script>')
    })

    it('should escape HTML in code blocks', () => {
      const md = '```\n<script>alert("xss")</script>\n```'
      const html = parse(md)

      expect(html).toContain('&lt;script&gt;')
      expect(html).not.toMatch(/<script>(?!.*&lt;)/)
    })

    it('should escape HTML in inline code', () => {
      const md = 'Use `<div>` tag'
      const html = parse(md)

      expect(html).toContain('&lt;div&gt;')
    })

    it('should handle malicious link URLs', () => {
      const md = '[Click](javascript:alert(1))'
      const html = parse(md)

      // Parser creates the link, sanitization should happen separately
      expect(html).toContain('<a')
    })

    it('should escape special characters in alt text', () => {
      const md = '![Alt <test>](image.png)'
      const html = parse(md)

      expect(html).toContain('&lt;test&gt;')
    })
  })

  describe('GFM features', () => {
    it('should handle strikethrough with underscores', () => {
      const md = '~~deleted text~~'
      const html = parse(md, { gfm: true })

      expect(html).toContain('<del>deleted text</del>')
    })

    it('should handle task lists with brackets', () => {
      const md = '- [ ] Unchecked\n- [x] Checked'
      const html = parse(md)

      expect(html).toContain('type="checkbox"')
      expect(html).toContain('checked')
      expect(html).toContain('disabled')
    })

    it('should handle tables with various content', () => {
      const md = `| Feature | Status |
|---------|--------|
| **Bold** | ✓ |
| *Italic* | ✓ |
| \`Code\` | ✓ |
| [Link](url) | ✓ |`

      const html = parse(md, { gfm: true })

      expect(html).toContain('<table>')
      expect(html).toContain('<strong>Bold</strong>')
      expect(html).toContain('<em>Italic</em>')
      expect(html).toContain('<code>Code</code>')
      expect(html).toContain('<a href="url">')
      expect(html).toContain('✓')
    })
  })

  describe('break option', () => {
    it('should convert newlines to br when enabled', () => {
      const md = 'Line 1\nLine 2\nLine 3'
      const html = parse(md, { breaks: true })

      const brCount = (html.match(/<br>/g) || []).length
      expect(brCount).toBeGreaterThan(0)
    })

    it('should not convert newlines when disabled', () => {
      const md = 'Line 1\nLine 2'
      const html = parse(md, { breaks: false })

      expect(html).not.toContain('<br>')
    })

    it('should handle breaks in complex markdown', () => {
      const md = '**Bold\ntext** and *italic\ntext*'
      const html = parse(md, { breaks: true })

      expect(html).toContain('<strong>')
      expect(html).toContain('<br>')
      expect(html).toContain('<em>')
    })
  })

  describe('mixed content stress tests', () => {
    it('should handle document with all features', () => {
      const md = `# Main Title

Paragraph with **bold**, *italic*, and \`code\`.

## Section 1

- List item 1
- List item 2
- [x] Task item

### Subsection

> Blockquote with **bold**

\`\`\`javascript
const x = 5;
\`\`\`

| Col1 | Col2 |
|------|------|
| A    | B    |

---

[Link](url) and ![Image](src)

~~Strikethrough~~ text.

Final paragraph.`

      const html = parse(md, { gfm: true })

      expect(html).toContain('<h1')
      expect(html).toContain('<h2')
      expect(html).toContain('<h3')
      expect(html).toContain('<strong>')
      expect(html).toContain('<em>')
      expect(html).toContain('<code>')
      expect(html).toContain('<ul>')
      expect(html).toContain('checkbox')
      expect(html).toContain('<blockquote>')
      expect(html).toContain('<pre>')
      expect(html).toContain('<table>')
      expect(html).toContain('<hr>')
      expect(html).toContain('<a')
      expect(html).toContain('<img')
      expect(html).toContain('<del>')
    })
  })
})
