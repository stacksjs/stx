/**
 * A placeholder cache written before transparency was recorded stays warm for
 * every source whose header already answers the question.
 *
 * 0.2.320 started recording `transparent` on each cached placeholder and
 * re-derived any entry without it. That was every entry in every deployed
 * app's cache, so the first start after upgrading decoded the whole image tree
 * again -- on top of the variants it was re-encoding -- inside the window a
 * production start holds its bind for. A JPEG cannot be transparent and a PNG
 * with no alpha channel and no `tRNS` cannot either; for those the re-derive
 * could only ever have answered `false`.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { encode } from 'ts-images'
import { sourceAlpha } from '../../src/builtins/image-alpha'
import { clearImagePlaceholders, getImagePlaceholder, warmImagePlaceholders } from '../../src/builtins/image-placeholder'

const LEGACY = 'data:image/svg+xml,legacy'

function pixels(width: number, height: number, alpha: (x: number) => number): Uint8Array {
  const data = new Uint8Array(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = 200
    data[i * 4 + 1] = 90
    data[i * 4 + 2] = 40
    data[i * 4 + 3] = alpha(i % width)
  }
  return data
}

let dir: string
let publicDir: string
let cachePath: string

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'stx-placeholder-legacy-'))
  publicDir = join(dir, 'public')
  cachePath = join(dir, 'placeholders.json')
  const w = 32
  const h = 24
  await Bun.write(join(publicDir, 'photo.jpg'), await encode({ data: pixels(w, h, () => 255), width: w, height: h, channels: 4 } as any, 'jpeg'))
  await Bun.write(join(publicDir, 'clear.png'), await encode({ data: pixels(w, h, x => (x < w / 2 ? 0 : 255)), width: w, height: h, channels: 4 } as any, 'png'))

  // The shape 0.2.319 wrote: everything but `transparent`.
  const legacy: Record<string, unknown> = {}
  for (const name of ['photo.jpg', 'clear.png']) {
    const info = await stat(join(publicDir, name))
    legacy[`/${name}`] = { mtimeMs: info.mtimeMs, size: info.size, dataUrl: LEGACY, color: '#123456' }
  }
  await writeFile(cachePath, JSON.stringify(legacy))
})

afterAll(async () => {
  clearImagePlaceholders()
  await rm(dir, { recursive: true, force: true })
})

describe('sourceAlpha', () => {
  it('rules alpha out for a JPEG and in for an RGBA PNG', () => {
    expect(sourceAlpha(join(publicDir, 'photo.jpg'))).toBe('none')
    expect(sourceAlpha(join(publicDir, 'clear.png'))).toBe('possible')
  })

  it('does not guess about a file it cannot read', () => {
    expect(sourceAlpha(join(publicDir, 'missing.png'))).toBe('unknown')
  })
})

describe('warming against a legacy cache', () => {
  it('reuses the entry for a source that cannot be transparent', async () => {
    clearImagePlaceholders()
    await warmImagePlaceholders(publicDir, { cachePath })

    // Not re-derived: the cached mesh is still the one served.
    expect(getImagePlaceholder('/photo.jpg')).toEqual({ dataUrl: LEGACY, color: '#123456', transparent: false })
  })

  it('still re-derives a source that may be transparent', () => {
    const clear = getImagePlaceholder('/clear.png')
    expect(clear?.dataUrl).not.toBe(LEGACY)
    expect(clear?.transparent).toBe(true)
  })

  it('writes the upgraded answer back, so the next start reads it directly', async () => {
    const cache = JSON.parse(await readFile(cachePath, 'utf8'))
    expect(cache['/photo.jpg']).toMatchObject({ dataUrl: LEGACY, transparent: false })
    expect(cache['/clear.png'].transparent).toBe(true)
  })
})
