import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { createTempDir } from '../../stx/src/temp-dir'
import { freePort } from '../../stx/test-utils/test-port'

setDefaultTimeout(60_000)
const port = freePort()
const base = `http://127.0.0.1:${port}`
let directory: string
let serverProcess: ReturnType<typeof Bun.spawn> | null = null

beforeAll(async () => {
  directory = createTempDir('stx-request-body-')
  await Bun.write(path.join(directory, 'views/index.stx'), '<h1>Ready</h1>')
  await Bun.write(path.join(directory, 'server.ts'), `
import { serve } from ${JSON.stringify(path.join(import.meta.dir, '../src/serve.ts'))}
await serve({
  patterns: ['views'], port: ${port}, quiet: true, production: true, imageWarmup: false,
  maxRequestBodySize: 1024,
  async onRequest(request) {
    if (new URL(request.url).pathname === '/upload')
      return new Response(String((await request.arrayBuffer()).byteLength))
    return null
  },
})
`)
  serverProcess = Bun.spawn(['bun', 'server.ts'], { cwd: directory, stdout: 'ignore', stderr: 'ignore' })
  const deadline = Date.now() + 30_000
  while (true) {
    try { const response = await fetch(base); await response.body?.cancel(); break }
    catch {
      if (Date.now() > deadline) throw new Error('The request-body test server did not start')
      await Bun.sleep(100)
    }
  }
})

afterAll(async () => {
  serverProcess?.kill()
  if (serverProcess) await serverProcess.exited
  if (directory) await rm(directory, { recursive: true, force: true })
})

describe('the configured listener body limit', () => {
  it('accepts a body within the configured budget', async () => {
    const response = await fetch(`${base}/upload`, { method: 'POST', body: 'x'.repeat(512) })
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('512')
  })

  it('rejects a body over that budget at the HTTP listener', async () => {
    const response = await fetch(`${base}/upload`, { method: 'POST', body: 'x'.repeat(2048) })
    expect(response.status).toBe(413)
    await response.body?.cancel()
  })
})
