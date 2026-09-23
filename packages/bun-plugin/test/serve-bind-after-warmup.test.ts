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
async function timeToBind(env: Record<string, string>, port: number): Promise<number> {
  const dir = await mkdtemp(path.join(tmpdir(), 'stx-bind-'))
  dirs.push(dir)
  await Bun.write(path.join(dir, 'views', 'index.stx'), '<main>bound</main>')
  await Bun.write(path.join(dir, 'driver.ts'), `import * as realStx from ${JSON.stringify(STX_SRC)}
import { serve } from ${JSON.stringify(SERVE_SRC)}

const stxModule = {
  ...realStx,
  async warmImagePlaceholders() { return 0 },
  async prepareImageDelivery() {
    await Bun.sleep(${WARMUP_MS})
    return { count: 0, fingerprint: '' }
  },
}

serve({ patterns: ['views'], port: ${port}, stxModule: stxModule as any })
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

  // Development wants the server now; the fallbacks are fine until it warms.
  it('binds immediately in development', async () => {
    const elapsed = await timeToBind({ APP_ENV: 'development', NODE_ENV: 'development' }, 45_930 + (process.pid % 20))
    expect(elapsed).toBeLessThan(WARMUP_MS / 2)
  })
})
