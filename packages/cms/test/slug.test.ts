import { describe, expect, test } from 'bun:test'
import { fileNameToSlug, generateSlug } from '../src/slug'

describe('generateSlug', () => {
  test('converts to lowercase', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  test('replaces spaces with hyphens', () => {
    expect(generateSlug('hello world test')).toBe('hello-world-test')
  })

  test('removes special characters', () => {
    expect(generateSlug('Hello, World! 123')).toBe('hello-world-123')
  })

  test('collapses multiple hyphens', () => {
    expect(generateSlug('hello---world')).toBe('hello-world')
  })

  test('trims leading and trailing hyphens', () => {
    expect(generateSlug('--hello world--')).toBe('hello-world')
  })

  test('handles empty string', () => {
    expect(generateSlug('')).toBe('')
  })

  test('handles unicode characters', () => {
    expect(generateSlug('cafe latte')).toBe('cafe-latte')
  })

  test('handles numbers', () => {
    expect(generateSlug('Post 42')).toBe('post-42')
  })

  test('handles mixed special characters', () => {
    expect(generateSlug('Hello & World @ 2025!')).toBe('hello-world-2025')
  })
})

describe('fileNameToSlug', () => {
  test('extracts filename without extension', () => {
    expect(fileNameToSlug('hello-world.md')).toBe('hello-world')
  })

  test('handles nested paths', () => {
    expect(fileNameToSlug('content/posts/hello-world.md')).toBe('hello-world')
  })

  test('handles .stx extension', () => {
    expect(fileNameToSlug('my-page.stx')).toBe('my-page')
  })

  test('handles files with multiple dots', () => {
    expect(fileNameToSlug('my.special.post.md')).toBe('my.special.post')
  })

  test('handles filename with no path', () => {
    expect(fileNameToSlug('simple.md')).toBe('simple')
  })
})
