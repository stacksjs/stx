import { expect, test } from 'bun:test'
import { link, readdir, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { encode } from 'ts-images'
import { clearImageDeliveryCatalog, getImageDelivery } from '../../src/builtins/image-delivery'
import { generateStaticSite } from '../../src/ssg'
import { createTempDir } from '../../src/temp-dir'

test('a clean cached build reuses matching variants and drops the previous output', async () => {
  const root = createTempDir('stx-ssg-image-reuse-')
  const pagesDir = join(root, 'pages')
  const publicDir = join(root, 'public')
  const outputDir = join(root, 'dist')
  const cacheDir = join(root, 'cache')
  const source = join(publicDir, 'cover.png')
  const build = () => generateStaticSite({ pagesDir, outputDir, publicDir, cacheDir, cleanOutput: true, cache: true })

  try {
    await Bun.write(join(pagesDir, 'index.stx'), '<main><Image src="/cover.png" alt="Cover" /></main>')
    await Bun.write(source, await encode({ width: 12, height: 8, data: new Uint8Array(12 * 8 * 4).fill(255), channels: 4 }, 'png'))

    const first = await build()
    expect(first.failedCount).toBe(0)
    const original = getImageDelivery('/cover.png')!
    const incomplete = original.variants.find(variant => variant.path !== original.fallback.path)!
    const witness = join(root, 'previous-variant')
    await link(original.fallback.path, witness)
    await Bun.write(incomplete.path, '')
    const stale = join(outputDir, '_stx', 'images', 'stale.png')
    await Bun.write(stale, 'abandoned variant')
    await Bun.write(join(outputDir, 'stale.html'), 'abandoned page')

    const second = await build()
    expect(second.failedCount).toBe(0)
    expect(second.cachedCount).toBe(1)
    expect((await stat(original.fallback.path)).ino).toBe((await stat(witness)).ino)
    expect((await stat(incomplete.path)).size).toBe(incomplete.bytes)
    expect(await Bun.file(stale).exists()).toBe(false)
    expect(await Bun.file(join(outputDir, 'stale.html')).exists()).toBe(false)

    await Bun.write(source, await encode({ width: 8, height: 12, data: new Uint8Array(8 * 12 * 4).fill(255), channels: 4 }, 'png'))
    const changed = await build()
    expect(changed.failedCount).toBe(0)
    expect(changed.cachedCount).toBe(0)
    expect(await Bun.file(original.fallback.path).exists()).toBe(false)
    const current = getImageDelivery('/cover.png')!
    expect(await Bun.file(join(outputDir, 'index.html')).text()).toContain(current.fallback.url)
    expect(await Bun.file(current.fallback.path).exists()).toBe(true)
    expect((await readdir(root)).some(entry => entry.startsWith('.stx-images-'))).toBe(false)
  }
  finally {
    clearImageDeliveryCatalog()
    await rm(root, { recursive: true, force: true })
  }
})
