import { afterEach, expect, it } from 'bun:test'
import { mkdtemp, realpath, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { loadStxConfig } from '../src/config'
import { layerManifest, mergeLayerConfig, resolveApplicationLayers } from '../src/application-layers'
import { processDirectives } from '../src/process'
import { buildForProduction } from '../src/production-builder'
import { startProductionServer } from '../src/production-server'
import { getComposableScript, listComposableModules } from '../src/composable-loader'
import { serve } from '../src/serve'
import { createRouter } from '../src/router'

const dirs: string[] = []
const stop: Array<() => void> = []
afterEach(async () => {
  for (const close of stop.splice(0)) close()
  for (const dir of dirs.splice(0)) await rm(dir, { recursive: true, force: true })
  delete (globalThis as any).__layerSetupCount
})
async function fixture(): Promise<string> {
  const dir = await realpath(await mkdtemp(path.join(tmpdir(), 'stx-layers-')))
  dirs.push(dir)
  return dir
}
async function write(root: string, file: string, source: string): Promise<void> {
  await Bun.write(path.join(root, file), source)
}

it('merges objects, replacement arrays and ordered hooks without mutating either input', () => {
  const hook = () => 'base'
  const local = () => 'app'
  const base = { app: { head: { title: 'base', meta: ['old'] } }, middleware: [hook], routeRules: { '/**': { cache: false } } }
  const merged = mergeLayerConfig(base, { app: { head: { title: 'app', meta: ['new'] } }, middleware: [local] })
  expect(merged.app.head).toEqual({ title: 'app', meta: ['new'] })
  expect(merged.middleware.map((fn: () => string) => fn())).toEqual(['base', 'app'])
  expect(base.app.head.meta).toEqual(['old'])
  expect(merged.routeRules).toEqual(base.routeRules)
})

it('resolves nested local and installed-package layers with app-first precedence and anchored paths', async () => {
  const dir = await fixture()
  await write(dir, 'app/stx.config.ts', "export default { extends: ['../brand', '@fixture/layer'], app: { head: { title: 'app' } } }")
  await write(dir, 'brand/stx.config.ts', "export default { extends: ['../foundation'], app: { head: { title: 'brand', bodyClass: 'brand' } }, componentsDir: 'ui' }")
  await write(dir, 'foundation/stx.config.ts', "export default { app: { head: { title: 'foundation', htmlAttrs: { lang: 'en' } } } }")
  await write(dir, 'app/node_modules/@fixture/layer/package.json', '{"name":"@fixture/layer","stx":{"layer":"layer.config.ts"}}')
  await write(dir, 'app/node_modules/@fixture/layer/layer.config.ts', "export default { app: { head: { bodyClass: 'package' } } }")
  const config = await loadStxConfig(path.join(dir, 'app'))
  expect(config.app?.head?.title).toBe('app')
  expect(config.app?.head?.bodyClass).toBe('brand')
  expect(config.app?.head?.htmlAttrs?.lang).toBe('en')
  expect(config._layerGraph?.layers.map(layer => path.relative(dir, layer.root))).toEqual(['app', 'brand', 'foundation', 'app/node_modules/@fixture/layer'])
  expect(config._layerComponentDirs?.[1]).toBe(path.join(dir, 'brand/ui'))
  expect(config.componentsDir).toBe(path.join(dir, 'app/components'))
  const manifest = JSON.stringify(layerManifest(config._layerGraph!))
  expect(manifest).toContain('sha256')
  expect(manifest).not.toContain(dir)
})

it('names cycles and missing layers and refreshes transitive config imports and new resources', async () => {
  const dir = await fixture()
  await write(dir, 'app/stx.config.ts', "export default { extends: ['../base'] }")
  await write(dir, 'base/stx.config.ts', "export default { extends: ['../app'] }")
  await expect(resolveApplicationLayers(path.join(dir, 'app'), {})).rejects.toThrow('Application layer cycle:')
  await expect(serve({ configDir: path.join(dir, 'app'), port: 0, watch: false })).rejects.toThrow('Application layer cycle:')
  await write(dir, 'base/stx.config.ts', "import { title } from './settings'; export default { app: { head: { title } } }")
  await write(dir, 'base/settings.ts', "export const title = 'first'")
  const first = await loadStxConfig(path.join(dir, 'app'))
  expect(first.app?.head?.title).toBe('first')
  await write(dir, 'base/settings.ts', "export const title = 'changed'")
  await write(dir, 'base/pages/new.stx', '<main>new</main>')
  const next = await loadStxConfig(path.join(dir, 'app'))
  expect(next).not.toBe(first)
  expect(next.app?.head?.title).toBe('changed')
  await write(dir, 'base/stx.config.ts', "export default { extends: ['missing-package'] }")
  await expect(loadStxConfig(path.join(dir, 'app'))).rejects.toThrow('Cannot resolve application layer')
})

it('shares pages/layouts/components/partials/composables across two apps with local overrides in dev and production', async () => {
  const dir = await fixture()
  await write(dir, 'base/stx.config.ts', 'export default {}')
  await write(dir, 'base/pages/shared.stx', "@extends('shell')\n@section('content')<SharedCard />@include('footer')@endsection")
  await write(dir, 'base/pages/index.stx', '<main>BASE HOME</main>')
  await write(dir, 'base/layouts/shell.stx', '<html><head></head><body><main>BASE SHELL @yield("content")</main></body></html>')
  await write(dir, 'base/components/SharedCard.stx', '<p>BASE CARD</p>')
  await write(dir, 'base/partials/footer.stx', '<footer>BASE FOOTER</footer>')
  await write(dir, 'base/functions/useLabel.ts', "export function useLabel() { return 'BASE LABEL' }")
  for (const name of ['one', 'two']) await write(dir, `${name}/stx.config.ts`, "export default { extends: ['../base'], ssr: true }")
  await write(dir, 'one/pages/index.stx', '<main>ONE HOME</main>')
  await write(dir, 'one/components/SharedCard.stx', '<p>ONE CARD</p>')
  await write(dir, 'one/layouts/shell.stx', '<html><head></head><body><main>ONE SHELL @yield("content")</main></body></html>')
  await write(dir, 'one/partials/footer.stx', '<footer>ONE FOOTER</footer>')
  await write(dir, 'one/functions/useLabel.ts', "export function useLabel() { return 'ONE LABEL' }")
  for (const name of ['one', 'two']) {
    const app = path.join(dir, name)
    const config = await loadStxConfig(app)
    const dependencies = new Set<string>()
    const html = await processDirectives(await Bun.file(path.join(dir, 'base/pages/shared.stx')).text(), {}, path.join(dir, 'base/pages/shared.stx'), config, dependencies)
    const expected = name === 'one' ? 'ONE' : 'BASE'
    for (const resource of ['SHELL', 'CARD', 'FOOTER']) expect(html).toContain(`${expected} ${resource}`)
    expect(dependencies.has(path.join(dir, 'base/stx.config.ts'))).toBe(true)
    if (name === 'one') expect(config._layerGraph?.overrides?.some(entry => entry.resource === 'components/SharedCard.stx' && entry.winner.includes('/one/'))).toBe(true)
    expect((await listComposableModules(config._layerComposableDirs)).length).toBe(1)
    expect(await getComposableScript(config._layerComposableDirs)).toContain(`${expected} LABEL`)
    const dev = await serve({ root: path.join(app, 'pages'), configDir: app, port: 0, watch: false })
    stop.push(() => dev.stop())
    expect(await (await fetch(`${dev.url}shared`)).text()).toContain(`${expected} CARD`)
    if (name === 'two') {
      await write(dir, 'two/components/SharedCard.stx', '<p>NEW LOCAL CARD</p>')
      expect(await (await fetch(`${dev.url}shared`)).text()).toContain('NEW LOCAL CARD')
      await rm(path.join(app, 'components/SharedCard.stx'))
    }
    const built = await buildForProduction({ root: app })
    const production = await startProductionServer({ outputDir: built.outputDir, port: 0 })
    stop.push(() => production.stop())
    expect(built.pageCount).toBe(2)
    expect(await (await fetch(`http://localhost:${production.port}/`)).text()).toContain(`${expected} HOME`)
    expect(await (await fetch(`http://localhost:${production.port}/shared`)).text()).toContain(`${expected} CARD`)
    expect(await Bun.file(path.join(built.outputDir, 'server/layers.json')).exists()).toBe(true)
  }
})

it('diagnoses same-layer route conflicts and lets app dynamic routes override differently named layer params', async () => {
  const dir = await fixture()
  await write(dir, 'app/pages/users/[id].stx', 'APP')
  await write(dir, 'base/pages/users/[slug].stx', 'BASE')
  const roots = [path.join(dir, 'app/pages'), path.join(dir, 'base/pages')]
  expect(createRouter(dir, { pagesDirs: roots }).map(route => route.pattern)).toEqual(['/users/:id'])
  await write(dir, 'app/pages/users/[name].stx', 'CONFLICT')
  expect(() => createRouter(dir, { pagesDirs: roots })).toThrow('Conflicting layer pages')
})

it('runs relative layer plugins in the declaring directory and preserves hook order', async () => {
  const dir = await fixture()
  await write(dir, 'app/stx.config.ts', "export default { extends: ['../base'], middleware: [{ timing: 'before', handler: (html) => html + 'APP' }] }")
  await write(dir, 'base/stx.config.ts', "export default { plugins: ['./plugin.ts'], middleware: [{ timing: 'before', handler: (html) => html + 'BASE' }] }")
  await write(dir, 'base/plugin.ts', "export default { name: 'layer-test-plugin', setup(_opts, ctx) { globalThis.__layerSetupCount = (globalThis.__layerSetupCount || 0) + 1; ctx.addDirective({ name: 'layerName', handler: () => 'PLUGIN' }) } }")
  const config = await loadStxConfig(path.join(dir, 'app'))
  expect(config.customDirectives.some(directive => directive.name === 'layerName')).toBe(true)
  expect(config.middleware?.map(entry => (entry as any).handler(''))).toEqual(['BASE', 'APP'])
  await write(dir, 'base/pages/new.stx', '<main>new</main>')
  await loadStxConfig(path.join(dir, 'app'))
  expect((globalThis as any).__layerSetupCount).toBe(1)
})

it('the app dev server watches external layers and discovers newly added pages', async () => {
  const dir = await fixture()
  const app = path.join(dir, 'app')
  await write(dir, 'app/stx.config.ts', "export default { extends: ['../base'], shell: false }")
  await write(dir, 'base/stx.config.ts', "export default { componentsDir: '../ui' }")
  await write(dir, 'base/pages/index.stx', '<main><SharedCard /></main>')
  await write(dir, 'ui/SharedCard.stx', '<p>BEFORE EDIT</p>')
  const probe = Bun.serve({ port: 0, fetch: () => new Response('probe') })
  const port = probe.port!
  probe.stop(true)
  await write(dir, 'start.ts', `import { serveApp } from ${JSON.stringify(path.resolve(import.meta.dir, '../src/dev-server/serve-app.ts'))}; await serveApp(${JSON.stringify(app)}, { port: ${port}, watch: true, hotReload: false })`)
  const child = Bun.spawn(['bun', path.join(dir, 'start.ts')], { cwd: app, stdout: 'pipe', stderr: 'pipe' })
  const output = new Response(child.stdout).text()
  const errors = new Response(child.stderr).text()
  async function waitFor(url: string, value: string): Promise<void> {
    for (let i = 0; i < 120; i++) {
      try { if ((await (await fetch(`http://localhost:${port}${url}`)).text()).includes(value)) return }
      catch {}
      if (child.exitCode !== null) throw new Error(await output + await errors)
      await Bun.sleep(50)
    }
    throw new Error(`Dev server never rendered ${value}`)
  }
  try {
    await waitFor('/', 'BEFORE EDIT')
    await write(dir, 'ui/SharedCard.stx', '<p>AFTER EDIT</p>')
    await waitFor('/', 'AFTER EDIT')
    await write(dir, 'base/pages/added.stx', '<main>NEW SHARED PAGE</main>')
    await waitFor('/added', 'NEW SHARED PAGE')
  }
  finally {
    child.kill()
    await child.exited
    await Promise.all([output, errors])
  }
}, 20000)
