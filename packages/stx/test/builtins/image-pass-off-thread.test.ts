import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { encode } from 'ts-images'
import { clearImageDeliveryCatalog, getImageDelivery, isTransparentImage, prepareImageDelivery } from '../../src/builtins/image-delivery'
import { clearImagePlaceholders, getImagePlaceholder, placeholdersWarmed, warmImagePlaceholders } from '../../src/builtins/image-placeholder'
import { imageWorkerSlots, isInstalledEntry, resetImageWorkerWarning } from '../../src/builtins/image-worker'

setDefaultTimeout(120_000)

/** ts-images loads codecs dynamically, including when it is bundled. */
async function installFixtureCodecs(root: string): Promise<void> {
  for (const name of ['@stacksjs/ts-png', 'ts-jpeg', '@stacksjs/ts-webp', '@stacksjs/ts-avif']) {
    const target = join(root, 'node_modules', name)
    await mkdir(dirname(target), { recursive: true })
    await symlink(realpathSync(join(import.meta.dir, '../../../../node_modules', name)), target)
  }
}

/** Each server build gets a fresh bundler, as a deployment build does. */
function bundleFixture(entry: string, outdir: string, splitting = false): void {
  const result = Bun.spawnSync([
    'bun', 'build', entry, '--outdir', outdir, '--target=bun',
    '--entry-naming=serve.js', '--chunk-naming=chunks/[name]-[hash].js',
    ...(splitting ? ['--splitting'] : []),
  ], { stdout: 'pipe', stderr: 'pipe' })
  expect(result.exitCode, result.stderr.toString()).toBe(0)
}

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

  /**
   * A Stacks app's preloader copies `@stacksjs/queue`'s exports onto
   * `globalThis`, its queue `Worker` class among them. The pass used to build
   * its thread with the global, so it built a queue worker, threw on the first
   * `addEventListener`, and the warm-up produced nothing, silently.
   */
  it('does not depend on the global Worker', async () => {
    const original = globalThis.Worker
    let constructed = 0
    class QueueWorker {
      constructor(public queue: string) {
        constructed++
      }

      process(): void {}
    }
    ;(globalThis as any).Worker = QueueWorker

    const warnings: string[] = []
    const warn = console.warn
    console.warn = (...parts: unknown[]) => {
      warnings.push(parts.join(' '))
    }
    resetImageWorkerWarning()
    try {
      const offThread = await pass(true, 'polluted-global')
      expect(constructed).toBe(0)
      expect(offThread.delivery.count).toBe(3)
      expect(offThread.variants.length).toBeGreaterThan(6)
      expect(offThread.catalog.every(entry => entry !== null)).toBe(true)
      expect(offThread.placeholders.every(entry => entry !== undefined)).toBe(true)
      expect(offThread.transparent).toEqual([false, false, true])
      // Still on a worker, not quietly back on this thread.
      expect(offThread.longestStall).toBeLessThan(150)
      expect(warnings.filter(line => line.includes('image worker'))).toEqual([])
    }
    finally {
      console.warn = warn
      globalThis.Worker = original
    }
  })

  // Serving needs a core of its own.
  it('leaves a core for serving', () => {
    expect(imageWorkerSlots(1)).toBe(1)
    expect(imageWorkerSlots(2)).toBe(1)
    expect(imageWorkerSlots(3)).toBe(2)
    expect(imageWorkerSlots(64)).toBe(2)
  })
})

/**
 * A Stacks deploy runs a bundle: `storage/framework/runtime/production/serve.js`
 * with stx inlined into a chunk. Bun's bundler does not follow a worker URL,
 * so the entry beside the source is not beside the chunk, and the pass went
 * back to the serving thread in exactly the deployments it was moved for.
 */
