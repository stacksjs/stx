/**
 * Tests for story scanner functionality
 */

import { describe, expect, test } from 'bun:test'
import path from 'node:path'
import { scanStoryFiles } from '../../src/story/collect/scanner'
import { createContext } from '../../src/story/context'
import type { StoryContext } from '../../src/story/types'

describe('Story Scanner', () => {
  const projectRoot = path.resolve(__dirname, '../../../..')

  async function createTestContext(): Promise<StoryContext> {
    return createContext({
      mode: 'dev',
      root: projectRoot,
      config: {
        storyPatterns: ['examples/components/**/*.story.stx'],
      } as any,
    })
  }

  test('should scan for .story.stx files', async () => {
    const ctx = await createTestContext()
    const files = await scanStoryFiles(ctx)

    expect(files.length).toBeGreaterThan(0)
    expect(files.every(f => f.path.endsWith('.story.stx'))).toBe(true)
  })

  test('should extract story metadata', async () => {
    const ctx = await createTestContext()
    const files = await scanStoryFiles(ctx)

    // Find the button story
    const buttonStory = files.find(f => f.fileName.includes('button'))
    expect(buttonStory).toBeDefined()
    expect(buttonStory?.id).toBeDefined()
    expect(buttonStory?.relativePath).toBeDefined()
  })

  test('should generate unique IDs for each story', async () => {
    const ctx = await createTestContext()
    const files = await scanStoryFiles(ctx)

    const ids = files.map(f => f.id)
    const uniqueIds = new Set(ids)

    expect(ids.length).toBe(uniqueIds.size)
  })

  test('should return files with correct structure', async () => {
    const ctx = await createTestContext()
    const files = await scanStoryFiles(ctx)

    // Each file should have the required properties
    for (const file of files) {
      expect(file.id).toBeDefined()
      expect(file.path).toBeDefined()
      expect(file.fileName).toBeDefined()
      expect(file.relativePath).toBeDefined()
    }
  })
})
