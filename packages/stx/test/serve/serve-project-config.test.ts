/**
 * The programmatic `serve()` ignored the project's stx.config.ts.
 *
 * Two things were wrong and they compounded. `serve()` never called
 * `loadStxConfig` at all, so `plugins` never loaded and `_pluginComponentDirs`
 * was unset — every library tag (`<Sidebar>`, `<Button>`) failed to resolve
 * with a "searched paths" list naming only the built-in directories. And two
 * call sites in the request handler read the raw `options.stxOptions` rather
 * than the value every other site used, so even a caller passing options
 * explicitly had them dropped on the request path while the cached path
 * honoured them.
 *
 * The result was that the same project rendered differently depending on
 * whether the dev server or `serve()` started it — the dev server has always
 * loaded the config.
 */
import { describe, expect, it } from 'bun:test'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { serve } from '../../src/serve'

/**
 * A project whose config registers a component directory, with the templates
 * in a SUBDIRECTORY of the project — the layout that exposed the bug, since
 * `loadStxConfig` deliberately does not search parent directories.
 */
function project(): { dir: string, views: string } {
  const dir = mkdtempSync(join(tmpdir(), 'stx-serve-config-'))
  const views = join(dir, 'src', 'views')
  const components = join(dir, 'kit')
  mkdirSync(views, { recursive: true })
  mkdirSync(components, { recursive: true })

  // Absolute, deliberately. A RELATIVE componentsDir in a config is resolved
  // against process.cwd() rather than the config's own directory — a separate,
  // pre-existing bug that would make this fixture depend on where the test
  // runner was launched from. What is under test here is whether the config is
  // read and merged at all, so the fixture avoids that variable.
  writeFileSync(join(dir, 'stx.config.ts'), `export default { componentsDir: ${JSON.stringify(components)} }\n`)
  writeFileSync(join(components, 'Badge.stx'), `<span class="badge">badge</span>\n`)
  writeFileSync(join(views, 'index.stx'), `<div><Badge /></div>\n`)

  return { dir, views }
}

async function bodyOf(url: string): Promise<string> {
  const response = await fetch(url)
  return response.text()
}

describe('serve() and the project config', () => {
  it('resolves a component the config registers', async () => {
    const { dir, views } = project()
    const server = await serve({ port: 0, root: views, configDir: dir, watch: false })

    try {
      const html = await bodyOf(`${server.url}/index`)
      expect(html).toContain('class="badge"')
      // The failure mode was a rendered error block, not an exception.
      expect(html).not.toContain('Error loading component')
    }
    finally {
      server.stop()
    }
  })

  it('reads the config from configDir, not from the served root', async () => {
    // `root` is a subdirectory two levels below the config. Loading from
    // `root` finds nothing, which is what made the first fix look like it
    // had not worked.
    const { dir, views } = project()
    const server = await serve({ port: 0, root: views, configDir: dir, watch: false })

    try {
      expect(await bodyOf(`${server.url}/index`)).toContain('class="badge"')
    }
    finally {
      server.stop()
    }
  })

  it('lets an explicit stxOptions value override the config', async () => {
    const { dir, views } = project()
    const other = join(dir, 'other')
    mkdirSync(other, { recursive: true })
    writeFileSync(join(other, 'Badge.stx'), `<span class="override">override</span>\n`)

    const server = await serve({
      port: 0,
      root: views,
      configDir: dir,
      watch: false,
      stxOptions: { componentsDir: other },
    })

    try {
      const html = await bodyOf(`${server.url}/index`)
      // Both call sites have to honour the merge, or this passes on one route
      // shape and fails on another.
      expect(html).toContain('class="override"')
      expect(html).not.toContain('class="badge"')
    }
    finally {
      server.stop()
    }
  })
})
