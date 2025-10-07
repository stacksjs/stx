import { describe, expect, it } from 'bun:test'
import { extractFrontmatter, hasFrontmatter, parse, stringify } from '../src/frontmatter'

describe('frontmatter parser', () => {
  it('should parse YAML frontmatter', () => {
    const content = `---
title: Hello World
author: John Doe
tags:
  - javascript
  - typescript
---

# Hello World

This is the content.
`

    const result = parse(content)

    expect(result.data.title).toBe('Hello World')
    expect(result.data.author).toBe('John Doe')
    expect(Array.isArray(result.data.tags)).toBe(true)
    expect(result.content).toContain('# Hello World')
    expect(result.content).toContain('This is the content.')
  })

  it('should parse TOML frontmatter', () => {
    const content = `+++
title = "Hello World"
author = "John Doe"
published = true
+++

# Content here
`

    const result = parse(content)

    expect(result.data.title).toBe('Hello World')
    expect(result.data.author).toBe('John Doe')
    expect(result.data.published).toBe(true)
  })

  it('should handle content without frontmatter', () => {
    const content = `# Just a heading

Some content without frontmatter.
`

    const result = parse(content)

    expect(result.data).toEqual({})
    expect(result.content).toBe(content)
  })

  it('should detect frontmatter presence', () => {
    const withFM = `---
title: Test
---
Content`

    const withoutFM = `# Just content`

    expect(hasFrontmatter(withFM)).toBe(true)
    expect(hasFrontmatter(withoutFM)).toBe(false)
  })

  it('should extract frontmatter text', () => {
    const content = `---
title: Test
author: John
---
Content`

    const fm = extractFrontmatter(content)

    expect(fm).toContain('title: Test')
    expect(fm).toContain('author: John')
  })

  it('should stringify data to frontmatter', () => {
    const data = {
      title: 'Hello',
      author: 'John',
    }
    const content = '# Content'

    const result = stringify(data, content)

    expect(result).toContain('---')
    expect(result).toContain('title')
    expect(result).toContain('# Content')
  })

  it('should handle empty frontmatter data', () => {
    const result = stringify({}, '# Content')
    expect(result).toBe('# Content')
  })
})
