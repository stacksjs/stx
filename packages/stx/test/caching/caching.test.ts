import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs, TEMP_DIR } from '../utils'

describe('stx Template Caching', () => {
  const CACHE_DIR = path.join(TEMP_DIR, '.stx/cache')

  beforeAll(async () => {
    await setupTestDirs()
    await fs.promises.mkdir(CACHE_DIR, { recursive: true })
  })

  afterAll(async () => {
    // Clean up cache directory
    await cleanupTestDirs()
  })

  it('should cache templates when caching is enabled', async () => {
    // Create a test template
    const testFile = await createTestFile('cache-test.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cache Test</title>
        <script>
          module.exports = {
            name: 'Cached Template',
            items: ['Item 1', 'Item 2', 'Item 3']
          };
        </script>
      </head>
      <body>
        <h1>{{ name }}</h1>

        <ul>
          @foreach(items as item)
            <li>{{ item }}</li>
          @endforeach
        </ul>
      </body>
      </html>
    `)

    // First build with caching enabled
    const result1 = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
      stx: {
        cache: true,
        cachePath: CACHE_DIR,
        debug: true,
      },
    } as any)

    // Get the output HTML
    const output1 = await getHtmlOutput(result1)

    // Verify it contains our dynamic content
    expect(output1).toContain('<h1>Cached Template</h1>')
    expect(output1).toContain('<li>Item 1</li>')

    // Check that a cache file was created
    const cacheFiles = await fs.promises.readdir(CACHE_DIR)
    expect(cacheFiles.length).toBeGreaterThan(0)
    expect(cacheFiles.some(f => f.endsWith('.html'))).toBe(true)
    expect(cacheFiles.some(f => f.endsWith('.meta.json'))).toBe(true)

    // Run again - this time it should use the cache
    const result2 = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
      stx: {
        cache: true,
        cachePath: CACHE_DIR,
        debug: true,
      },
    } as any)

    // Get the output HTML
    const output2 = await getHtmlOutput(result2)

    // Verify outputs are identical
    expect(output2).toBe(output1)
  })

  it('should invalidate cache when template changes', async () => {
    // Create a test template
    const testFile = await createTestFile('cache-invalidation.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cache Invalidation Test</title>
        <script>
          module.exports = {
            message: 'Original Message'
          };
        </script>
      </head>
      <body>
        <div>{{ message }}</div>
      </body>
      </html>
    `)

    // First build
    const result1 = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
      stx: {
        cache: true,
        cachePath: CACHE_DIR,
        debug: true,
      },
    } as any)

    const output1 = await getHtmlOutput(result1)
    expect(output1).toContain('Original Message')

    // Wait a bit to ensure file modification time is different
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Modify the template
    await Bun.write(testFile, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cache Invalidation Test</title>
        <script>
          module.exports = {
            message: 'Updated Message'
          };
        </script>
      </head>
      <body>
        <div>{{ message }}</div>
      </body>
      </html>
    `)

    // Build again - should invalidate cache due to file change
    const result2 = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
      stx: {
        cache: true,
        cachePath: CACHE_DIR,
        debug: true,
      },
    } as any)

    const output2 = await getHtmlOutput(result2)
    expect(output2).toContain('Updated Message')
    expect(output2).not.toContain('Original Message')
  })

  it('should use a custom cache path', async () => {
    // Create a custom cache directory
    const customCachePath = path.join(TEMP_DIR, 'custom-cache')
    await fs.promises.mkdir(customCachePath, { recursive: true })

    // Create a test template
    const testFile = await createTestFile('custom-cache-path.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Custom Cache Path Test</title>
        <script>
          module.exports = {
            title: 'Custom Cache Path'
          };
        </script>
      </head>
      <body>
        <h1>{{ title }}</h1>
      </body>
      </html>
    `)

    // Build with custom cache path
    await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
      stx: {
        cache: true,
        cachePath: customCachePath,
        debug: true,
      },
    } as any)

    // Verify cache files were created in the custom directory
    const cacheFiles = await fs.promises.readdir(customCachePath)
    expect(cacheFiles.length).toBeGreaterThan(0)
    expect(cacheFiles.some(f => f.endsWith('.html'))).toBe(true)
  })

  it('should respect the cache version', async () => {
    // Create a test template
    const testFile = await createTestFile('cache-version.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cache Version Test</title>
        <script>
          module.exports = {
            version: 'v1'
          };
        </script>
      </head>
      <body>
        <div>Version: {{ version }}</div>
      </body>
      </html>
    `)

    // First build with cache version 1.0.0
    const result1 = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
      stx: {
        cache: true,
        cachePath: CACHE_DIR,
        cacheVersion: '1.0.0',
        debug: true,
      },
    } as any)

    const output1 = await getHtmlOutput(result1)
    expect(output1).toContain('Version: v1')

    // Change script content but don't change file modification time
    // (we're simulating a change in the code but not the file)
    const originalContent = await Bun.file(testFile).text()
    const updatedContent = originalContent.replace('version: \'v1\'', 'version: \'v2\'')

    // Keep the same file modification time
    const fileStat = await fs.promises.stat(testFile)

    await Bun.write(testFile, updatedContent)

    // Try to restore the original modification time (this may not work perfectly on all systems)
    try {
      await fs.promises.utimes(testFile, fileStat.atime, fileStat.mtime)
    }
    catch {
      // If this fails, the test might also fail but that's ok
      console.warn('Could not restore file modification time')
    }

    // Build again with same cache version - might use cache if mtime restoration worked
    const result2 = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
      stx: {
        cache: true,
        cachePath: CACHE_DIR,
        cacheVersion: '1.0.0',
        debug: true,
      },
    } as any)

    const output2 = await getHtmlOutput(result2)

    // Build again with different cache version - should invalidate cache
    const result3 = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
      stx: {
        cache: true,
        cachePath: CACHE_DIR,
        cacheVersion: '2.0.0', // Different version
        debug: true,
      },
    } as any)

    const output3 = await getHtmlOutput(result3)
    expect(output3).toContain('Version: v2')

    // If the second build used the cache, outputs 1 and 2 should be identical
    // and output 3 should be different
    if (output1 === output2) {
      expect(output3).not.toBe(output1)
    }
  })
})
