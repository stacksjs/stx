import { describe, expect, it } from 'bun:test'
import { extractFrontmatter, hasFrontmatter, parse, stringify } from '../src/frontmatter'

describe('frontmatter parser - edge cases', () => {
  it('should handle empty frontmatter', () => {
    const content = `---
title:
---

# Content`

    const result = parse(content)

    // Empty frontmatter might have null values
    expect(typeof result.data).toBe('object')
    expect(result.content.trim()).toStartWith('# Content')
  })

  it('should handle frontmatter with only whitespace', () => {
    const content = `---


---

Content`

    const result = parse(content)

    expect(result.data).toEqual({})
  })

  it('should handle missing closing delimiter', () => {
    const content = `---
title: Test

# Content without closing delimiter`

    const result = parse(content)

    // Should not parse frontmatter if delimiter is missing
    expect(result.content).toBe(content)
  })

  it('should handle Windows line endings (CRLF)', () => {
    const content = '---\r\ntitle: Test\r\nauthor: John\r\n---\r\n\r\nContent'

    const result = parse(content)

    expect(result.data.title).toBe('Test')
    expect(result.data.author).toBe('John')
  })

  it('should handle mixed line endings', () => {
    const content = '---\ntitle: Test\r\nauthor: John\n---\r\nContent'

    const result = parse(content)

    expect(result.data.title).toBe('Test')
    expect(result.data.author).toBe('John')
  })

  it('should preserve original content', () => {
    const content = `---
title: Test
---
Original content`

    const result = parse(content)

    expect(result.original).toBe(content)
  })

  it('should handle multiple frontmatter delimiters in content', () => {
    const content = `---
title: Test
---

# Content

\`\`\`yaml
---
fake: frontmatter
---
\`\`\`

More content`

    const result = parse(content)

    expect(result.data.title).toBe('Test')
    expect(result.content).toContain('fake: frontmatter')
  })

  it('should handle frontmatter at different positions', () => {
    // Frontmatter not at start
    const content = `
Some text before
---
title: Test
---
Content`

    const result = parse(content)

    // Should not parse frontmatter if not at start
    expect(result.data).toEqual({})
  })

  it('should handle TOML frontmatter with special characters', () => {
    const content = `+++
title = "Test with 'quotes' and \\"escapes\\""
url = "https://example.com/path?query=value"
+++

Content`

    const result = parse(content)

    expect(result.data.title).toBeTruthy()
    expect(result.data.url).toBeTruthy()
  })

  it('should handle very large frontmatter', () => {
    const tags = Array.from({ length: 100 }, (_, i) => `  - tag${i}`).join('\n')
    const content = `---
title: Test
tags:
${tags}
---

Content`

    const result = parse(content)

    expect(result.data.title).toBe('Test')
    expect(Array.isArray(result.data.tags)).toBe(true)
  })

  it('should handle Unicode characters in frontmatter', () => {
    const content = `---
title: 测试标题
author: José García
emoji: 🎉🎊
---

Content`

    const result = parse(content)

    expect(result.data.title).toBe('测试标题')
    expect(result.data.author).toBe('José García')
    expect(result.data.emoji).toBe('🎉🎊')
  })

  it('should handle dates in frontmatter', () => {
    const content = `---
date: 2024-01-15
time: 14:30:00
---

Content`

    const result = parse(content)

    // Dates are parsed as strings
    expect(result.data.date).toBe('2024-01-15')
    expect(result.data.time).toBe('14:30:00')
  })

  it('should extract frontmatter without parsing', () => {
    const content = `---
title: Test
complex:
  nested: value
---
Content`

    const extracted = extractFrontmatter(content)

    expect(extracted).toBeTruthy()
    expect(extracted).toContain('title: Test')
    expect(extracted).toContain('nested: value')
  })

  it('should detect frontmatter correctly', () => {
    expect(hasFrontmatter('---\ntitle: Test\n---\nContent')).toBe(true)
    expect(hasFrontmatter('+++\ntitle = "Test"\n+++\nContent')).toBe(true)
    expect(hasFrontmatter('No frontmatter here')).toBe(false)
    expect(hasFrontmatter('---\nIncomplete')).toBe(false)
  })

  it('should stringify and parse roundtrip', () => {
    const data = {
      title: 'Test Title',
      author: 'John Doe',
      published: true,
      tags: ['test', 'markdown'],
    }
    const content = '# My Document\n\nContent here.'

    const stringified = stringify(data, content)
    const parsed = parse(stringified)

    expect(parsed.data.title).toBe(data.title)
    expect(parsed.data.author).toBe(data.author)
    expect(parsed.data.published).toBe(data.published)
    expect(parsed.content.trim()).toContain('# My Document')
  })

  it('should handle empty data in stringify', () => {
    const result = stringify({}, 'Just content')

    expect(result).toBe('Just content')
  })

  it('should handle TOML stringify format', () => {
    const data = { title: 'Test', count: 42 }
    const result = stringify(data, 'Content', 'toml')

    expect(result).toContain('+++')
    expect(result).toContain('title')
    expect(result).toContain('count')
  })

  it('should handle null and undefined values', () => {
    const content = `---
nullValue: null
emptyValue:
undefinedKey:
---
Content`

    const result = parse(content)

    expect(result.data.nullValue).toBeNull()
    expect(result.data.emptyValue).toBeNull()
  })

  it('should handle comments in YAML frontmatter', () => {
    const content = `---
# This is a comment
title: Test
# Another comment
author: John
---
Content`

    const result = parse(content)

    expect(result.data.title).toBe('Test')
    expect(result.data.author).toBe('John')
  })

  it('should handle multiline strings', () => {
    const content = `---
description: |
  This is a multiline
  description that spans
  several lines
---
Content`

    const result = parse(content)

    expect(result.data.description).toContain('multiline')
  })
})
