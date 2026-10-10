/**
 * `stx native compile`: the command line over `compileNativeBundle`.
 *
 *   stx native compile Screen.stx --format bundle --output native-screen.js
 *   stx native compile --format bundle --output native-screen.js --minify
 *   stx native compile Screen.stx             # the IR, as JSON, on stdout
 *
 * Without a file, the screens come from `native.config.json` in the working
 * directory (or `--config <file>`):
 *
 *   { "initialScreen": "Today", "screens": { "Today": "Today.stx", "Session": "Session.stx" } }
 *
 * Screen paths are relative to the config file.
 */
import type { NativeDiagnostic } from './compiler/bundle'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { compileNativeBundle, compileScreenBundle } from './compiler/bundle'
import { compileScreenFile } from './compiler/render-screen'

/** The config file names looked for, in order. The second is the old name. */
export const NATIVE_CONFIG_FILES: string[] = ['native.config.json', 'stx-native.config.json']

export interface NativeScreensConfig {
  initialScreen: string
  /** Screen name to absolute `.stx` path. */
  screens: Record<string, string>
  /** The config file the screens came from. */
  file: string
}

export interface NativeCompileOptions {
  /** `bundle` (the JavaScriptCore bundle) or `ir` (the template as JSON). Default `ir`. */
  format?: 'ir' | 'bundle'
  /** Write here instead of returning only. Relative to `cwd`. */
  output?: string
  minify?: boolean
  /** A screens config file, instead of looking for `native.config.json`. */
  config?: string
  cwd?: string
}

export interface NativeCompileResult {
  /** The bundle or the IR JSON. */
  output: string
  /** The absolute path written, when `output` was given. */
  written?: string
  diagnostics: NativeDiagnostic[]
}

/** The screens config for a project, or null when it has none. */
export function loadNativeScreensConfig(cwd: string = process.cwd(), configFile?: string): NativeScreensConfig | null {
  const file = configFile
    ? path.resolve(cwd, configFile)
    : NATIVE_CONFIG_FILES.map(name => path.join(cwd, name)).find(candidate => existsSync(candidate))
  if (!file)
    return null
  if (!existsSync(file))
    throw new Error(`Native config not found: ${file}`)
  const raw = JSON.parse(readFileSync(file, 'utf8')) as { screens?: Record<string, unknown>, initialScreen?: string }
  const entries = Object.entries(raw.screens ?? {})
  if (entries.length === 0)
    throw new Error(`${path.basename(file)} must name at least one screen in "screens"`)
  const screens: Record<string, string> = {}
  for (const [name, screen] of entries) {
    if (!/^[A-Z][\w-]*$/i.test(name))
      throw new Error(`Invalid native screen name: ${name}`)
    if (typeof screen !== 'string' || !screen.endsWith('.stx'))
      throw new Error(`Screen ${name} must name a .stx file`)
    screens[name] = path.resolve(path.dirname(file), screen)
    if (!existsSync(screens[name]))
      throw new Error(`Screen ${name} not found: ${screens[name]}`)
  }
  const initialScreen = raw.initialScreen || entries[0][0]
  if (!screens[initialScreen])
    throw new Error(`Initial screen ${initialScreen} is not in screens`)
  return { initialScreen, screens, file }
}

/** What `stx native compile` does, without the process around it. */
export async function runNativeCompile(file: string | undefined, options: NativeCompileOptions = {}): Promise<NativeCompileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd())
  const format = options.format ?? 'ir'
  if (format !== 'ir' && format !== 'bundle')
    throw new Error(`Unknown compile format: ${format}. Expected ir or bundle.`)

  const config = file ? null : loadNativeScreensConfig(cwd, options.config)
  if (!file && !config)
    throw new Error(`Please specify an input file: stx native compile <file.stx>, or add ${NATIVE_CONFIG_FILES[0]}`)

  let output: string
  let diagnostics: NativeDiagnostic[] = []
  if (format === 'bundle') {
    const bundle = config
      ? await compileNativeBundle({ screens: config.screens, initialScreen: config.initialScreen, minify: options.minify, root: cwd })
      : await compileScreenBundle(path.resolve(cwd, file!), { minify: options.minify })
    output = bundle.code
    diagnostics = bundle.diagnostics
  }
  else {
    const compile = async (source: string) => {
      const result = await compileScreenFile(source)
      diagnostics.push(...result.diagnostics.map(diagnostic => ({
        level: 'warning' as const,
        message: [diagnostic.kind, diagnostic.tag, diagnostic.name].filter(Boolean).join(': '),
      })))
      return result.document
    }
    const ir = config
      ? {
          initialScreen: config.initialScreen,
          screens: Object.fromEntries(await Promise.all(
            Object.entries(config.screens).map(async ([name, source]) => [name, await compile(source)] as const),
          )),
        }
      : await compile(path.resolve(cwd, file!))
    output = JSON.stringify(ir, null, 2)
  }

  if (!options.output)
    return { output, diagnostics }
  const written = path.resolve(cwd, options.output)
  mkdirSync(path.dirname(written), { recursive: true })
  await Bun.write(written, output)
  return { output, written, diagnostics }
}
