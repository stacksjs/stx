/** Build the WebView-free iOS example from an ordinary stx screen. */
import process from 'node:process'
import { existsSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { compileNativeBundle } from '../../../packages/stx/src/native/compiler/bundle'

const appRoot = resolve(import.meta.dir, '..')
const output = resolve(process.env.BUDDY_IOS_OUTPUT || join(appRoot, 'dist', 'ios'))
const craftRoot = resolve(process.env.CRAFT_ROOT || join(appRoot, '..', '..', '..', 'craft'))
const craftModule = join(craftRoot, 'packages', 'ios', 'src', 'index.ts')

if (!existsSync(craftModule)) {
  throw new Error(`Craft checkout not found at ${craftRoot}. Set CRAFT_ROOT to its absolute path.`)
}

const config = await Bun.file(join(appRoot, 'craft.config.json')).json()
const { build, init, run } = await import(craftModule)

rmSync(output, { recursive: true, force: true })
await init({
  name: config.appName,
  bundleId: config.bundleId,
  output,
  config,
  runtimeDir: null,
})

const bundle = await compileNativeBundle({
  root: appRoot,
  screens: { Home: 'screens/Home.stx' },
  initialScreen: 'Home',
  minify: true,
  outFile: join(output, 'dist', 'native-screen.js'),
})

for (const diagnostic of bundle.diagnostics)
  console.warn(`[stx native] ${diagnostic.message}`)

await build({
  output,
  nativeBundlePath: bundle.outFile,
  runtimeDir: null,
})

if (process.argv.includes('--run'))
  await run({ output, simulator: true })
else
  console.log(`Native iOS project: ${output}`)
