import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

setDefaultTimeout(60_000)

const PORT = 45_960 + (process.pid % 30)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')
const STX_SRC = path.join(import.meta.dir, '..', '..', 'stx', 'src', 'index.ts')

// How long the fake image pass takes. Long enough that a handler which waits
// for it is unmistakable next to one that does not.
const WARMUP_MS = 6000
const GRACE_MS = 250

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

describe('startup image pass', () => {
  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'stx-image-warmup-'))
    await Bun.write(path.join(dir, 'views', 'index.stx'), '<main>warm</main>')
    await Bun.write(path.join(dir, 'driver.ts'), `import * as realStx from ${JSON.stringify(STX_SRC)}
import { serve } from ${JSON.stringify(SERVE_SRC)}

// Stand in for a public directory full of photographs: the real pass decodes
// every raster it finds, which is seconds of blocked event loop on a large
// site and is exactly the condition under test.
const stxModule = {
  ...realStx,
  async warmImagePlaceholders() {
    return 0
  },
  async prepareImageDelivery() {
    await Bun.sleep(${WARMUP_MS})
    return { count: 0, fingerprint: '' }
  },
}

serve({
  patterns: ['views'],
  port: ${PORT},
  stxModule: stxModule as any,
  imageWarmupGraceMs: ${GRACE_MS},
})
`)

    proc = Bun.spawn(['bun', 'driver.ts'], {
      cwd: dir,
      env: { ...process.env, APP_ENV: 'production', NODE_ENV: 'production' },
      stdout: 'pipe',
      stderr: 'pipe',
    })

    // Wait for the socket at the TCP level, deliberately without sending a
    // request. An HTTP probe would be the very thing under test: it would sit
    // in the handler for the whole pass, and by the time it returned the pass
    // would be over and the measurement below meaningless.
    const deadline = Date.now() + 30_000
    while (true) {
      try {
        const socket = await Bun.connect({
          hostname: 'localhost',
          port: PORT,
          socket: { data() {}, error() {} },
        })
        socket.end()
        break
      }
      catch {
        if (Date.now() > deadline)
          throw new Error('serve() subprocess never bound')
        await Bun.sleep(50)
      }
    }
  })

  afterAll(async () => {
    proc?.kill()
    await rm(dir, { recursive: true, force: true })
  })

  it('answers while the pass is still running instead of waiting it out', async () => {
    const started = Date.now()
    const res = await fetch(BASE)
    const elapsed = Date.now() - started

    expect(res.status).toBe(200)
    expect(await res.text()).toContain('warm')

    // The request may pay the grace; it must not pay the pass. Blocking on the
    // pass is what closed production connections after Bun's 30s idleTimeout
    // having sent nothing — an ERR_EMPTY_RESPONSE for everyone who arrived
    // during a restart.
    expect(elapsed).toBeLessThan(WARMUP_MS / 2)
  })
})
