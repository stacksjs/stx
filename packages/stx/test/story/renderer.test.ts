/**
 * Tests for story renderer functionality
 */

import { describe, expect, test } from 'bun:test'
import path from 'node:path'
import {
  clearStoryCache,
  generatePreviewDocument,
  renderStoryComponent,
} from '../../src/story/renderer'
import { createContext } from '../../src/story/context'
import type { StoryContext } from '../../src/story/types'

describe('Story Renderer', () => {
  const projectRoot = path.resolve(__dirname, '../../../..')

  async function createTestContext(): Promise<StoryContext> {
    return createContext({
      mode: 'dev',
      root: projectRoot,
    })
  }

  test('should render a story component', async () => {
    const ctx = await createTestContext()
    const componentPath = path.join(projectRoot, 'examples/components/button.story.stx')

    const result = await renderStoryComponent(ctx, componentPath)

    expect(result.html).toBeDefined()
    expect(result.html).toContain('button')
    expect(result.css).toBeDefined()
    expect(result.errors.length).toBe(0)
    expect(result.duration).toBeGreaterThan(0)
  })

  test('should extract CSS from component', async () => {
    const ctx = await createTestContext()
    const componentPath = path.join(projectRoot, 'examples/components/button.story.stx')

    const result = await renderStoryComponent(ctx, componentPath)

    expect(result.css).toContain('.button')
    expect(result.css).toContain('background-color')
  })

  test('should interpolate variables from script tags', async () => {
    const ctx = await createTestContext()
    const componentPath = path.join(projectRoot, 'examples/components/button.story.stx')

    const result = await renderStoryComponent(ctx, componentPath)

    // The button should have interpolated class
    expect(result.html).toContain('button--primary')
    // The label should be interpolated
    expect(result.html).toContain('Click me')
  })

  test('should strip script and style tags from HTML output', async () => {
    const ctx = await createTestContext()
    const componentPath = path.join(projectRoot, 'examples/components/button.story.stx')

    const result = await renderStoryComponent(ctx, componentPath)

    // HTML should not contain raw script/style tags
    expect(result.html).not.toMatch(/<script\b[^>]*>[\s\S]*const\s+\w+\s*=/i)
    expect(result.html).not.toMatch(/<style\b[^>]*>[\s\S]*\.button\s*\{/i)
  })

  test('should apply props to component', async () => {
    const ctx = await createTestContext()
    const componentPath = path.join(projectRoot, 'examples/components/button.story.stx')

    const result = await renderStoryComponent(ctx, componentPath, {
      props: { variant: 'danger', label: 'Delete' },
    })

    expect(result.html).toContain('button--danger')
    expect(result.html).toContain('Delete')
  })

  test('should handle render errors gracefully', async () => {
    const ctx = await createTestContext()
    const componentPath = path.join(projectRoot, 'nonexistent/component.stx')

    const result = await renderStoryComponent(ctx, componentPath)

    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.html).toContain('stx-render-error')
  })

  test('should generate preview document', () => {
    const result = {
      html: '<button class="btn">Test</button>',
      css: '.btn { color: blue; }',
      js: 'console.log("test")',
      errors: [],
      duration: 10,
    }

    const doc = generatePreviewDocument(result, { title: 'Test Preview' })

    expect(doc).toContain('<!DOCTYPE html>')
    expect(doc).toContain('Test Preview')
    expect(doc).toContain('<button class="btn">Test</button>')
    expect(doc).toContain('.btn { color: blue; }')
  })

  test('should cache components', async () => {
    clearStoryCache()

    const ctx = await createTestContext()
    const componentPath = path.join(projectRoot, 'examples/components/button.story.stx')

    // First render
    const result1 = await renderStoryComponent(ctx, componentPath)

    // Second render (should be cached)
    const result2 = await renderStoryComponent(ctx, componentPath)

    // Both should succeed
    expect(result1.errors.length).toBe(0)
    expect(result2.errors.length).toBe(0)

    // Content should be the same
    expect(result1.html).toBe(result2.html)
  })
})
