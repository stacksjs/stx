import { afterAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

setDefaultTimeout(60_000)

const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')
const STX_SRC = path.join(import.meta.dir, '..', '..', 'stx', 'src', 'index.ts')
const WARMUP_MS = 5000

const dirs: string[] = []

afterAll(async () => {
  await Promise.all(dirs.map(d => rm(d, { recursive: true, force: true })))
})

/**
 * Boot serve() in a subprocess with a deliberately slow image pass, and report
 * how long the port took to accept a connection.
 */
const USES_IMAGE = '<main><StxImage src="/hero.jpg" alt="Hero" /></main>'
const NO_IMAGE = '<main>bound</main>'

async function timeToBind(env: Record<string, string>, port: number, extra: Record<string, unknown> = {}, page = USES_IMAGE): Promise<number> {
  const dir = await mkdtemp(path.join(tmpdir(), 'stx-bind-'))
  dirs.push(dir)
  await Bun.write(path.join(dir, 'views', 'index.stx'), page)
  await Bun.write(path.join(dir, 'driver.ts'), `import * as realStx from ${JSON.stringify(STX_SRC)}
import { serve } from ${JSON.stringify(SERVE_SRC)}

const stxModule = {
  ...realStx,
  async warmImagePlaceholders() { return 0 },
  async prepareImageDelivery(_publicDir: string, outputDir: string) {
    await Bun.write('delivery-dir.txt', outputDir)
    await Bun.sleep(${WARMUP_MS})
    return { count: 0, fingerprint: '' }
  },
}

serve({ patterns: ['views'], port: ${port}, stxModule: stxModule as any, ...${JSON.stringify(extra)} })
`)

  const proc = Bun.spawn(['bun', 'driver.ts'], {
    cwd: dir,
    env: { ...process.env, ...env },
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const started = Date.now()
  try {
    const deadline = started + 40_000
    while (Date.now() < deadline) {
      try {
        const socket = await Bun.connect({ hostname: 'localhost', port, socket: { data() {}, error() {} } })
        socket.end()
        return Date.now() - started
      }
      catch {
        await Bun.sleep(50)
      }
    }
    throw new Error('never bound')
  }
  finally {
    proc.kill()
  }
}

describe('startup image pass and the bind', () => {
  // A zero-downtime deploy overlaps releases on one port. The moment a warming
  // instance binds, the kernel gives it real visitors it cannot yet serve —
  // while the release it is replacing is right there, able to serve them.
  it('does not bind in production until the pass is done', async () => {
    const elapsed = await timeToBind({ APP_ENV: 'production', NODE_ENV: 'production' }, 45_910 + (process.pid % 20))
    expect(elapsed).toBeGreaterThan(WARMUP_MS * 0.7)
  })

  // A project that renders no <StxImage> and no @image gets nothing from the
  // pass, and in production pays for it twice: once in startup, and again in
  // how long a deploy keeps two releases overlapping.
  it('binds immediately in production when the pass is turned off', async () => {
    const elapsed = await timeToBind(
      { APP_ENV: 'production', NODE_ENV: 'production' },
      45_950 + (process.pid % 20),
      { imageWarmup: false },
    )
    expect(elapsed).toBeLessThan(WARMUP_MS / 2)
  })

  // Development wants the server now; the fallbacks are fine until it warms.
  it('binds immediately in development', async () => {
    const elapsed = await timeToBind({ APP_ENV: 'development', NODE_ENV: 'development' }, 45_930 + (process.pid % 20))
    expect(elapsed).toBeLessThan(WARMUP_MS / 2)
  })

  // The default: nothing in the project reads the pass, so it does not run
  // and the release binds at once. A photo-heavy site with no <StxImage> used
  // to spend minutes here and fail its deploy's health check.
  it('skips the pass by default when no template uses <StxImage> or @image', async () => {
    const elapsed = await timeToBind(
      { APP_ENV: 'production', NODE_ENV: 'production' },
      45_970 + (process.pid % 20),
      {},
      NO_IMAGE,
    )
    expect(elapsed).toBeLessThan(WARMUP_MS / 2)
  })

  it('still runs the pass when forced on, whatever the templates use', async () => {
    const elapsed = await timeToBind(
      { APP_ENV: 'production', NODE_ENV: 'production' },
      45_990 + (process.pid % 20),
      { imageWarmup: true },
      NO_IMAGE,
    )
    expect(elapsed).toBeGreaterThan(WARMUP_MS * 0.7)
  })

  // A release directory is new on every deploy; variants kept inside it were
  // re-encoded by every release. STX_IMAGE_CACHE_DIR lets them outlive it.
  it('keeps the variants under STX_IMAGE_CACHE_DIR when it is set', async () => {
    const cache = await mkdtemp(path.join(tmpdir(), 'stx-image-cache-'))
    dirs.push(cache)
    await timeToBind({ APP_ENV: 'production', NODE_ENV: 'production', STX_IMAGE_CACHE_DIR: cache }, 46_010 + (process.pid % 20))

    const dir = dirs.at(-1)!
    let recorded = ''
    for (let i = 0; i < 100 && !recorded; i++) {
      recorded = await Bun.file(path.join(dir, 'delivery-dir.txt')).text().catch(() => '')
      if (!recorded)
        await Bun.sleep(50)
    }
    expect(recorded).toBe(path.join(cache, 'image-delivery'))
  })
})
