import { afterAll, beforeAll, expect, it, setDefaultTimeout } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { freePort } from '../../stx/test-utils/test-port'
import { createTempDir } from '../../stx/src/temp-dir'

// HTTP catches admission, proxy bypass and request-context isolation together.
// It deliberately does not make an RSS assertion against a particular runtime.
setDefaultTimeout(60_000)
const port = freePort()
const base = `http://127.0.0.1:${port}`
let dir: string
let proc: ReturnType<typeof Bun.spawn> | undefined

async function control(query = ''): Promise<{ started: string[], seen: string[] }> {
  return (await fetch(`${base}/__control${query}`)).json()
}

async function untilStarted(label: string): Promise<void> {
  for (let i = 0; i < 100; i++) {
    if ((await control()).started.includes(label))
      return
    await Bun.sleep(10)
  }
  throw new Error(`render did not start: ${label}`)
}

beforeAll(async () => {
  dir = createTempDir('stx-render-admission-')
  await Bun.write(path.join(dir, 'control.ts'), `
const pending = new Map<string, () => void>()
export const started: string[] = []
export const seen: string[] = []
export async function hold(label: string) {
  started.push(label)
  await new Promise<void>(resolve => pending.set(label, resolve))
  pending.delete(label)
}
export function release(label: string) {
  if (label === 'all') for (const done of pending.values()) done()
  else pending.get(label)?.()
}
`)
  const view = (modulePath: string) => `<script server>
import { hold } from '${modulePath}'
const label = query.label
await hold(label)
const identity = cookies.viewer
</script><main>ADMITTED:{{ label }}:{{ identity }}:END</main>`
  await Bun.write(path.join(dir, 'views', 'static.stx'), view('../control'))
  await Bun.write(path.join(dir, 'views', 'dynamic', '[id].stx'), view('../../control'))
  await Bun.write(path.join(dir, 'public', 'health.txt'), 'static asset')
  await Bun.write(path.join(dir, 'views', 'failed.stx'), '<script>document.getElementById("capacity-test")</script>')
  await Bun.write(path.join(dir, 'stx.config.ts'), 'export default { strict: { enabled: true, failOnViolation: true } }')
  await Bun.write(path.join(dir, 'driver.ts'), `
import { serve } from ${JSON.stringify(path.join(import.meta.dir, '..', 'src', 'serve.ts'))}
import { release, started, seen } from './control'
serve({
  patterns: ['views'], port: ${port}, renderConcurrency: 1, renderQueueLimit: 1, renderQueueTimeoutMs: 1500,
  onRequest(req) {
    const url = new URL(req.url)
    if (url.pathname === '/__control') {
      if (url.searchParams.has('release')) release(url.searchParams.get('release')!)
      return Response.json({ started, seen })
    }
    seen.push(url.searchParams.get('label') || url.pathname)
  },
})
`)
  proc = Bun.spawn(['bun', 'driver.ts'], { cwd: dir, stdout: 'pipe', stderr: 'pipe' })
  for (let i = 0; i < 500; i++) {
    try {
      await control()
      return
    }
    catch { await Bun.sleep(50) }
  }
  proc.kill()
  await proc.exited
  throw new Error('serve did not bind: ' + await new Response(proc.stderr).text() + await new Response(proc.stdout).text())
})

afterAll(async () => {
  proc?.kill()
  if (proc) await proc.exited
  if (dir) await rm(dir, { recursive: true, force: true })
})

