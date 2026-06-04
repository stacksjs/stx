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

  // Regression tests for stacksjs/stx#1717 — the SSG build cache was passing
  // hardcoded `[]` for the dependencies array at both get() and set() sites,
  // so a change to a partial / layout / transitive include never invalidated
  // the consuming page's cached HTML. The fix threads renderPage's collected
  // dependencies through buildCache.set(), and buildCache.get() re-validates
  // against the previously-stored dep list.
  describe('build cache dependency tracking (#1717)', () => {
    const cacheDir = path.join(testDir, 'ssg-cache')

    it('invalidates a page when one of its included partials is edited', async () => {
      const partialsDir = path.join(pagesDir, 'partials')
      await fs.promises.mkdir(partialsDir, { recursive: true })

      // Page includes the partial via a `./`-prefixed path so the include
      // resolves relative to the current template instead of going through
      // `partialsDir` (which would otherwise resolve against the host repo's
      // stx.config.ts — irrelevant for this isolated test). Underscore-prefix
      // on the partial filename also keeps file-router.ts:30 from picking
      // up the partial as a real route at /partials/_header.
      await Bun.write(
        path.join(pagesDir, 'index.stx'),
        '<html><body>@include(\'./partials/_header\')<main>page body</main></body></html>'
      )
      await Bun.write(
        path.join(partialsDir, '_header.stx'),
        '<header data-marker="v1">VERSION-ONE</header>'
      )

      const baseOptions = {
        pagesDir,
        outputDir,
        cacheDir,
        sitemap: false,
        cache: true,
        cleanOutput: false,
      }

      // First build: no cache, full render. The cache entry that gets
      // persisted now (post-fix) contains the partial as a dependency.
      const first = await generateStaticSite(baseOptions)
      expect(first.successCount).toBe(1)
      const firstHtml = await Bun.file(path.join(outputDir, 'index.html')).text()
      expect(firstHtml).toContain('VERSION-ONE')

      // Edit the partial and bump its mtime far enough into the future that
      // the filesystem reports a different mtimeMs even on coarse-grained
      // timestamps (some filesystems have second resolution).
      const future = new Date(Date.now() + 2000)
      await Bun.write(
        path.join(partialsDir, '_header.stx'),
        '<header data-marker="v2">VERSION-TWO</header>'
      )
      fs.utimesSync(path.join(partialsDir, '_header.stx'), future, future)

      // Second build: with the bug, the cache would hit (the page's own
      // mtime didn't change, the cache key didn't include the partial) and
      // the output would still say VERSION-ONE. Post-fix, the cache's
      // stored dep list catches the partial's mtime change → miss → re-render.
      const second = await generateStaticSite(baseOptions)
      expect(second.successCount).toBe(1)
      const secondHtml = await Bun.file(path.join(outputDir, 'index.html')).text()
      expect(secondHtml).toContain('VERSION-TWO')
      expect(secondHtml).not.toContain('VERSION-ONE')
    })

    it('still hits the cache when nothing changed (no spurious re-renders)', async () => {
      await Bun.write(
        path.join(pagesDir, 'index.stx'),
        '<html><body><h1>Stable</h1></body></html>'
      )

      const baseOptions = {
        pagesDir,
        outputDir,
        cacheDir,
        sitemap: false,
        cache: true,
        cleanOutput: false,
      }

      // First build populates cache.
      const first = await generateStaticSite(baseOptions)
      expect(first.successCount).toBe(1)
      expect(first.cachedCount).toBe(0)

      // Second build with no edits — should be a cache hit. `cachedCount`
      // bumps when buildCache.get() returns a non-null entry.
      const second = await generateStaticSite(baseOptions)
      expect(second.cachedCount).toBe(1)
    })
  })

  describe('island chunking (#1746)', () => {
    // A page using an interactive component with client="visible" → the build
    // emits an inline island setup script the runtime runs on the trigger.
    async function setupIslandFixture() {
      await fs.promises.mkdir(path.join(pagesDir, 'components'), { recursive: true })
      await Bun.write(
        path.join(pagesDir, 'components', 'Counter.stx'),
        '<script client>\nconst count = state(0)\n</script>\n<button @click="count.set(count() + 1)" x-text="count"></button>\n',
      )
      await Bun.write(
        path.join(pagesDir, 'index.stx'),
        '<html><head><title>Home</title></head><body><h1>Home</h1><Counter client="visible" /></body></html>',
      )
    }

    const islandRe = /type="stx\/island"[^>]*>\s*\(function/

    it('flag OFF (default): islands stay inline, no chunk dir written', async () => {
      await setupIslandFixture()
      await generateStaticSite({ pagesDir, outputDir, sitemap: false, cache: false, cleanOutput: true })

      const html = await Bun.file(path.join(outputDir, 'index.html')).text()
      expect(html).toMatch(islandRe) // inline IIFE present
      // The island tag itself carries no chunk reference (the runtime source
      // mentions the attribute name, so scope the check to the tag).
      expect(html).not.toMatch(/type="stx\/island"[^>]*data-stx-src/)
      expect(fs.existsSync(path.join(outputDir, '_stx', 'islands'))).toBe(false)
    })

    it('flag ON: island IIFE moves to a content-hashed chunk the tag references', async () => {
      await setupIslandFixture()
      await generateStaticSite({ pagesDir, outputDir, sitemap: false, cache: false, cleanOutput: true, chunkIslands: true } as any)

      const html = await Bun.file(path.join(outputDir, 'index.html')).text()
      // Tag now references a chunk and the inline IIFE is gone from the page.
      expect(html).toContain('data-stx-src="/_stx/islands/')
      expect(html).not.toMatch(islandRe)

      // The referenced chunk exists on disk and holds the island IIFE.
      const m = html.match(/data-stx-src="\/_stx\/islands\/([^"]+)\.js"/)
      expect(m).toBeTruthy()
      const chunkPath = path.join(outputDir, '_stx', 'islands', `${m![1]}.js`)
      expect(fs.existsSync(chunkPath)).toBe(true)
      const chunk = await Bun.file(chunkPath).text()
      expect(chunk).toContain('(function')
    })

    it('prefetchIslands: warms a visible island chunk with a <link rel="prefetch">', async () => {
      await setupIslandFixture() // Counter uses client="visible"
      await generateStaticSite({ pagesDir, outputDir, sitemap: false, cache: false, cleanOutput: true, chunkIslands: true, prefetchIslands: true } as any)

      const html = await Bun.file(path.join(outputDir, 'index.html')).text()
      const m = html.match(/data-stx-src="(\/_stx\/islands\/[^"]+)"/)
      expect(m).toBeTruthy()
      // a prefetch hint for that exact chunk, inside the head
      expect(html).toContain(`<link rel="prefetch" href="${m![1]}" as="script">`)
      expect(html.indexOf('rel="prefetch"')).toBeLessThan(html.indexOf('</head>'))
    })

    it('no prefetch hints when prefetchIslands is off (chunking only)', async () => {
      await setupIslandFixture()
      await generateStaticSite({ pagesDir, outputDir, sitemap: false, cache: false, cleanOutput: true, chunkIslands: true } as any)

      const html = await Bun.file(path.join(outputDir, 'index.html')).text()
      expect(html).toContain('data-stx-src="/_stx/islands/') // chunked
      expect(html).not.toContain('rel="prefetch"') // but not prefetched
    })

    it('integrityIslands: stamps a sha384 SRI hash on the chunk tag', async () => {
      await setupIslandFixture()
      await generateStaticSite({ pagesDir, outputDir, sitemap: false, cache: false, cleanOutput: true, chunkIslands: true, integrityIslands: true } as any)

      const html = await Bun.file(path.join(outputDir, 'index.html')).text()
      expect(html).toMatch(/data-stx-integrity="sha384-[A-Za-z0-9+/=]+"/)
    })

    it('no integrity when integrityIslands is off', async () => {
      await setupIslandFixture()
      await generateStaticSite({ pagesDir, outputDir, sitemap: false, cache: false, cleanOutput: true, chunkIslands: true } as any)

      const html = await Bun.file(path.join(outputDir, 'index.html')).text()
      // (the runtime source mentions the attribute name, so scope to the tag)
      expect(html).not.toMatch(/type="stx\/island"[^>]*data-stx-integrity/)
    })

    it('reports island-chunk stats in the SSGResult', async () => {
      await setupIslandFixture()
      const res = await generateStaticSite({ pagesDir, outputDir, sitemap: false, cache: false, cleanOutput: true, chunkIslands: true } as any)

      expect(res.islandChunks).toBeTruthy()
      expect(res.islandChunks!.count).toBeGreaterThanOrEqual(1)
      expect(res.islandChunks!.totalBytes).toBeGreaterThan(0)

      // bytes should match the actual chunk file(s) on disk
      const islandsDir = path.join(outputDir, '_stx', 'islands')
      const files = fs.readdirSync(islandsDir).filter(f => f.endsWith('.js'))
      expect(files.length).toBe(res.islandChunks!.count)
      const onDisk = files.reduce((sum, f) => sum + fs.statSync(path.join(islandsDir, f)).size, 0)
      expect(res.islandChunks!.totalBytes).toBe(onDisk)
    })

    it('omits island-chunk stats when chunking is off', async () => {
      await setupIslandFixture()
      const res = await generateStaticSite({ pagesDir, outputDir, sitemap: false, cache: false, cleanOutput: true })
      expect(res.islandChunks).toBeUndefined()
    })

    it('writes an island manifest (pages → chunks, sizes) when chunking emits chunks', async () => {
      await setupIslandFixture()
      const res = await generateStaticSite({ pagesDir, outputDir, sitemap: false, cache: false, cleanOutput: true, chunkIslands: true } as any)

      const manifestPath = path.join(outputDir, '_stx', 'islands-manifest.json')
      expect(fs.existsSync(manifestPath)).toBe(true)
      const manifest = JSON.parse(await Bun.file(manifestPath).text())

      expect(manifest.generatedChunks).toBe(res.islandChunks!.count)
      expect(manifest.totalBytes).toBe(res.islandChunks!.totalBytes)
      // every chunk in the manifest maps to a real file + recorded size
      const hashes = Object.keys(manifest.chunks)
      expect(hashes.length).toBe(res.islandChunks!.count)
      for (const h of hashes) {
        expect(manifest.chunks[h].file).toBe(`/_stx/islands/${h}.js`)
        expect(fs.existsSync(path.join(outputDir, '_stx', 'islands', `${h}.js`))).toBe(true)
      }
      // the index page records the chunk(s) it uses
      expect(manifest.pages['/']).toEqual(hashes)
    })

    it('writes no manifest when chunking is off', async () => {
      await setupIslandFixture()
      await generateStaticSite({ pagesDir, outputDir, sitemap: false, cache: false, cleanOutput: true })
      expect(fs.existsSync(path.join(outputDir, '_stx', 'islands-manifest.json'))).toBe(false)
    })

    it('minifies island chunks when minify is on (smaller lazy payload)', async () => {
      await setupIslandFixture()
      const big = await generateStaticSite({ pagesDir, outputDir, sitemap: false, cache: false, cleanOutput: true, chunkIslands: true } as any)
      const bigBytes = big.islandChunks!.totalBytes

      await setupIslandFixture()
      const small = await generateStaticSite({ pagesDir, outputDir, sitemap: false, cache: false, cleanOutput: true, chunkIslands: true, minify: true } as any)

      const islandsDir = path.join(outputDir, '_stx', 'islands')
      const file = fs.readdirSync(islandsDir).find(f => f.endsWith('.js'))!
      const chunk = await Bun.file(path.join(islandsDir, file)).text()
      // minified: no source-indentation newlines, and smaller than unminified
      expect(chunk).not.toMatch(/\n {2,}/)
      expect(small.islandChunks!.totalBytes).toBeLessThan(bigBytes)
    })
  })
})
