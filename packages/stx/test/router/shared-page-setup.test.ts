import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { getRouterScript } from '../../../router/src/client'
import { getServeClientAsset, getServeModuleBundle } from '../../src/caching'
import { getCssServeAsset } from '../../src/dev-server/ts-css'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'

it('uses fresh server data with a shared setup across full-document router swaps', async () => {
  const dir = createTempDir('stx-shared-page-setup-')
  const view = new WebView({ headless: true })
  let server: ReturnType<typeof Bun.serve> | undefined
  try {
    await Bun.write(join(dir, 'counter-label.ts'), 'export const counterLabel = "Count"')
    const template = `<!doctype html><html><head></head><body><main>
      <output id="count" :class="tone()">{{ label() }}</output>
      <script client>
        import { counterLabel } from './counter-label'
        const description = "${'shared-setup-body-'.repeat(300)}"
        const tone = state('font-bold')
        const count = state(initialCount)
        const label = derived(() => counterLabel + ': ' + count())
      </script>
    </main></body></html>`
    const router = `<script>window.__stxRouterConfig={container:'main',viewTransitions:false,progress:false,prefetch:false}</script><script>${getRouterScript()}</script>`
    const pages = new Map<string, string>()
    const options = { buildMode: 'serve', externalizePageSetup: true, cache: false } as const
    for (const [page, initialCount] of [['/first', 3], ['/second', 9]] as const) {
      const html = await processDirectives(template, { initialCount }, join(dir, 'counter.stx'), options, new Set())
      const close = html.lastIndexOf('</body>')
      expect(close).toBeGreaterThan(-1)
      pages.set(page, html.slice(0, close) + router + html.slice(close))
    }
    const factoryLink = (html: string) => /data-stx-page-factory src="([^"]+)"/.exec(html)?.[1]
    const factory = factoryLink(pages.get('/first')!)
    expect(factory).toBeDefined()
    expect(factoryLink(pages.get('/second')!)).toBe(factory)

    server = Bun.serve({
      port: 0,
      async fetch(request) {
        const pathname = new URL(request.url).pathname
        if (pages.has(pathname))
          return new Response(pages.get(pathname), { headers: { 'content-type': 'text/html' } })
        const match = /^\/_stx\/(modules|runtime|css)\.([0-9a-f]{16})\.(js|css)$/.exec(pathname)
        if (match) {
          const [, kind, hash] = match
          const content = kind === 'modules' ? getServeModuleBundle(hash)
            : kind === 'css' ? getCssServeAsset(hash)
            : (await getServeClientAsset('runtime')).content
          if (content !== undefined)
            return new Response(content, { headers: { 'content-type': kind === 'css' ? 'text/css' : 'text/javascript' } })
        }
        return new Response(null, { status: 404 })
      },
    })

    const renderedCount = async (expected: string) => {
      for (let attempt = 0; attempt < 100; attempt++) {
        if (await view.evaluate('document.querySelector("#count")?.textContent') === expected)
          return
        await Bun.sleep(25)
      }
      expect(await view.evaluate('document.querySelector("#count")?.textContent')).toBe(expected)
    }
    await view.navigate(`http://localhost:${server.port}/first`)
    await renderedCount('Count: 3')
    for (let attempt = 0; attempt < 100 && !await view.evaluate('!!window.stxRouter'); attempt++)
      await Bun.sleep(25)
    expect(await view.evaluate('!!window.stxRouter')).toBe(true)
    expect(await view.evaluate('getComputedStyle(document.querySelector("#count")).fontWeight')).toBe('700')
    await view.evaluate('(() => { window.sharedSetupTestMarker = true; window.stxRouter.navigate("/second"); return true })()')
    await renderedCount('Count: 9')
    expect(await view.evaluate('window.sharedSetupTestMarker')).toBe(true)
    await view.evaluate('(() => { window.stxRouter.navigate("/first"); return true })()')
    await renderedCount('Count: 3')
  }
  finally {
    view.close()
    server?.stop(true)
    rmSync(dir, { recursive: true, force: true })
  }
}, 30_000)
