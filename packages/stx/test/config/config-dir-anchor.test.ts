/**
 * A relative directory key means the same directory from every cwd.
 *
 * `resolveStxDirectories` joined `componentsDir` / `layoutsDir` / `partialsDir`
 * with `root` and left them relative. Every consumer that needed a real path
 * then reached for `path.resolve(process.cwd(), value)` — so a config saying
 * `componentsDir: 'kit'` pointed at the right directory ONLY when the process
 * happened to be launched from the config's own directory. Serve the same
 * project from anywhere else and every component tag failed, silently: the tag
 * rendered as-is, or as an "Error loading component / Searched paths" block
 * naming directories under the wrong root. That silent shape is what six
 * separate findings in stacksjs/stx#1792 trace back to.
 *
 * These tests deliberately never chdir. They run from the repo root while every
 * fixture lives in a fresh tmpdir, which IS the failing configuration — under
 * the old behaviour `'kit'` resolved beneath the repo root and nothing matched.
 */
import { describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve as resolvePath } from 'node:path'
import { loadStxConfig } from '../../src/config'
import { serve } from '../../src/serve'

/**
 * A project whose config registers a component directory by a RELATIVE name,
 * with the templates in a subdirectory — the layout that exposed the bug.
 */
function project(componentsDir = 'kit'): { dir: string, views: string } {
  const dir = mkdtempSync(join(tmpdir(), 'stx-config-anchor-'))
  const views = join(dir, 'src', 'views')
  mkdirSync(views, { recursive: true })
  mkdirSync(join(dir, componentsDir), { recursive: true })

  writeFileSync(join(dir, 'stx.config.ts'), `export default { componentsDir: ${JSON.stringify(componentsDir)} }\n`)
  writeFileSync(join(dir, componentsDir, 'Badge.stx'), `<span class="badge">badge</span>\n`)
  writeFileSync(join(views, 'index.stx'), `<div><Badge /></div>\n`)

  return { dir, views }
}

describe('a relative componentsDir resolves against the config, not the cwd', () => {
  it('loads as an absolute path under the config directory', async () => {
    const { dir } = project()

    const config = await loadStxConfig(dir)

    expect(config.componentsDir).toBe(join(dir, 'kit'))
    // The precise old value, named so a regression cannot pass by accident.
    expect(config.componentsDir).not.toBe(resolvePath(process.cwd(), 'kit'))
  })

  it('renders the component when served from an unrelated cwd', async () => {
    // process.cwd() is the repo root here, and the fixture is in a tmpdir —
    // exactly the arrangement that used to fail.
    const { dir, views } = project()
    expect(process.cwd()).not.toBe(dir)

    const server = await serve({ port: 0, root: views, configDir: dir, watch: false })
    try {
      const html = await (await fetch(`${server.url}/index`)).text()

      expect(html).toContain('class="badge"')
      // The failure mode was a rendered error block, not an exception, so
      // asserting only on the happy string would let it back in.
      expect(html).not.toContain('Error loading component')
      expect(html).not.toContain('Searched paths')
    }
    finally {
      server.stop()
    }
  })

  it('keeps two projects with the same relative key pointing at their own directories', async () => {
    // The key is identical in both configs; only the config directory differs.
    // Under the old behaviour both collapsed onto the one cwd-relative path.
    const a = project()
    const b = project()

    const configA = await loadStxConfig(a.dir)
    const configB = await loadStxConfig(b.dir)

    expect(configA.componentsDir).toBe(join(a.dir, 'kit'))
    expect(configB.componentsDir).toBe(join(b.dir, 'kit'))
    expect(configA.componentsDir).not.toBe(configB.componentsDir)
  })

  it('names the value the author typed when the directory does not exist', async () => {
    // The warning is all that stands between a mistyped key and a silent miss,
    // so it has to keep pointing at the config line rather than echoing back
    // the absolute path it just computed.
    const dir = mkdtempSync(join(tmpdir(), 'stx-config-anchor-'))
    writeFileSync(join(dir, 'stx.config.ts'), `export default { componentsDir: "nope" }\n`)

    const warnings: string[] = []
    const realWarn = console.warn
    console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
    try {
      await loadStxConfig(dir)
    }
    finally {
      console.warn = realWarn
    }

    const line = warnings.find(w => w.includes('componentsDir'))
    expect(line).toBeDefined()
    expect(line).toContain(join(dir, 'nope'))
    expect(line).toContain('Configured as "nope"')
  })
})

