import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { encode } from 'ts-images'
import { clearImageDeliveryCatalog, getImageDelivery, isTransparentImage, prepareImageDelivery } from '../../src/builtins/image-delivery'
import { clearImagePlaceholders, getImagePlaceholder, placeholdersWarmed, warmImagePlaceholders } from '../../src/builtins/image-placeholder'
import { imageWorkerSlots } from '../../src/builtins/image-worker'

setDefaultTimeout(120_000)

/**
 * The startup image pass on a worker thread.
 *
 * Every decode and encode in the pass is synchronous TypeScript. Run on the
 * thread that serves, a cold cache held the event loop for minutes: pages
 * took seconds and a proxy in front saw empty responses. `offThread` moves the
 * work and must change nothing else about the result.
 */
describe('image pass off the serving thread', () => {
  let tempDir: string
  let publicDir: string
  const keys = ['/photos/noise.png', '/photos/banner.jpg', '/logo.png']

  /** Noise, so the encoders have real work to do and nothing compresses away. */
  function noise(width: number, height: number, alpha: boolean): Uint8Array {
    const pixels = new Uint8Array(width * height * 4)
    let seed = 1234567
    for (let i = 0; i < pixels.length; i++) {
      seed = (seed * 1103515245 + 12345) >>> 0
      pixels[i] = seed >>> 24
    }
    for (let i = 3; i < pixels.length; i += 4)
      pixels[i] = alpha && i % 16 === 3 ? 0 : 255
    return pixels
  }

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'stx-image-off-thread-'))
    publicDir = join(tempDir, 'public')
    await mkdir(join(publicDir, 'photos'), { recursive: true })
    await writeFile(join(publicDir, 'photos', 'noise.png'), await encode({ data: noise(900, 600, false), width: 900, height: 600, channels: 4 }, 'png'))
    await writeFile(join(publicDir, 'photos', 'banner.jpg'), await encode({ data: noise(700, 300, false), width: 700, height: 300, channels: 4 }, 'jpeg'))
    // Transparent, so the transparency answer has to cross the thread too.
    await writeFile(join(publicDir, 'logo.png'), await encode({ data: noise(96, 96, true), width: 96, height: 96, channels: 4 }, 'png'))
  })

  afterAll(async () => {
    clearImageDeliveryCatalog()
    clearImagePlaceholders()
    await rm(tempDir, { recursive: true, force: true })
  })

  /** Run the pass the way serve() does, measuring the longest the loop went unserviced. */
  async function pass(offThread: boolean, label: string) {
    clearImageDeliveryCatalog()
    clearImagePlaceholders()
    const outputDir = join(tempDir, `out-${label}`)

    let longestStall = 0
    let last = performance.now()
    const ticker = setInterval(() => {
      const now = performance.now()
      longestStall = Math.max(longestStall, now - last)
      last = now
    }, 5)

    const [derived, delivery] = await Promise.all([
      warmImagePlaceholders(publicDir, { cachePath: join(outputDir, 'placeholders.json'), offThread }),
      prepareImageDelivery(publicDir, outputDir, { offThread }),
    ])
    clearInterval(ticker)

    const variants = (await readdir(join(outputDir, '_stx', 'images'))).sort()
    const variantBytes = await Promise.all(variants.map(name => readFile(join(outputDir, '_stx', 'images', name))))
    const catalog = keys.map(key => JSON.parse(JSON.stringify(getImageDelivery(key) ?? null).replaceAll(outputDir, '<out>')))
    return {
      derived,
      delivery,
      variants,
      variantBytes,
      catalog,
      placeholders: keys.map(key => getImagePlaceholder(key)),
      transparent: keys.map(key => isTransparentImage(key)),
      warmed: placeholdersWarmed(),
      longestStall,
    }
  }

  it('produces exactly what the in-thread pass does, and keeps the loop free while it runs', async () => {
    const inThread = await pass(false, 'in-thread')
    const offThread = await pass(true, 'off-thread')

    // Same answer, same files, same names, same bytes.
    expect(offThread.derived).toBe(inThread.derived)
    expect(offThread.delivery).toEqual(inThread.delivery)
    expect(offThread.delivery.count).toBe(3)
    expect(offThread.variants).toEqual(inThread.variants)
    expect(offThread.variants.length).toBeGreaterThan(6)
    expect(offThread.variantBytes.map(bytes => Bun.hash(bytes))).toEqual(inThread.variantBytes.map(bytes => Bun.hash(bytes)))
    expect(offThread.catalog).toEqual(inThread.catalog)
    expect(offThread.catalog.every(entry => entry !== null)).toBe(true)
    expect(offThread.placeholders).toEqual(inThread.placeholders)
    expect(offThread.placeholders.every(entry => entry !== undefined)).toBe(true)
    expect(offThread.transparent).toEqual(inThread.transparent)
    expect(offThread.transparent).toEqual([false, false, true])
    expect(offThread.warmed).toBe(true)

    // The serving thread only received the finished catalog. In-thread, a
    // single encode of the 900px noise image holds the loop for hundreds of
    // milliseconds; any request waiting on it waits that long per `await`.
    expect(offThread.longestStall).toBeLessThan(150)
    expect(inThread.longestStall).toBeGreaterThan(offThread.longestStall)
  })

  it('reports a failure inside the worker the way the in-thread call would', async () => {
    const outputDir = join(tempDir, 'unwritable')
    // A file where the output directory has to be: every variant write fails.
    await writeFile(outputDir, 'not a directory')
    const inThread = await prepareImageDelivery(publicDir, outputDir).then(() => null, (error: Error) => error.message)
    const offThread = await prepareImageDelivery(publicDir, outputDir, { offThread: true }).then(() => null, (error: Error) => error.message)
    expect(inThread).not.toBeNull()
    expect(offThread).toBe(inThread)
  })

  // Serving needs a core of its own.
  it('leaves a core for serving', () => {
    expect(imageWorkerSlots(1)).toBe(1)
    expect(imageWorkerSlots(2)).toBe(1)
    expect(imageWorkerSlots(3)).toBe(2)
    expect(imageWorkerSlots(64)).toBe(2)
  })
})
