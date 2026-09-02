/**
 * A project's router settings reach the pages the static build generates.
 *
 * `renderPage` hands `injectRouterScript` its own `options.router`, and the
 * object it is given is the resolved `cfg` built in `generateStaticSite`.
 * That object had no `router` key, so the value was `undefined` on every page
 * and no `__stxRouterConfig` was emitted at all — a project that set
 * `container` or `prefetch` in `stx.config.ts` got the client's built-in
 * defaults instead, and the same source navigated differently depending on
 * whether the SSG or the dev server had rendered it (stacksjs/stx#1792 P2).
 *
 * The forwarding at the call site was added first and did nothing, because the
 * key it read was never populated. Nothing failed; the pages were merely wrong.
 * These tests are the thing that was missing — they read the built HTML, so an
 * inert fix cannot pass them.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

let dir = ''
const originalCwd = process.cwd()

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-router-cfg-'))
  await Bun.write(path.join(dir, 'views', 'index.stx'), '<main><h1>Home</h1></main>\n')
})

afterEach(async () => {
  process.chdir(originalCwd)
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

/** Write the project's `stx.config.ts`, the way a real project declares this. */
async function writeConfig(router: Record<string, unknown>): Promise<void> {
  await Bun.write(
    path.join(dir, 'stx.config.ts'),
    `export default ${JSON.stringify({ router }, null, 2)}\n`,
  )
}

async function build(options: Record<string, unknown> = {}): Promise<string> {
  process.chdir(dir)
  const { generateStaticSite } = await import('../../src/ssg')
  await generateStaticSite({ pagesDir: 'views', outputDir: 'dist', ...options })
  const out = path.join(dir, 'dist', 'index.html')
  return existsSync(out) ? readFileSync(out, 'utf8') : ''
}

/** The one line the page carries the config on. */
function routerConfig(html: string): Record<string, unknown> | null {
  const match = html.match(/window\.__stxRouterConfig\s*=\s*(\{.*?\});/s)
  return match ? JSON.parse(match[1]) : null
}

describe('the static build forwards router config', () => {
  it('carries a container declared in stx.config.ts onto the page', async () => {
    await writeConfig({ container: '#app-shell' })

    const config = routerConfig(await build())

    expect(config).not.toBeNull()
    expect(config?.container).toBe('#app-shell')
  })

  it('carries the flags too, including the ones that are false', async () => {
    // `false` is the case a truthy forward drops, and turning a feature off is
    // the reason anyone writes it down.
    await writeConfig({ container: 'main', prefetch: false, viewTransitions: false })

    const config = routerConfig(await build())

    expect(config?.prefetch).toBe(false)
    expect(config?.viewTransitions).toBe(false)
  })

  it('lets an explicit call option win over the config', async () => {
    // Matches every other key in the resolved config: what the caller passes
    // beats what the project declared.
    await writeConfig({ container: '#from-config' })

    const config = routerConfig(await build({ router: { container: '#from-caller' } }))

    expect(config?.container).toBe('#from-caller')
  })
})
