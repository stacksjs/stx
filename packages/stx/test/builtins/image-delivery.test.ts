import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { encode } from 'ts-images'
import { clearImageDeliveryCatalog, prepareImageDelivery } from '../../src/builtins/image-delivery'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

describe('build-time Image delivery', () => {
  let tempDir: string
  let publicDir: string
  let outputDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'stx-image-delivery-'))
    publicDir = join(tempDir, 'public')
    outputDir = join(tempDir, 'dist')
    await mkdir(join(publicDir, 'images'), { recursive: true })

    const width = 64
    const height = 32
    const pixels = new Uint8Array(width * height * 4)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4
        pixels[offset] = (x * 7 + y * 3) % 256
        pixels[offset + 1] = (x * 2 + y * 11) % 256
        pixels[offset + 2] = (x * 13 + y * 5) % 256
        pixels[offset + 3] = 255
      }
    }
    const png = await encode({ data: pixels, width, height, channels: 4 }, 'png')
    await writeFile(join(publicDir, 'images', 'hero.png'), png)
  })

  afterAll(async () => {
    clearImageDeliveryCatalog()
    await rm(tempDir, { recursive: true, force: true })
  })

  it('renders <Image> with responsive formats, intrinsic size, and a content placeholder', async () => {
    const result = await prepareImageDelivery(publicDir, outputDir)
    expect(result.count).toBe(1)
    expect(result.fingerprint).toHaveLength(64)

    const options = { ...defaultConfig, componentsDir: join(tempDir, 'components') } as any
    const html = await processDirectives(
      '<Image src="/images/hero.png" alt="A bright test image" />',
      {},
      join(tempDir, 'page.stx'),
      options,
      new Set<string>(),
    )

    expect(html).toContain('<picture>')
    expect(html).toMatch(/type="image\/(avif|webp)"/)
    expect(html).toContain('width="64"')
    expect(html).toContain('height="32"')
    expect(html).toContain('sizes="100vw"')
    expect(html).toContain('background-image:url(data:image/bmp;base64,')
    expect(html).toContain('/_stx/images/')
  })

  it('keeps a reactive source on an img root instead of binding src to picture', async () => {
    clearImageDeliveryCatalog()
    const options = { ...defaultConfig, componentsDir: join(tempDir, 'components') } as any
    const html = await processDirectives(
      '<Image :src="avatarUrl" alt="Profile photo" />',
      {},
      join(tempDir, 'page.stx'),
      options,
      new Set<string>(),
    )

    expect(html).toMatch(/<img[^>]*:src="avatarUrl"/)
    expect(html).toContain(':src="avatarUrl"')
    expect(html).not.toContain('<picture')
  })
})
