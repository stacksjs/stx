import { expect, test } from 'bun:test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { withTempDir } from '../src/temp-dir'

test('a production server bundle loads composables from its installed package', async () => {
  await withTempDir('framework-composables-bundled', async (app) => {
    const installed = join(app, 'node_modules/@stacksjs/stx')
    const modules = join(installed, 'dist/composables')
    await mkdir(modules, { recursive: true })
    await writeFile(join(installed, 'package.json'), JSON.stringify({
      name: '@stacksjs/stx',
      type: 'module',
      exports: { './composables': './dist/composables/index.js' },
    }))
    const source = await Bun.file(join(import.meta.dir, '../src/composables/use-animation-frame.ts')).text()
    await writeFile(join(modules, 'use-animation-frame.js'), new Bun.Transpiler({ loader: 'ts' }).transformSync(source))
    await writeFile(join(modules, 'index.js'), 'export { useAnimationFrame } from "./use-animation-frame.js"')
    const entry = join(app, 'entry.ts')
    await writeFile(entry, `
import { runInNewContext } from 'node:vm'
import { getFrameworkComposableScript } from ${JSON.stringify(join(import.meta.dir, '../src/framework-composables.ts'))}
const script = await getFrameworkComposableScript('useAnimationFrame(tick)')
if (!script) throw new Error('the bundled server omitted its requested composable')
const window = { stx: {} }
runInNewContext(script.replace(/^<script[^>]*>/, '').replace(/<\\/script>$/, ''), {
  window,
  document: { hidden: false, addEventListener() {}, removeEventListener() {} },
  requestAnimationFrame: () => 1,
  cancelAnimationFrame() {},
})
const clock = window.stx.useAnimationFrame(() => {}, { immediate: false })
clock.resume()
const resumed = clock.active
clock.stop()
console.log(JSON.stringify({ resumed, stopped: !clock.active }))
`)
    const build = await Bun.build({ entrypoints: [entry], outdir: join(app, 'production'), target: 'bun', minify: true, splitting: true })
    expect(build.success, build.logs.map(log => log.message).join('\n')).toBe(true)
    const executable = build.outputs.find(output => output.kind === 'entry-point')!
    const child = Bun.spawn([process.execPath, executable.path], { cwd: app, stdout: 'pipe', stderr: 'pipe' })
    const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()])
    expect(code, stderr).toBe(0)
    expect(JSON.parse(stdout.trim())).toEqual({ resumed: true, stopped: true })
  })
})
