import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createTempDir, removeTempDir } from '../packages/stx/src/temp-dir'

const root = process.cwd()
// Removed when the smoke passes, and on exit or interrupt when it does not.
const smokeRoot = createTempDir('installed-smoke')

function run(cmd: string[], cwd = smokeRoot): void {
  const result = Bun.spawnSync(cmd, {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  })

  if (result.exitCode !== 0) {
    console.error(result.stdout.toString())
    console.error(result.stderr.toString())
    throw new Error(`${cmd.join(' ')} failed with exit code ${result.exitCode}`)
  }
}

mkdirSync(join(smokeRoot, 'pages'), { recursive: true })
mkdirSync(join(smokeRoot, 'node_modules'), { recursive: true })

const dependencies: Record<string, string> = {}
const archives = join(smokeRoot, 'archives')
mkdirSync(archives)
for (const directory of ['desktop', 'sanitizer', 'router', 'bun-plugin', 'stx', 'components']) {
  const packageDir = join(root, 'packages', directory)
  const manifest = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'))
  const archive = join(archives, `${directory}.tgz`)
  run(['bun', 'pm', 'pack', '--ignore-scripts', '--filename', archive], packageDir)
  // Keep each archive's bytes unchanged. Normal Bun workspaces resolve this
  // unpublished cohort together, without reaching for its not-yet-public
  // transitive versions or linking any file from the original checkout.
  await new Bun.Archive(await Bun.file(archive).bytes()).extract(join(smokeRoot, 'packages', directory))
  dependencies[manifest.name] = 'workspace:*'
}
const workspace = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
writeFileSync(join(smokeRoot, 'package.json'), JSON.stringify({
  name: 'stx-installed-smoke',
  type: 'module',
  private: true,
  workspaces: ['packages/*/package'],
  dependencies,
  devDependencies: { 'better-dx': workspace.devDependencies['better-dx'] },
}, null, 2))
writeFileSync(join(smokeRoot, 'bunfig.toml'), '[install]\nlinker = "hoisted"\n')
// Install the actual publishable archives. Checkout symlinks accidentally make
// unshipped source files visible and cannot prove a published consumer works.
run(['bun', 'install'])
run(['bun', 'install', '--frozen-lockfile'])

writeFileSync(join(smokeRoot, 'pages', 'index.stx'), `<script server>
export const products = [
  { name: 'Cedar Wick Candle', price: '$28' },
  { name: 'Botanical Gift Box', price: '$54' },
  { name: 'Mineral Bath Salts', price: '$18' },
]
</script>

<!doctype html>
<html>
<head><title>Lumen & Lather Smoke</title></head>
<body>
  <main>
    <h1>Lumen & Lather</h1>
    @foreach(products as product)
      <article>
        <h2>{{ product.name }}</h2>
        <p>{{ product.price }}</p>
      </article>
    @endforeach
  </main>
</body>
</html>`)


run(['bun', '-e', `
const stx = await import('@stacksjs/stx')
const expressions = await import('@stacksjs/stx/expressions')
const tokenizer = await import('@stacksjs/stx/parser/tokenizer')
const router = await import('stx-router/layout-metadata')
const plugin = await import('bun-plugin-stx/serve')
if (typeof stx.processDirectives !== 'function') throw new Error('missing processDirectives')
if (typeof expressions.processExpressions !== 'function') throw new Error('missing processExpressions')
if (typeof tokenizer.findMatchingDelimiter !== 'function') throw new Error('missing tokenizer')
if (router.deriveLayoutGroup('layouts/shop/product.stx') !== 'shop') throw new Error('bad layout group')
if (!plugin) throw new Error('missing bun-plugin serve export')
`])

// The STX checker intentionally reports only its own generated buffers. An
// ordinary tsc consumer must also reject errors inside shipped .ts sources.
writeFileSync(join(smokeRoot, 'mouse-consumer.ts'), `import '@stacksjs/stx'
declare const possibleSignal: unknown
if (isSignal(possibleSignal)) {
  const value: unknown = possibleSignal()
  possibleSignal.set(value)
}
declare const possibleDerived: unknown
if (isDerived(possibleDerived)) {
  const value: unknown = possibleDerived()
  // @ts-expect-error derived signals are read-only
  possibleDerived.set(value)
}
const mouse = useMouse({ touch: false, resetOnLeave: true })
mouse.subscribe(({ clientX, clientY, isInside }) => {
  const x: number = clientX
  const y: number = clientY
  const inside: boolean = isInside
  console.log(x, y, inside)
})`)
writeFileSync(join(smokeRoot, 'mouse-tsconfig.json'), JSON.stringify({
  compilerOptions: {
    target: 'ESNext', module: 'ESNext', moduleResolution: 'bundler',
    lib: ['ESNext', 'DOM', 'DOM.Iterable'], types: [],
    strict: true, noUncheckedIndexedAccess: true, skipLibCheck: true, noEmit: true,
  },
  files: ['mouse-consumer.ts'],
}, null, 2))
run(['bun', '--bun', join(smokeRoot, 'node_modules/typescript/bin/tsc'), '--project', 'mouse-tsconfig.json'])

writeFileSync(join(smokeRoot, 'mouse-good.stx'), `<script client>
const mouse = useMouse({ touch: false, resetOnLeave: true })
mouse.subscribe(({ clientX, clientY, isInside }) => {
  const x: number = clientX
  const y: number = clientY
  const inside: boolean = isInside
  console.log(x, y, inside)
})
</script>`)
writeFileSync(join(smokeRoot, 'mouse-bad.stx'), `<script client>
useMouse({ touch: 'yes' })
useMouse().subscribe(point => console.log(point.clientX.toUpperCase(), point.nonexistent))
</script>`)
run(['bun', '-e', `
const { typecheckStxFiles } = await import('@stacksjs/stx/typecheck')
const { resolve } = await import('node:path')
const good = resolve('mouse-good.stx')
const bad = resolve('mouse-bad.stx')
const result = await typecheckStxFiles([good, bad], { templates: false, compilerOptions: { noUncheckedIndexedAccess: true } })
if (result.failure) throw new Error(result.failure)
const goodErrors = result.diagnostics.filter(d => d.file !== bad && d.category === 'error')
if (goodErrors.length) throw new Error('Published mouse types rejected the real card subscription: ' + JSON.stringify(goodErrors))
const invalid = result.diagnostics.filter(d => d.file === bad && d.category === 'error')
if (!invalid.some(d => d.code === 2322) || invalid.filter(d => d.code === 2339).length !== 2)
  throw new Error('Published mouse types failed to reject invalid options/properties: ' + JSON.stringify(invalid))
`])

run(['bun', 'node_modules/@stacksjs/stx/dist/cli.js', 'build', '--pages', 'pages', '--out', 'dist', '--no-minify'])
run(['bun', '-e', `
const html = await Bun.file('dist/index.html').text()
if (!html.includes('Lumen & Lather')) throw new Error('missing page title')
if (!html.includes('Cedar Wick Candle')) throw new Error('missing rendered product')
`])

removeTempDir(smokeRoot)
console.log('installed package smoke passed')