it('bounds static and dynamic renders while API hooks and assets keep answering', async () => {
  const alpha = fetch(`${base}/dynamic/one?label=alpha`, { headers: { cookie: 'viewer=alice' } })
  let beta: Promise<Response> | undefined
  try {
    await untilStarted('alpha')
    beta = fetch(`${base}/static?label=beta`, { headers: { cookie: 'viewer=bob' } })
    for (let i = 0; i < 100 && !(await control()).seen.includes('beta'); i++) await Bun.sleep(10)
    expect((await control()).started).toEqual(['alpha'])
    expect(await (await fetch(`${base}/health.txt`)).text()).toBe('static asset')
    const refused = await fetch(`${base}/dynamic/three?label=gamma`, { signal: AbortSignal.timeout(2000) })
    expect(refused.status).toBe(503)
    expect(refused.headers.get('retry-after')).toBe('1')
    expect(refused.headers.get('cache-control')).toBe('no-store')
    expect((await fetch(`${base}/_stx/component/Heavy`)).status).toBe(503)
    expect((await control()).started).toEqual(['alpha'])
    await control('?release=alpha')
    await untilStarted('beta')
    await control('?release=beta')
    expect(await (await alpha).text()).toContain('ADMITTED:alpha:alice:END')
    expect(await (await beta).text()).toContain('ADMITTED:beta:bob:END')
  }
  finally {
    await control('?release=all')
    await Promise.allSettled([alpha, ...(beta ? [beta] : [])])
  }
})


it('expires queued work without running its script and admits the next visitor', async () => {
  const active = fetch(`${base}/dynamic/one?label=timeout-active`)
  let next: Promise<Response> | undefined
  try {
    await untilStarted('timeout-active')
    const expired = await fetch(`${base}/static?label=expired`)
    expect(expired.status).toBe(503)
    expect((await control()).started).not.toContain('expired')
    next = fetch(`${base}/static?label=after-timeout`, { headers: { cookie: 'viewer=next' } })
    await control('?release=timeout-active')
    await untilStarted('after-timeout')
    await control('?release=after-timeout')
    expect(await (await next).text()).toContain('ADMITTED:after-timeout:next:END')
  }
  finally {
    await control('?release=all')
    await Promise.allSettled([active, ...(next ? [next] : [])])
  }
})

it('removes an aborted queued visitor before running their script', async () => {
  const active = fetch(`${base}/dynamic/one?label=abort-active`)
  const abort = new AbortController()
  let queued: Promise<unknown> | undefined
  try {
    await untilStarted('abort-active')
    queued = fetch(`${base}/static?label=aborted`, { signal: abort.signal }).catch(() => undefined)
    for (let i = 0; i < 100 && !(await control()).seen.includes('aborted'); i++) await Bun.sleep(10)
    abort.abort()
    await queued
    await control('?release=abort-active')
    await (await active).text()
    // A later HTTP round trip observes any render that the released slot ran.
    expect((await control()).started).not.toContain('aborted')
  }
  finally {
    abort.abort()
    await control('?release=all')
    await Promise.allSettled([active, ...(queued ? [queued] : [])])
  }
})


it('keeps disconnected active work counted until its script finishes', async () => {
  const abort = new AbortController()
  const active = fetch(`${base}/dynamic/one?label=disconnected`, { signal: abort.signal }).catch(() => undefined)
  let next: Promise<Response> | undefined
  try {
    await untilStarted('disconnected')
    abort.abort()
    await active
    next = fetch(`${base}/static?label=after-disconnect`)
    for (let i = 0; i < 100 && !(await control()).seen.includes('after-disconnect'); i++) await Bun.sleep(10)
    const full = await fetch(`${base}/static?label=must-not-start`)
    expect(full.status).toBe(503)
    expect((await control()).started).not.toContain('after-disconnect')
    await control('?release=disconnected')
    await untilStarted('after-disconnect')
    await control('?release=after-disconnect')
    expect((await next).status).toBe(200)
  }
  finally {
    abort.abort()
    await control('?release=all')
    await Promise.allSettled([active, ...(next ? [next] : [])])
  }
})

it('releases capacity after a template validation failure', async () => {
  expect((await fetch(`${base}/failed`)).status).toBe(500)
  const next = fetch(`${base}/static?label=after-failure`)
  try {
    await untilStarted('after-failure')
    await control('?release=after-failure')
    expect((await next).status).toBe(200)
  }
  finally {
    await control('?release=all')
    await Promise.allSettled([next])
  }
})
