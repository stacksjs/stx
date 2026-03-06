import { describe, expect, test } from 'bun:test'
import { extractExcerpt, parseFrontmatter } from '../src/frontmatter'

describe('parseFrontmatter', () => {
  test('parses string values', () => {
    const input = `---
title: Hello World
---
Body content`
    const result = parseFrontmatter(input)
    expect(result.data.title).toBe('Hello World')
    expect(result.content).toBe('Body content')
  })

  test('parses quoted string values', () => {
    const input = `---
title: "Hello World"
subtitle: 'Another Title'
---
Content`
    const result = parseFrontmatter(input)
    expect(result.data.title).toBe('Hello World')
    expect(result.data.subtitle).toBe('Another Title')
  })

  test('parses number values', () => {
    const input = `---
count: 42
price: 9.99
negative: -5
---
Content`
    const result = parseFrontmatter(input)
    expect(result.data.count).toBe(42)
    expect(result.data.price).toBe(9.99)
    expect(result.data.negative).toBe(-5)
  })

  test('parses boolean values', () => {
    const input = `---
draft: true
published: false
---
Content`
    const result = parseFrontmatter(input)
    expect(result.data.draft).toBe(true)
    expect(result.data.published).toBe(false)
  })

  test('parses date values', () => {
    const input = `---
date: 2025-01-15
---
Content`
    const result = parseFrontmatter(input)
    expect(result.data.date).toBeInstanceOf(Date)
    expect((result.data.date as Date).toISOString()).toBe('2025-01-15T00:00:00.000Z')
  })

  test('parses array values', () => {
    const input = `---
tags:
  - javascript
  - typescript
  - bun
---
Content`
    const result = parseFrontmatter(input)
    expect(result.data.tags).toEqual(['javascript', 'typescript', 'bun'])
  })

  test('parses nested objects', () => {
    const input = `---
author:
  name: John
  email: john@example.com
---
Content`
    const result = parseFrontmatter(input)
    expect(result.data.author).toEqual({ name: 'John', email: 'john@example.com' })
  })

  test('returns empty data when no frontmatter', () => {
    const input = 'Just some content without frontmatter'
    const result = parseFrontmatter(input)
    expect(result.data).toEqual({})
    expect(result.content).toBe(input)
  })

  test('handles empty frontmatter', () => {
    const input = `---
---
Content after empty frontmatter`
    const result = parseFrontmatter(input)
    expect(result.data).toEqual({})
    expect(result.content).toBe('Content after empty frontmatter')
  })

  test('handles missing closing delimiter', () => {
    const input = `---
title: Hello
No closing delimiter`
    const result = parseFrontmatter(input)
    expect(result.data).toEqual({})
  })

  test('parses mixed types', () => {
    const input = `---
title: My Post
date: 2025-06-01
draft: false
views: 100
tags:
  - web
  - dev
author:
  name: Alice
---
The body content here.`
    const result = parseFrontmatter(input)
    expect(result.data.title).toBe('My Post')
    expect(result.data.date).toBeInstanceOf(Date)
    expect(result.data.draft).toBe(false)
    expect(result.data.views).toBe(100)
    expect(result.data.tags).toEqual(['web', 'dev'])
    expect(result.data.author).toEqual({ name: 'Alice' })
    expect(result.content).toBe('The body content here.')
  })
})

describe('extractExcerpt', () => {
  test('returns first paragraph', () => {
    const content = `First paragraph here.

Second paragraph here.`
    expect(extractExcerpt(content)).toBe('First paragraph here.')
  })

  test('truncates to maxLength', () => {
    const content = 'A'.repeat(300)
    const excerpt = extractExcerpt(content, 100)
    expect(excerpt).toBe(`${'A'.repeat(100)}...`)
  })

  test('returns full first paragraph if under maxLength', () => {
    const content = 'Short paragraph.'
    expect(extractExcerpt(content, 200)).toBe('Short paragraph.')
  })

  test('handles empty content', () => {
    expect(extractExcerpt('')).toBe('')
    expect(extractExcerpt('   ')).toBe('')
  })

  test('handles content with no double newline', () => {
    const content = 'Single block of text with no paragraph breaks.'
    expect(extractExcerpt(content)).toBe('Single block of text with no paragraph breaks.')
  })
})
