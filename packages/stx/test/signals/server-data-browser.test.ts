import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'
import { injectRouterScript } from '../../src/runtime-injection'
import { extractContainerContent } from '../../src/app-shell'

for (const mode of ['document', 'fragment', 'layout'] as const) {
  it(`hydrates once, refreshes explicitly, and replaces data on ${mode} navigation`, async () => {
    const counts = new Map<string, number>()
    let holdA = false
    let releaseA: (() => void) | undefined
    const view = new WebView({ headless: true })
    const server = Bun.serve({ port: 0, async fetch(request) {
      const url = new URL(request.url)
      const user = url.searchParams.get('user') || 'a'
      if (url.pathname === '/api') {
        counts.set(user, (counts.get(user) || 0) + 1)
        if (holdA && user === 'a') await new Promise<void>(resolve => { releaseA = resolve })
        await Bun.sleep(5)
        return Response.json({ user, count: counts.get(user) })
      }
      // Browsers can request /favicon.ico independently. Rendering a page for that
      // unrelated URL would itself run the server loader and inflate counts.
      if (url.pathname !== '/page' && url.pathname !== '/missing')
        return new Response('Not found', { status: 404 })
      const endpoint = `${url.origin}/api?user=${user}`
      const source = `<!doctype html><html><head><meta name="stx-layout" content="${mode === 'layout' ? user : 'same'}"></head><body>
${url.pathname === '/missing' ? '' : `<script server>
const value = await useServerData('user', () => fetch(${JSON.stringify(endpoint)}).then(r => r.json()))
const empty = await useServerData('empty', () => null)
</script>`}
<script client>
const fetched = useFetch(${JSON.stringify(endpoint)}, { key: 'user' })
const asyncData = useAsyncData(() => fetch(${JSON.stringify(endpoint)}).then(r => r.json()), { key: 'user', immediate: false })
const empty = useFetch('/should-not-fetch', { key: 'empty', immediate: false })
const marker = state(${JSON.stringify(user)})
window.pageData = { fetched, asyncData, empty, marker }
</script>
<main><span id="user" x-text="fetched.data()?.user"></span></main>
</body></html>`
      const html = await injectRouterScript(await processDirectives(source, {}, '/tmp/hydration-page.stx', {
        cache: false, debug: false, router: { cache: false, prefetch: false, viewTransitions: false },
      }, new Set()), { router: { cache: false, prefetch: false, viewTransitions: false } })
      if (mode === 'fragment' && request.headers.get('X-STX-Router') === 'true')
        return new Response(extractContainerContent(html), { headers: {
          'Content-Type': 'text/html', 'X-STX-Fragment': 'true', 'X-STX-Runtime': 'true',
          'X-STX-Layout': 'same', 'X-STX-Layout-Group': 'same',
        } })
      return new Response(html, { headers: { 'Content-Type': 'text/html' } })
    } })
    const ready = async (user: string) => {
      for (let i = 0; i < 100; i++) {
        if (await view.evaluate(`window.pageData?.marker() === ${JSON.stringify(user)} && window.pageData.fetched.data()?.user === ${JSON.stringify(user)}`)) return
        await Bun.sleep(20)
      }
      throw new Error(`Hydration did not finish for ${user}: ${await view.evaluate('JSON.stringify({marker:window.pageData?.marker(),data:window.pageData?.fetched.data(),payload:window.__STX_DATA__})')}`)
    }
    try {
      expect((await fetch(`${server.url}favicon.ico`)).status).toBe(404)
      expect(counts.size).toBe(0)
      await view.navigate(`${server.url}page?user=a`)
      await ready('a')
      await Bun.sleep(100)
      expect(counts.get('a')).toBe(1)
      expect(await view.evaluate('pageData.asyncData.data()')).toEqual({ user: 'a', count: 1 })
      expect(await view.evaluate('pageData.empty.data()')).toBeNull()
      expect(await view.evaluate('pageData.fetched.loading() || pageData.fetched.isFetching()')).toBe(false)
      await view.evaluate('pageData.fetched.refetch()')
      expect(counts.get('a')).toBe(2)
      expect(await view.evaluate('pageData.fetched.data().count')).toBe(2)
      holdA = true
      await view.evaluate('(() => { window.previousData = pageData.fetched; void previousData.refetch(); })()')
      for (let i = 0; i < 100 && !releaseA; i++) await Bun.sleep(10)
      expect(releaseA).toBeDefined()
      await view.evaluate(`window.stxRouter.navigate('/page?user=b')`)
      await ready('b')
      releaseA?.()
      await Bun.sleep(30)
      expect(await view.evaluate('previousData.data().count')).toBe(2)
      expect(await view.evaluate('previousData.error()')).toBeNull()
      expect(counts.get('b')).toBe(1)
      expect(await view.evaluate('pageData.asyncData.data().user')).toBe('b')
      await view.evaluate(`window.stxRouter.navigate('/missing?user=c')`)
      await ready('c')
      expect(counts.get('c')).toBe(1)
      expect(await view.evaluate('pageData.asyncData.data()')).toBeNull()
      // Simultaneous real HTTP SSR renders must keep the same key private.
      const responses = await Promise.all(['private-d', 'private-e'].map(user => fetch(`${server.url}page?user=${user}`).then(r => r.text())))
      expect(responses[0]).toContain('"user":"private-d"')
      expect(responses[0]).not.toContain('"user":"private-e"')
      expect(responses[1]).toContain('"user":"private-e"')
      expect(counts.get('private-d')).toBe(1)
      expect(counts.get('private-e')).toBe(1)
    }
    finally {
      releaseA?.()
      view.close()
      await server.stop(true)
    }
  }, 30_000)
}
