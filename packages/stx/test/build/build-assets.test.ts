/**
 * Tests for build assets — externalized runtime, router, and CSS
 */
import { describe, expect, it } from 'bun:test'
import { buildRuntimeAsset, buildRouterAsset, fingerprint, assetTags } from '../../src/build-assets'
import { processDirectives, defaultConfig } from '../../src/index'

describe('Build Assets', () => {
  describe('fingerprint', () => {
    it('should produce a deterministic 8-char hex hash', () => {
      const hash = fingerprint('hello world')
      expect(hash).toHaveLength(8)
      expect(hash).toMatch(/^[0-9a-f]{8}$/)
      expect(fingerprint('hello world')).toBe(hash) // deterministic
    })

    it('should produce different hashes for different content', () => {
      expect(fingerprint('hello')).not.toBe(fingerprint('world'))
    })
  })

  describe('buildRuntimeAsset', () => {
    it('should produce a valid JS asset with fingerprinted filename', () => {
      const asset = buildRuntimeAsset()
      expect(asset.content).toContain('state')
      expect(asset.content).toContain('derived')
      expect(asset.content).toContain('effect')
      expect(asset.filename).toMatch(/^runtime\.[0-9a-f]{8}\.js$/)
      expect(asset.hash).toHaveLength(8)
    })

    it('should produce valid JS that parses', () => {
      const asset = buildRuntimeAsset()
      expect(() => new Function(asset.content)).not.toThrow()
    })

    it('should produce deterministic output', () => {
      const a = buildRuntimeAsset()
      const b = buildRuntimeAsset()
      expect(a.hash).toBe(b.hash)
      expect(a.filename).toBe(b.filename)
    })

    it('should produce different output for debug mode', () => {
      const prod = buildRuntimeAsset(false)
      const dev = buildRuntimeAsset(true)
      expect(dev.content.length).toBeGreaterThan(prod.content.length)
      expect(dev.hash).not.toBe(prod.hash)
    })
  })

  describe('buildRouterAsset', () => {
    it('should produce a valid JS asset', () => {
      const asset = buildRouterAsset()
      expect(asset.content).toContain('__stxRouter')
      expect(asset.filename).toMatch(/^router\.[0-9a-f]{8}\.js$/)
    })

    it('should be deterministic', () => {
      const a = buildRouterAsset()
      const b = buildRouterAsset()
      expect(a.hash).toBe(b.hash)
    })
  })

  describe('assetTags', () => {
    it('should generate script src tags for assets', () => {
      const runtime = buildRuntimeAsset()
      const router = buildRouterAsset()
      const tags = assetTags({ runtime, router })

      expect(tags.runtimeTag).toContain('/__stx/runtime.')
      expect(tags.runtimeTag).toContain('.js')
      expect(tags.runtimeTag).toContain('<script src=')
      expect(tags.routerTag).toContain('/__stx/router.')
      expect(tags.routerTag).toContain('<script src=')
    })

    it('should return empty strings for missing assets', () => {
      const tags = assetTags({})
      expect(tags.runtimeTag).toBe('')
      expect(tags.routerTag).toBe('')
      expect(tags.cssTag).toBe('')
    })
  })

  describe('Build mode in processDirectives', () => {
    const defaultOpts = { partialsDir: '/tmp', componentsDir: '/tmp' }

    it('should emit script src placeholder in compile mode for signals runtime', async () => {
      const html = `<script>const count = state(0)</script><div>{{ count() }}</div>`
      const result = await processDirectives(html, {}, '/test.stx', {
        ...defaultConfig,
        ...defaultOpts,
        buildMode: 'compile',
      }, new Set())

      expect(result).toContain('/__stx/runtime.__STX_HASH__.js')
      expect(result).not.toContain('window.stx.state') // no inline runtime
    })

    it('should inline runtime in dev mode (no buildMode)', async () => {
      const html = `<script>const count = state(0)</script><div>{{ count() }}</div>`
      const result = await processDirectives(html, {}, '/test.stx', {
        ...defaultConfig,
        ...defaultOpts,
      }, new Set())

      // Dev mode: inline runtime
      expect(result).not.toContain('/__stx/runtime.')
    })
  })
})
