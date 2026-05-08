import { mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const root = process.cwd()
const smokeRoot = join(tmpdir(), `stx-installed-smoke-${Date.now()}`)

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

function linkPackage(name: string, packageDir: string): void {
  const parts = name.split('/')
  const targetDir = join(smokeRoot, 'node_modules', ...parts.slice(0, -1))
  mkdirSync(targetDir, { recursive: true })
  symlinkSync(join(root, packageDir), join(smokeRoot, 'node_modules', ...parts), 'dir')
}

rmSync(smokeRoot, { recursive: true, force: true })
mkdirSync(join(smokeRoot, 'pages'), { recursive: true })
mkdirSync(join(smokeRoot, 'node_modules'), { recursive: true })

writeFileSync(join(smokeRoot, 'package.json'), JSON.stringify({
  name: 'stx-installed-smoke',
  type: 'module',
  private: true,
  dependencies: {
    '@stacksjs/stx': '0.0.0-smoke',
    'stx-router': '0.0.0-smoke',
    'bun-plugin-stx': '0.0.0-smoke',
  },
}, null, 2))

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

linkPackage('@stacksjs/stx', 'packages/stx')
linkPackage('stx-router', 'packages/router')
linkPackage('bun-plugin-stx', 'packages/bun-plugin')

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

run(['bun', 'node_modules/@stacksjs/stx/dist/cli.js', 'build', '--pages', 'pages', '--out', 'dist', '--no-minify'])
run(['bun', '-e', `
const html = await Bun.file('dist/index.html').text()
if (!html.includes('Lumen & Lather')) throw new Error('missing page title')
if (!html.includes('Cedar Wick Candle')) throw new Error('missing rendered product')
`])

rmSync(smokeRoot, { recursive: true, force: true })
console.log('installed package smoke passed')
