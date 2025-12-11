/**
 * Tests for story server API endpoints
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import path from 'node:path'
import { createContext } from '../../src/story/context'
import { createStoryServer, type StoryServer } from '../../src/story/server'

describe('Story Server', () => {
  const projectRoot = path.resolve(__dirname, '../../../..')
  let server: StoryServer | null = null
  const testPort = 6099

  beforeAll(async () => {
    const ctx = await createContext({
      mode: 'dev',
      root: projectRoot,
    })

    server = await createStoryServer(ctx, {
      port: testPort,
      host: 'localhost',
    })
  })

  afterAll(async () => {
    if (server) {
      await server.close()
    }
  })

  test('should start server and serve UI', async () => {
    const response = await fetch(`http://localhost:${testPort}/`)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')

    const html = await response.text()
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('STX')
  })

  test('GET /api/stories should return story list', async () => {
    const response = await fetch(`http://localhost:${testPort}/api/stories`)

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.files).toBeDefined()
    expect(Array.isArray(data.files)).toBe(true)
    expect(data.files.length).toBeGreaterThan(0)

    // Check structure of a story file
    const story = data.files[0]
    expect(story.id).toBeDefined()
    expect(story.fileName).toBeDefined()
    expect(story.relativePath).toBeDefined()
  })

  test('GET /api/render/:id/:variant should render component', async () => {
    // First get the story list to find a valid ID
    const listResponse = await fetch(`http://localhost:${testPort}/api/stories`)
    const listData = await listResponse.json()
    const buttonStory = listData.files.find((f: any) => f.fileName.includes('button'))

    expect(buttonStory).toBeDefined()

    const response = await fetch(`http://localhost:${testPort}/api/render/${buttonStory.id}/default`)

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.html).toBeDefined()
    expect(data.css).toBeDefined()
    expect(data.errors).toBeDefined()
    expect(Array.isArray(data.errors)).toBe(true)
    expect(data.duration).toBeGreaterThan(0)

    // Should have rendered content
    expect(data.html).toContain('button')
  })

  test('GET /api/render/:id/default should handle unknown story gracefully', async () => {
    const response = await fetch(`http://localhost:${testPort}/api/render/nonexistent-story/default`)

    expect(response.status).toBe(404)
  })

  test('GET /api/story/:id should return raw story content', async () => {
    const listResponse = await fetch(`http://localhost:${testPort}/api/stories`)
    const listData = await listResponse.json()
    const story = listData.files[0]

    const response = await fetch(`http://localhost:${testPort}/api/story/${story.id}`)

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.id).toBe(story.id)
    expect(data.fileName).toBeDefined()
    expect(data.content).toBeDefined()
    // Content should be the raw .stx file
    expect(data.content).toContain('<script>')
  })
})