/**
 * Config loading must not depend on which project was loaded first.
 *
 * bunfig merges shallowly, so an array a project never overrode is the SAME
 * object as `defaultConfig`'s — and plugin `setup()` pushes directives,
 * middleware and API routes straight into it. Every later `loadStxConfig` for a
 * different project then inherited them. Order-dependent state like this is
 * what makes a test pass only when another test ran first.
 */
describe('config loading is order-independent across cwds', () => {
  function pluginProject(): string {
    const dir = mkdtempSync(join(tmpdir(), 'stx-config-order-'))
    writeFileSync(join(dir, 'leaky-plugin.ts'), [
      `export default {`,
      `  name: 'leaky',`,
      `  setup(_options: any, ctx: any) {`,
      `    ctx.addDirective({ name: 'leakedDirective', handler: () => '', hasEndTag: false })`,
      `    ctx.addMiddleware({ name: 'leaked-mw', handler: (s: string) => s, timing: 'before' })`,
      `    ctx.addRoute('/leaked', () => new Response('leaked'))`,
      `  },`,
      `}`,
      ``,
    ].join('\n'))
    writeFileSync(join(dir, 'stx.config.ts'), `export default { plugins: [${JSON.stringify(join(dir, 'leaky-plugin.ts'))}] }\n`)
    return dir
  }

  function plainProject(): string {
    const dir = mkdtempSync(join(tmpdir(), 'stx-config-order-'))
    writeFileSync(join(dir, 'stx.config.ts'), `export default { componentsDir: "components" }\n`)
    return dir
  }

  const directiveNames = (config: Awaited<ReturnType<typeof loadStxConfig>>): string[] =>
    (config.customDirectives ?? []).map(d => d.name)

  it('does not leak a plugin\'s directives into the next project loaded', async () => {
    const withPlugin = pluginProject()
    const plain = plainProject()

    // Order matters to the assertion: the plugin project goes FIRST, which is
    // the direction that used to contaminate.
    const pluginConfig = await loadStxConfig(withPlugin)
    const plainConfig = await loadStxConfig(plain)

    expect(directiveNames(pluginConfig)).toContain('leakedDirective')
    expect(directiveNames(plainConfig)).not.toContain('leakedDirective')
  })

  it('does not leak middleware or API routes either', async () => {
    const withPlugin = pluginProject()
    const plain = plainProject()

    await loadStxConfig(withPlugin)
    const plainConfig = await loadStxConfig(plain)

    expect((plainConfig.middleware ?? []).some(m => (m as any).name === 'leaked-mw')).toBe(false)
    expect(Object.keys(plainConfig.apiRoutes ?? {})).not.toContain('/leaked')
  })

  it('still gives a SECOND project the same plugin\'s contributions', async () => {
    // The mirror image of the leak, and the one that cost real functionality:
    // the plugin manager is global and keyed by name, so the second project to
    // list a plugin used to throw "already registered" — from an un-awaited
    // async call, so it escaped the catch as an unhandled rejection and skipped
    // the plugin's setup() entirely. Two apps in one process depending on the
    // same plugin is the ordinary monorepo case, not an exotic one.
    const first = pluginProject()
    const second = pluginProject()

    const firstConfig = await loadStxConfig(first)
    const secondConfig = await loadStxConfig(second)

    expect(directiveNames(firstConfig)).toContain('leakedDirective')
    expect(directiveNames(secondConfig)).toContain('leakedDirective')
    // Registered once, applied once per project — not twice to the second.
    expect(directiveNames(secondConfig).filter(n => n === 'leakedDirective')).toHaveLength(1)
  })

  it('gives a project the same directives whichever order it is loaded in', async () => {
    // The order-independence property itself, stated directly: load a plain
    // project before any plugin project, and again after one, and compare.
    const before = await loadStxConfig(plainProject())
    const namesBefore = directiveNames(before)

    await loadStxConfig(pluginProject())

    const after = await loadStxConfig(plainProject())

    expect(directiveNames(after)).toEqual(namesBefore)
  })
})
