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

    const pixels = new Uint8Array([
      240, 80, 40, 255,
      40, 100, 240, 255,
      30, 180, 100, 255,
      250, 200, 40, 255,
      250, 200, 40, 255,
      30, 180, 100, 255,
      40, 100, 240, 255,
      240, 80, 40, 255,
    ])
    const png = await encode({ data: pixels, width: 4, height: 2, channels: 4 }, 'png')
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
    expect(html).toContain('type="image/avif"')
    expect(html).toContain('type="image/webp"')
    expect(html).toContain('width="4"')
    expect(html).toContain('height="2"')
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
