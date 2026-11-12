import { afterEach, beforeEach, describe, expect, setDefaultTimeout, test } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'

setDefaultTimeout(60000)

/**
 * A page whose client script imports a module needs that script bundled, and
 * the bundle is itself a `Bun.build`. Rendering used to happen inside the
 * outer build's `.stx` loader, so the second build was started from a plugin
 * callback of the first - and Bun never settles a build started there. The
 * outer build waited on its loader, the loader waited on the inner build, and
 * the process sat idle forever with nothing printed.
 *
 * It only happened with a cold bundle cache, which is why it looked random: a
 * project that had ever run its dev server had the bundle on disk, and the
 * inner build was skipped. A fresh checkout, a CI runner, or a directory of
 * views no dev server had rendered (a desktop app's `resources/desktop`) hung
 * on the first build.
 *
 * Each case runs in its own process with a deadline. A hang inside the test
 * process would leave a build that never ends behind for every later test.
 */
describe('BUN-PLUGIN: a build that needs a client bundle', () => {
  let project = ''

  beforeEach(async () => {
    // Fresh every time: no bundle cache, no template cache.
    project = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'stx-nested-build-'))
    await fs.promises.mkdir(path.join(project, 'pages'), { recursive: true })
    await fs.promises.mkdir(path.join(project, 'lib'), { recursive: true })
    await Bun.write(path.join(project, 'lib/greeting.ts'), `export function greeting(name: string): string {\n  return 'hello-from-module ' + name\n}\n`)
  })

  afterEach(async () => {
    await fs.promises.rm(project, { recursive: true, force: true })
  })

  function page(title: string): string {
    return `<script client>
import { greeting } from '../lib/greeting'

const message = state(greeting('${title}'))
</script>

<!DOCTYPE html>
<html><head><title>${title}</title></head>
<body><p id="message">{{ message }}</p></body>
</html>
`
  }

  /** Build the given entrypoints with the plugin in a child process; killed if it does not finish. */
  async function build(entrypoints: string[], script = ''): Promise<{ exitCode: number | null, timedOut: boolean, output: string }> {
    const runner = path.join(project, 'build.ts')
    await Bun.write(runner, script || `import { stxPlugin } from ${JSON.stringify(path.join(import.meta.dir, '../src/index.ts'))}

const result = await Bun.build({
  entrypoints: ${JSON.stringify(entrypoints)},
  outdir: 'dist',
  plugins: [stxPlugin()],
})
console.log('BUILD_SETTLED', result.success, result.outputs.length)
`)
    const child = Bun.spawn([process.execPath, runner], { cwd: project, stdout: 'pipe', stderr: 'pipe', env: { ...process.env, STX_DIR: '' } })
    let timedOut = false
    const deadline = setTimeout(() => {
      timedOut = true
      child.kill(9)
    }, 30000)
    const [stdout, stderr, exitCode] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited])
    clearTimeout(deadline)
    return { exitCode, timedOut, output: `${stdout}\n${stderr}` }
  }

  test('finishes from a cold cache, with the imported module in the page', async () => {
    await Bun.write(path.join(project, 'pages/index.stx'), page('index'))

    const result = await build(['pages/index.stx'])
    expect(result.timedOut).toBe(false)
    expect(result.output).toContain('BUILD_SETTLED true')

    const html = await Bun.file(path.join(project, 'dist/index.html')).text()
    // The import was bundled, not left as a raw `import` in a classic script.
    expect(html).toContain('hello-from-module')
    expect(html).not.toMatch(/import\s*\{\s*greeting\s*\}/)
  })

  test('finishes for several pages that each need a bundle', async () => {
    for (const name of ['index', 'about', 'pricing'])
      await Bun.write(path.join(project, `pages/${name}.stx`), page(name))

    const result = await build(['pages/index.stx', 'pages/about.stx', 'pages/pricing.stx'])
    expect(result.timedOut).toBe(false)
    expect(result.output).toContain('BUILD_SETTLED true')
    for (const name of ['index', 'about', 'pricing'])
      expect(await Bun.file(path.join(project, `dist/${name}.html`)).text()).toContain('hello-from-module')
  })

  test('finishes when the entrypoint is given as an absolute path', async () => {
    await Bun.write(path.join(project, 'pages/index.stx'), page('index'))

    const result = await build([path.join(project, 'pages/index.stx')])
    expect(result.timedOut).toBe(false)
    expect(result.output).toContain('BUILD_SETTLED true')
  })

  test('a page that is imported, not an entrypoint, fails with a reason instead of hanging', async () => {
    await Bun.write(path.join(project, 'pages/index.stx'), page('index'))
    await Bun.write(path.join(project, 'main.ts'), `import page from './pages/index.stx'\n\nconsole.log(page)\n`)

    // Only known to the plugin inside its loader, where a second build would never end.
    const result = await build(['main.ts'])
    expect(result.timedOut).toBe(false)
    expect(result.exitCode).not.toBeNull()
    expect(result.output).toContain('inside a Bun.build loader')
    expect(result.output).toContain('pages/index.stx')
  })

  test('the same imported page builds once its bundle is cached', async () => {
    await Bun.write(path.join(project, 'pages/index.stx'), page('index'))
    await Bun.write(path.join(project, 'main.ts'), `import page from './pages/index.stx'\n\nconsole.log(page)\n`)

    // Built as an entrypoint first: the client bundle is now on disk.
    expect((await build(['pages/index.stx'])).output).toContain('BUILD_SETTLED true')
    const result = await build(['main.ts'])
    expect(result.timedOut).toBe(false)
    expect(result.output).not.toContain('inside a Bun.build loader')
  })
})
