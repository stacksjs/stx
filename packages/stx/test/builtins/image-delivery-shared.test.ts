/**
 * Every copy of stx in a process reads the one delivery catalog.
 *
 * A production runtime bundles stx into its own chunks and prepares the
 * catalog there, while a component's server script that imports
 * `@stacksjs/stx` loads the copy in node_modules. With the catalog in module
 * scope, that second copy found it empty, and the library `<Image>` served the
 * original files in production while dev, where both imports are one module,
 * looked fine.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import * as first from '../../src/builtins/image-delivery'

// A query string makes Bun load the file as a separate module instance, which
// is what the bundled copy is to the one in node_modules.
const second: typeof first = await import('../../src/builtins/image-delivery.ts?second-copy')

const manifest = {
  source: { width: 64, height: 32, hash: 'h' },
  variants: [
    { format: 'png', width: 64, height: 32, bytes: 900, url: '/_stx/images/hero-64.png' },
    { format: 'avif', width: 64, height: 32, bytes: 200, url: '/_stx/images/hero-64.avif' },
  ],
  sources: { png: '/_stx/images/hero-64.png 64w', avif: '/_stx/images/hero-64.avif 64w' },
  fallback: { format: 'png', width: 64, height: 32, bytes: 900, url: '/_stx/images/hero-64.png' },
} as any

describe('image delivery catalog across module copies', () => {
  afterEach(() => first.clearImageDeliveryCatalog())

  it('is two module instances, or the test proves nothing', () => {
    expect(second).not.toBe(first)
    expect(second.getImageDelivery).not.toBe(first.getImageDelivery)
  })

  it('serves a catalog installed through one copy from the other', () => {
    first.installImageDelivery({ entries: [['/images/hero.png', manifest]], transparent: [] })

    const delivered = second.deliveredImage('/images/hero.png')
    expect(delivered?.src).toBe('/_stx/images/hero-64.png')
    expect(delivered?.sources).toEqual([{ type: 'image/avif', srcset: '/_stx/images/hero-64.avif 64w' }])
  })

  it('shares transparency and clearing too', () => {
    second.installImageDelivery({ entries: [['/images/logo.png', manifest]], transparent: ['/images/logo.png'] })
    expect(first.isTransparentImage('/images/logo.png')).toBe(true)

    first.clearImageDeliveryCatalog()
    expect(second.getImageDelivery('/images/logo.png')).toBeUndefined()
  })
})