describe('image pass from a bundled server', () => {
  let tempDir: string

  afterAll(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true })
  })

  it('still runs on a worker, using the installed package entry', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'stx-image-bundled-'))
    await installFixtureCodecs(tempDir)
    const src = join(import.meta.dir, '..', '..', 'src')

    // The app's install: `@stacksjs/stx` with its `./*` export, pointing at
    // the source this test runs against.
    const pkg = join(tempDir, 'node_modules', '@stacksjs', 'stx')
    await mkdir(pkg, { recursive: true })
    await writeFile(join(pkg, 'package.json'), JSON.stringify({ name: '@stacksjs/stx', type: 'module', exports: { './*': './src/*.ts' } }))
    await symlink(src, join(pkg, 'src'))

    const pixels = new Uint8Array(900 * 600 * 4)
    let seed = 99
    for (let i = 0; i < pixels.length; i++) {
      seed = (seed * 1103515245 + 12345) >>> 0
      pixels[i] = i % 4 === 3 ? 255 : seed >>> 24
    }
    await mkdir(join(tempDir, 'public'), { recursive: true })
    await writeFile(join(tempDir, 'public', 'noise.png'), await encode({ data: pixels, width: 900, height: 600, channels: 4 }, 'png'))

    await writeFile(join(tempDir, 'entry.ts'), `import { imageWorkerEntry } from ${JSON.stringify(join(src, 'builtins', 'image-worker.ts'))}
import { getImageDelivery, prepareImageDelivery } from ${JSON.stringify(join(src, 'builtins', 'image-delivery.ts'))}

let longestStall = 0
let last = performance.now()
const ticker = setInterval(() => {
  const now = performance.now()
  longestStall = Math.max(longestStall, now - last)
  last = now
}, 5)
const result = await prepareImageDelivery('public', 'out', { offThread: true })
clearInterval(ticker)
console.log(JSON.stringify({ entry: imageWorkerEntry(), result, catalogued: !!getImageDelivery('/noise.png'), longestStall }))
`)
    bundleFixture(join(tempDir, 'entry.ts'), join(tempDir, 'runtime', 'production'), true)

    const run = Bun.spawnSync(['bun', join(tempDir, 'runtime', 'production', 'serve.js')], { cwd: tempDir, stdout: 'pipe', stderr: 'pipe' })
    expect(run.exitCode, run.stderr.toString()).toBe(0)
    const lines = run.stdout.toString().trim().split('\n')
    const report = JSON.parse(lines.at(-1)!)

    // Not beside the chunk (there is nothing there), but the installed one.
    expect(realpathSync(report.entry)).toBe(realpathSync(join(pkg, 'src', 'builtins', 'image-warmup-worker.ts')))
    expect(report.entry.startsWith(join(tempDir, 'runtime'))).toBe(false)
    expect(report.result.count).toBe(1)
    expect(report.catalogued).toBe(true)
    expect(report.longestStall).toBeLessThan(150)
  })

  // With no entry to start, the pass still happens, on this thread, and the
  // log says so once instead of leaving slow first pages unexplained.
  it('falls back to the serving thread, and says why once, when there is no entry to start', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'stx-image-no-entry-'))
    try {
      // A deployed bundle still has its codec dependencies. Omit stx itself
      // here so only the worker-entry lookup fails, rather than image decoding.
      await installFixtureCodecs(dir)
      const src = join(import.meta.dir, '..', '..', 'src')
      const pixels = new Uint8Array(64 * 64 * 4).fill(200)
      await mkdir(join(dir, 'public'), { recursive: true })
      await writeFile(join(dir, 'public', 'flat.png'), await encode({ data: pixels, width: 64, height: 64, channels: 4 }, 'png'))
      await writeFile(join(dir, 'entry.ts'), `import { getImageDelivery, prepareImageDelivery } from ${JSON.stringify(join(src, 'builtins', 'image-delivery.ts'))}
import { getImagePlaceholder, warmImagePlaceholders } from ${JSON.stringify(join(src, 'builtins', 'image-placeholder.ts'))}

const [placeholders, result] = await Promise.all([
  warmImagePlaceholders('public', { offThread: true }),
  prepareImageDelivery('public', 'out', { offThread: true }),
])
console.log(JSON.stringify({ placeholders, result, catalogued: !!getImageDelivery('/flat.png'), placeholder: !!getImagePlaceholder('/flat.png') }))
`)
      // Bundled, and no install beside it: nothing to start.
      bundleFixture(join(dir, 'entry.ts'), join(dir, 'runtime'))

      const run = Bun.spawnSync(['bun', join(dir, 'runtime', 'serve.js')], { cwd: dir, stdout: 'pipe', stderr: 'pipe' })
      expect(run.exitCode, run.stderr.toString()).toBe(0)
      const report = JSON.parse(run.stdout.toString().trim().split('\n').at(-1)!)
      expect(report.result.count).toBe(1)
      expect(report.catalogued).toBe(true)
      expect(report.placeholders).toBe(1)
      expect(report.placeholder).toBe(true)

      const warnings = run.stderr.toString().split('\n').filter(line => line.includes('image worker unavailable'))
      expect(warnings).toHaveLength(1)
      expect(warnings[0]).toContain('no image-warmup-worker entry')
    }
    finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

/**
 * A bundled server with no `node_modules` must not start the worker from
 * Bun's global package cache. Bun's resolver falls back to auto-install there
 * and answered on CI with ~/.bun/install/cache/@stacksjs/stx@0.2.331 - another
 * version than the server was built from, with none of its dependencies - and
 * the worker died on `Cannot find package 'ts-images'` before it was ready.
 */
describe('which worker entry counts as installed', () => {
  const env = { BUN_INSTALL: '/home/runner/.bun' }

  it('accepts the entry from an app\'s node_modules', () => {
    expect(isInstalledEntry('/srv/app/node_modules/@stacksjs/stx/dist/builtins/image-warmup-worker.js', env)).toBe(true)
    expect(isInstalledEntry('C:\\app\\node_modules\\@stacksjs\\stx\\dist\\builtins\\image-warmup-worker.js', env)).toBe(true)
  })

  it('accepts a linked install, which Bun reports by its real path', () => {
    // A workspace or `bun link`: no node_modules in the resolved path at all.
    expect(isInstalledEntry('/Users/me/Code/stx/packages/stx/src/builtins/image-warmup-worker.ts', env)).toBe(true)
  })

  it('refuses a copy in Bun\'s global package cache', () => {
    expect(isInstalledEntry('/home/runner/.bun/install/cache/@stacksjs/stx@0.2.331@@@1/dist/builtins/image-warmup-worker.js', env)).toBe(false)
  })

  it('refuses the cache wherever BUN_INSTALL_CACHE_DIR puts it', () => {
    expect(isInstalledEntry('/var/cache/bun/@stacksjs/stx/dist/builtins/image-warmup-worker.js', { ...env, BUN_INSTALL_CACHE_DIR: '/var/cache/bun' })).toBe(false)
  })

  it('refuses a cache entry by its name, registry-qualified too', () => {
    expect(isInstalledEntry('/elsewhere/@stacksjs/stx@0.2.198@@registry.npmjs.org@@@1/dist/builtins/image-warmup-worker.js', env)).toBe(false)
  })
})
