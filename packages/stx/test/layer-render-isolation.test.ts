import { expect, it } from 'bun:test'
import { mkdtemp, realpath, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { loadStxConfig } from '../src/config'
import { processDirectives } from '../src/process'
import { clearComponentCache } from '../src/utils'
import { serve } from '../src/serve'
import { renderTemplateString } from '../src/render'

it('isolates shared component caches and runtime config between host applications', async () => {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), 'stx-layer-isolation-')))
  try {
    await Bun.write(path.join(root, 'base/stx.config.ts'), "export default { runtimeConfig: { public: { site: 'BASE' } } }")
    await Bun.write(path.join(root, 'base/components/CachedShell.stx'), '<script server cache>const marker = true</script><NestedLabel />')
    await Bun.write(path.join(root, 'base/components/RuntimeLabel.stx'), '<script server>const site = useRuntimeConfig().site</script><p>{{ site }}</p>')
    for (const app of ['ONE', 'TWO']) {
      await Bun.write(path.join(root, app, 'stx.config.ts'), `export default { extends: ['../base'], runtimeConfig: { public: { site: '${app}' } } }`)
      await Bun.write(path.join(root, app, 'components/NestedLabel.stx'), `<p>${app} CHILD</p>`)
    }
    // Load both first: no cache clearing between renders may hide leakage.
    const one = await loadStxConfig(path.join(root, 'ONE'))
    const two = await loadStxConfig(path.join(root, 'TWO'))
    clearComponentCache()
    const page = path.join(root, 'base/pages/shared.stx')
    const render = (source: string, config: typeof one) => processDirectives(source, {}, page, config, new Set())
    expect(await render('<CachedShell />', one)).toContain('ONE CHILD')
    expect(await render('<CachedShell />', two)).toContain('TWO CHILD')
    expect(await render('<CachedShell />', one)).toContain('ONE CHILD')
    expect(await render('<RuntimeLabel />', one)).toContain('<p>ONE</p>')
    expect(await render('<RuntimeLabel />', two)).toContain('<p>TWO</p>')
    const source = '<script server>const site = useRuntimeConfig().site</script><p>{{ site }}</p>'
    expect(await renderTemplateString(source, page, { options: one })).toContain('<p>ONE</p>')
    await Bun.write(page, source)
    const server = await serve({ root: path.join(root, 'ONE/pages'), configDir: path.join(root, 'ONE'), port: 0, watch: false })
    try { expect(await (await fetch(`${server.url}shared`)).text()).toContain('<p>ONE</p>') }
    finally { server.stop() }
  }
  finally {
    clearComponentCache()
    await rm(root, { recursive: true, force: true })
  }
})
