import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import {
  generateStaticSite,
  createISRHandler,
  defineStaticPaths,
  createMarkdownLoader,
} from '../src/ssg'

describe('Static Site Generation', () => {
  const testDir = path.join(process.cwd(), '.test-ssg')
  const pagesDir = path.join(testDir, 'pages')
  const outputDir = path.join(testDir, 'dist')

  beforeEach(async () => {
    // Create test directories
    await fs.promises.mkdir(pagesDir, { recursive: true })
  })

  afterEach(async () => {
    // Clean up test directories
    if (fs.existsSync(testDir)) {
      await fs.promises.rm(testDir, { recursive: true })
    }
  })

  describe('defineStaticPaths', () => {
    it('should return paths from sync function', async () => {
      const getStaticPaths = defineStaticPaths(() => [
        { params: { slug: 'hello' } },
        { params: { slug: 'world' } },
      ])

      const result = await getStaticPaths()
      expect(result.paths).toHaveLength(2)
      expect(result.paths[0].params.slug).toBe('hello')
      expect(result.paths[1].params.slug).toBe('world')
    })

    it('should return paths from async function', async () => {
      const getStaticPaths = defineStaticPaths(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return [
          { params: { id: '1' }, props: { title: 'Post 1' } },
          { params: { id: '2' }, props: { title: 'Post 2' } },
        ]
      })

      const result = await getStaticPaths()
      expect(result.paths).toHaveLength(2)
      expect(result.paths[0].props?.title).toBe('Post 1')
    })

    it('should set fallback to false by default', async () => {
      const getStaticPaths = defineStaticPaths(() => [])
      const result = await getStaticPaths()
      expect(result.fallback).toBe(false)
    })
  })

  describe('createMarkdownLoader', () => {
    it('should create a markdown loader', () => {
      const loader = createMarkdownLoader()
      expect(loader.name).toBe('markdown')
      expect(loader.extensions).toContain('.md')
      expect(loader.extensions).toContain('.mdx')
    })

    it('should parse markdown with frontmatter', async () => {
      const loader = createMarkdownLoader()
      const mdPath = path.join(testDir, 'test.md')

      await Bun.write(mdPath, `---
title: Test Post
date: 2025-01-15
tags: [javascript, testing]
draft: false
---

# Hello World

This is a **test** post.
`)

      const result = await loader.load(mdPath)

      expect(result.data.title).toBe('Test Post')
      expect(result.data.draft).toBe(false)
      expect(result.data.tags).toEqual(['javascript', 'testing'])
      expect(result.content).toContain('<h1>Hello World</h1>')
      expect(result.content).toContain('<strong>test</strong>')
    })

    it('should generate table of contents', async () => {
      const loader = createMarkdownLoader()
      const mdPath = path.join(testDir, 'toc.md')

      await Bun.write(mdPath, `# Main Title

## Section 1

### Subsection

## Section 2
`)

      const result = await loader.load(mdPath)

      expect(result.toc).toBeDefined()
      expect(result.toc!.length).toBeGreaterThan(0)
    })

    it('should handle markdown without frontmatter', async () => {
      const loader = createMarkdownLoader()
      const mdPath = path.join(testDir, 'no-fm.md')

      await Bun.write(mdPath, `# Just Content

No frontmatter here.
`)

      const result = await loader.load(mdPath)

      expect(result.data).toEqual({})
      expect(result.content).toContain('<h1>Just Content</h1>')
    })
  })

  describe('createISRHandler', () => {
    it('should create an ISR handler', () => {
      const handler = createISRHandler({
        pagesDir: 'pages',
        revalidate: 60,
      })

      expect(handler.get).toBeDefined()
      expect(handler.revalidate).toBeDefined()
      expect(handler.invalidate).toBeDefined()
    })

    it('should return null for uncached routes', async () => {
      const handler = createISRHandler({
        cacheDir: path.join(testDir, 'isr-cache'),
      })

      const result = await handler.get('/nonexistent')
      expect(result).toBeNull()
    })

    it('should invalidate cached routes', async () => {
      const handler = createISRHandler({
        cacheDir: path.join(testDir, 'isr-cache'),
      })

      // This should not throw
      await handler.invalidate('/some-route')
      await handler.invalidate(/^\/blog\//)
    })
  })

  describe('generateStaticSite', () => {
    it('should generate static site from pages', async () => {
      // Create test pages
      await Bun.write(
        path.join(pagesDir, 'index.stx'),
        '<html><body><h1>Home</h1></body></html>'
      )
      await Bun.write(
        path.join(pagesDir, 'about.stx'),
        '<html><body><h1>About</h1></body></html>'
      )

      const result = await generateStaticSite({
        pagesDir,
        outputDir,
        sitemap: false,
        cache: false,
        cleanOutput: true,
      })

      expect(result.totalPages).toBe(2)
      expect(result.successCount).toBe(2)
      expect(result.failedCount).toBe(0)

      // Check output files exist
      expect(fs.existsSync(path.join(outputDir, 'index.html'))).toBe(true)
      expect(fs.existsSync(path.join(outputDir, 'about.html'))).toBe(true)
    })

    it('should generate sitemap when enabled', async () => {
      await Bun.write(
        path.join(pagesDir, 'index.stx'),
        '<html><body><h1>Home</h1></body></html>'
      )

      const result = await generateStaticSite({
        pagesDir,
        outputDir,
        sitemap: true,
        domain: 'https://example.com',
        cache: false,
      })

      expect(result.sitemapPath).toBeDefined()
      expect(fs.existsSync(result.sitemapPath!)).toBe(true)

      const sitemapContent = await Bun.file(result.sitemapPath!).text()
      expect(sitemapContent).toContain('<?xml version="1.0"')
      expect(sitemapContent).toContain('urlset')
      expect(sitemapContent).toContain('https://example.com')
    })

    it('should generate 404 page', async () => {
      await Bun.write(
        path.join(pagesDir, 'index.stx'),
        '<html><body><h1>Home</h1></body></html>'
      )

      await generateStaticSite({
        pagesDir,
        outputDir,
        generate404: true,
        sitemap: false,
        cache: false,
      })

      expect(fs.existsSync(path.join(outputDir, '404.html'))).toBe(true)

      const content = await Bun.file(path.join(outputDir, '404.html')).text()
      expect(content).toContain('404')
    })

    it('should use custom 404 page if exists', async () => {
      await Bun.write(
        path.join(pagesDir, 'index.stx'),
        '<html><body><h1>Home</h1></body></html>'
      )
      await Bun.write(
        path.join(pagesDir, '404.stx'),
        '<html><body><h1>Custom 404</h1></body></html>'
      )

      await generateStaticSite({
        pagesDir,
        outputDir,
        generate404: true,
        sitemap: false,
        cache: false,
      })

      const content = await Bun.file(path.join(outputDir, '404.html')).text()
      expect(content).toContain('Custom 404')
    })

    it('should handle nested directories', async () => {
      await fs.promises.mkdir(path.join(pagesDir, 'blog'), { recursive: true })

      await Bun.write(
        path.join(pagesDir, 'index.stx'),
        '<html><body><h1>Home</h1></body></html>'
      )
      await Bun.write(
        path.join(pagesDir, 'blog', 'index.stx'),
        '<html><body><h1>Blog</h1></body></html>'
      )
      await Bun.write(
        path.join(pagesDir, 'blog', 'post.stx'),
        '<html><body><h1>Post</h1></body></html>'
      )

      const result = await generateStaticSite({
        pagesDir,
        outputDir,
        sitemap: false,
        cache: false,
      })

      expect(result.totalPages).toBe(3)
      expect(fs.existsSync(path.join(outputDir, 'blog.html'))).toBe(true)
      expect(fs.existsSync(path.join(outputDir, 'blog', 'post.html'))).toBe(true)
    })

    it('should call build hooks', async () => {
      await Bun.write(
        path.join(pagesDir, 'index.stx'),
        '<html><body><h1>Home</h1></body></html>'
      )

      let buildStartCalled = false
      let buildEndCalled = false
      let pageStartCount = 0
      let pageEndCount = 0

      await generateStaticSite({
        pagesDir,
        outputDir,
        sitemap: false,
        cache: false,
        hooks: {
          onBuildStart: () => { buildStartCalled = true },
          onBuildEnd: () => { buildEndCalled = true },
          onPageStart: () => { pageStartCount++ },
          onPageEnd: () => { pageEndCount++ },
        },
      })

      expect(buildStartCalled).toBe(true)
      expect(buildEndCalled).toBe(true)
      expect(pageStartCount).toBe(1)
      expect(pageEndCount).toBe(1)
    })

    it('should copy public directory', async () => {
      const publicDir = path.join(testDir, 'public')
      await fs.promises.mkdir(publicDir, { recursive: true })

      await Bun.write(
        path.join(pagesDir, 'index.stx'),
        '<html><body><h1>Home</h1></body></html>'
      )
      await Bun.write(
        path.join(publicDir, 'robots.txt'),
        'User-agent: *\nAllow: /'
      )

      await generateStaticSite({
        pagesDir,
        outputDir,
        publicDir,
        sitemap: false,
        cache: false,
      })

      expect(fs.existsSync(path.join(outputDir, 'robots.txt'))).toBe(true)
    })

    it('should track build time', async () => {
      await Bun.write(
        path.join(pagesDir, 'index.stx'),
        '<html><body><h1>Home</h1></body></html>'
      )

      const result = await generateStaticSite({
        pagesDir,
        outputDir,
        sitemap: false,
        cache: false,
      })

      // Build time can be 0ms for very fast builds
      expect(result.buildTime).toBeGreaterThanOrEqual(0)
    })

    it('should handle empty pages directory', async () => {
      const result = await generateStaticSite({
        pagesDir,
        outputDir,
        sitemap: false,
        cache: false,
      })

      expect(result.totalPages).toBe(0)
      expect(result.successCount).toBe(0)
    })
  })
})
