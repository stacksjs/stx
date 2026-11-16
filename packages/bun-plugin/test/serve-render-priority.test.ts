import { expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { createTempDir } from '../../stx/src/temp-dir'
import { freePort } from '../../stx/test-utils/test-port'

it('serves a navigation fragment before an earlier speculative render over real HTTP', async () => {
  const directory = createTempDir('stx-render-priority-')
  const base = `http://127.0.0.1:${freePort()}`
  const controller = new AbortController()
  let serverProcess: ReturnType<typeof Bun.spawn> | undefined
  const requests: Promise<Response>[] = []
  try {
    await Bun.write(path.join(directory, 'control.ts'), `
const pending = new Map<string, () => void>()
export const started: string[] = [], seen: string[] = []
export async function hold(label: string) {
  started.push(label)
  await new Promise<void>(resolve => pending.set(label, resolve))
  pending.delete(label)
}
export function release(label: string) {
  if (label === 'all') for (const resolve of pending.values()) resolve()
  else pending.get(label)?.()
}
`)
    await Bun.write(path.join(directory, 'views', 'pages', '[id].stx'), `<script server>
import { hold } from '../../control'
await hold(params.id)
const label = params.id
</script><main>FINISHED:{{ label }}</main>`)
    await Bun.write(path.join(directory, 'driver.ts'), `
import { serve } from ${JSON.stringify(path.join(import.meta.dir, '../src/serve.ts'))}
import { release, started, seen } from './control'
serve({ patterns: ['views'], port: ${new URL(base).port}, renderConcurrency: 1, renderQueueLimit: 4, renderQueueTimeoutMs: 1500,
  onRequest(request) {
    const url = new URL(request.url)
    if (url.pathname === '/__control') {
      if (url.searchParams.has('release')) release(url.searchParams.get('release')!)
      return Response.json({ started, seen })
    }
    seen.push(url.pathname)
  },
})
`)
    serverProcess = Bun.spawn([process.execPath, 'driver.ts'], { cwd: directory, stdout: 'ignore', stderr: 'ignore' })
    const control = async (query = '') => (await fetch(`${base}/__control${query}`)).json() as Promise<{ started: string[], seen: string[] }>
    const until = async (predicate: (state: Awaited<ReturnType<typeof control>>) => boolean) => {
      for (let i = 0; i < 500; i++) {
        try { if (predicate(await control())) return }
        catch {}
        await Bun.sleep(10)
      }
      throw new Error('The real render server did not reach the expected state')
    }
    await until(() => true)
    const request = (name: string, headers: Record<string, string>) => {
      const response = fetch(`${base}/pages/${name}`, { headers, signal: controller.signal })
      requests.push(response)
      return response
    }
    const active = request('active', { Purpose: 'prefetch' })
    await until(state => state.started.includes('active'))
    const preload = request('preload', { 'Sec-Purpose': 'prefetch' })
    await until(state => state.seen.includes('/pages/preload'))
    const navigation = request('navigation', { 'X-STX-Router': 'true' })
    await until(state => state.seen.includes('/pages/navigation'))
    await control('?release=active')
    await until(state => state.started.length > 1)
    expect((await control()).started).toEqual(['active', 'navigation'])
    await control('?release=navigation')
    await until(state => state.started.includes('preload'))
    await control('?release=preload')
    for (const [response, label] of [[active, 'active'], [navigation, 'navigation'], [preload, 'preload']] as const) {
      const result = await response
      expect(result.status).toBe(200)
      expect(await result.text()).toContain(`FINISHED:${label}`)
    }
  }
  finally {
    controller.abort()
    serverProcess?.kill()
    if (serverProcess) await serverProcess.exited
    await Promise.allSettled(requests)
    await rm(directory, { recursive: true, force: true })
  }
}, 60_000)
