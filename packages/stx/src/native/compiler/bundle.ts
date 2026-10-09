/**
 * The JavaScriptCore bundle for a set of native screens.
 *
 * Layout of the file the host evaluates:
 *
 *   1. a header that settles which route this context shows,
 *   2. the runtime (`runtime/screen.ts`), once, which installs `craft.*`,
 *   3. each screen, built separately by `Bun.build` from its `.stx` file and
 *      guarded by its route name, so only the one being shown runs.
 *
 * A screen's script is TypeScript with imports: the `.stx` file is the build's
 * entry, loaded through a plugin that hands Bun the generated module
 * (`codegen.ts`), so `import { x } from '../functions/mobile'` resolves from
 * where the screen lives, exactly as it would on the web.
 */
import type { BunPlugin } from 'bun'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { generateScreenModule, RUNTIME_SPECIFIER } from './codegen'
import { parseSTX } from './parser'

export interface CompileNativeBundleOptions {
  /** Screen name to `.stx` path, relative to `root`. */
  screens: Record<string, string>
  /** The screen shown when the host names none. Defaults to the first. */
  initialScreen?: string
  /** Minify the output (smaller, faster to parse; harder to read in a log). */
  minify?: boolean
  /**
   * Whether the host chooses the screen by `__stxNativeRoute`. A single-file
   * compile has no routes and answers to `main`.
   */
  routed?: boolean
  /** Where to write the bundle (relative to `root`). Nothing is written without it. */
  outFile?: string
  /** Base directory for `screens` and `outFile`. Defaults to `process.cwd()`. */
  root?: string
}

/** Something the compiler could not translate exactly: an unknown icon or class. */
export interface NativeDiagnostic {
  level: 'warning'
  message: string
}

export interface NativeBundleResult {
  /** The bundle the host evaluates (Craft's `native-screen.js`). */
  code: string
  /** The absolute path written, when `outFile` was given. */
  outFile?: string
  diagnostics: NativeDiagnostic[]
}

/** @deprecated Use `CompileNativeBundleOptions`. */
export type BundleOptions = CompileNativeBundleOptions

function runtimeEntry(): string {
  // Source (`src/native/compiler`), the published per-module build
  // (`dist/native/compiler`, plain `.js`), or the bundled `stx` CLI, whose
  // chunks sit in `dist/` itself.
  const candidates = [
    path.join(import.meta.dir, '..', 'runtime', 'entry.ts'),
    path.join(import.meta.dir, '..', 'runtime', 'entry.js'),
    path.join(import.meta.dir, 'native', 'runtime', 'entry.js'),
  ]
  return candidates.find(candidate => existsSync(candidate)) ?? candidates[0]
}

async function build(entry: string, plugins: BunPlugin[], minify: boolean): Promise<string> {
  const result = await Bun.build({
    entrypoints: [entry],
    target: 'browser',
    format: 'iife',
    minify,
    plugins,
    define: { 'process.env.NODE_ENV': JSON.stringify(minify ? 'production' : 'development') },
  })
  if (!result.success) {
    const messages = result.logs.map(log => String(log.message ?? log)).join('\n')
    throw new Error(`Could not bundle ${entry}:\n${messages}`)
  }
  return (await result.outputs[0].text()).trim()
}

/** Loads `.stx` entries as their generated module, and the runtime as a global. */
function screenPlugin(warnings: string[]): BunPlugin {
  return {
    name: 'stx-native-screen',
    setup(builder) {
      builder.onResolve({ filter: /^stx:native-runtime$/ }, () => ({ path: 'runtime', namespace: 'stx-native-runtime' }))
      builder.onLoad({ filter: /.*/, namespace: 'stx-native-runtime' }, () => ({
        contents: 'export function mount(screen) { return globalThis.__stxNative.mount(screen) }',
        loader: 'js',
      }))
      builder.onLoad({ filter: /\.stx$/ }, async (args) => {
        const source = await Bun.file(args.path).text()
        const module = generateScreenModule(parseSTX(source, args.path))
        warnings.push(...module.warnings)
        return { contents: module.code, loader: 'ts' }
      })
    },
  }
}

/**
 * Build the bundle the host loads as `native-screen.js`.
 *
 * @example
 * ```ts
 * import { compileNativeBundle } from '@stacksjs/stx/native'
 *
 * const { outFile, diagnostics } = await compileNativeBundle({
 *   screens: { Today: 'resources/native/Today.stx' },
 *   initialScreen: 'Today',
 *   minify: true,
 *   outFile: 'storage/framework/native/native-screen.js',
 *   root: process.cwd(),
 * })
 * ```
 */
export async function compileNativeBundle(options: CompileNativeBundleOptions): Promise<NativeBundleResult> {
  const names = Object.keys(options.screens)
  if (names.length === 0) throw new Error('screens must name at least one .stx file')
  const routed = options.routed ?? true
  const initialScreen = options.initialScreen ?? names[0]
  if (!options.screens[initialScreen]) throw new Error(`Initial screen ${initialScreen} is not in screens`)
  const minify = options.minify ?? false
  const root = path.resolve(options.root ?? process.cwd())
  const warnings: string[] = []

  const header = routed
    ? `(function () {
  var names = ${JSON.stringify(names)};
  var name = globalThis.__stxNativeRoute || ${JSON.stringify(initialScreen)};
  if (names.indexOf(name) === -1) throw new Error(['Unknown native screen:', name].join(' '));
  globalThis.__stxNativeRoute = name;
  globalThis.__stxNativeRuntimeOptions = { routeName: name, routeNames: names };
})();`
    : `globalThis.__stxNativeRuntimeOptions = { routeName: 'main', routeNames: ['main'] };`

  const runtime = await build(runtimeEntry(), [], minify)
  const screens: string[] = []
  for (const name of names) {
    const file = path.resolve(root, options.screens[name])
    if (!file.endsWith('.stx')) throw new Error(`Screen ${name} must name a .stx file`)
    const code = await build(file, [screenPlugin(warnings)], minify)
    const guard = routed
      ? `globalThis.__stxNativeRoute === ${JSON.stringify(name)} && globalThis.__stxNativeBridge`
      : 'globalThis.__stxNativeBridge'
    screens.push(`// Screen ${name}: ${path.basename(file)}\nif (${guard}) {\n${code}\n}`)
  }

  const code = [
    `// STX Native bundle (${names.join(', ')})`,
    header,
    runtime,
    ...screens,
    '',
  ].join('\n')
  const diagnostics = [...new Set(warnings)].map(message => ({ level: 'warning' as const, message }))
  if (!options.outFile)
    return { code, diagnostics }
  const outFile = path.resolve(root, options.outFile)
  mkdirSync(path.dirname(outFile), { recursive: true })
  await Bun.write(outFile, code)
  return { code, outFile, diagnostics }
}

/** One `.stx` file, as the single-screen bundle `compile <file> --format bundle` writes. */
export function compileScreenBundle(file: string, options: Pick<CompileNativeBundleOptions, 'minify' | 'outFile' | 'root'> = {}): Promise<NativeBundleResult> {
  return compileNativeBundle({ ...options, screens: { main: file }, routed: false })
}

export { RUNTIME_SPECIFIER }
