/**
 * A native screen, compiled through stx's own pipeline (stacksjs/stx#1983).
 *
 * This is the entry the native target should use. The old path read a `.stx`
 * file with a second parser that could not handle directives, server scripts,
 * component composition or slots. This one renders the template with stx and
 * translates what comes out, so a native screen is an ordinary stx template
 * and every feature of the framework is available in it.
 *
 * The native primitive tags keep working: `src/primitives` ships `View`,
 * `Text`, `Button` and the rest as ordinary stx components, each emitting the
 * closest HTML tag and naming its own native type with `data-native`. They
 * are registered after the project's own components, so a screen that defines
 * its own `View` still wins.
 *
 * Events and bindings survive the trip without anything special: stx forwards
 * `@click` and `:text` written on a component tag onto the component's root
 * element, which is exactly where the translator reads them.
 *
 * This is also the CLI's IR path. The bundle path still goes through
 * `parser.ts`, `codegen.ts` and `bundle.ts`, because a native screen's `@if`
 * and `@foreach` must stay in the template and re-run on the device every
 * render; rendering here resolves them once, on the server, with server data.
 * This path is for translating already-rendered stx output (components,
 * static screens) into IR.
 */
import type { STXDocument } from './ir'
import type { TranslationDiagnostic } from './html-to-ir'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { extractBindingManifest, type BindingManifest } from '../../binding-manifest'
import { processDirectives } from '../../process'
import { translateHtmlToDocument } from './html-to-ir'
import { extractClientScript } from './client-script'
import { extractGeneratedSetupScript, type GeneratedSetupScript } from './setup-script'

/**
 * Where the native primitive components live, for an app's stx config.
 *
 * Resolved by looking, because the answer differs between running from source,
 * the per-module build and the bundled CLI. A path that is merely plausible
 * would fail only in the built binary, which is the one users run.
 */
export function nativePrimitivesDir(): string {
  // `src/native/primitives` from source; the build copies them next to the
  // per-module output as `dist/native/primitives`, which the bundled CLI
  // (chunks in `dist/`) reaches as `native/primitives`.
  const candidates = [
    path.join(import.meta.dir, '..', 'primitives'),
    path.join(import.meta.dir, 'native', 'primitives'),
  ]
  for (const candidate of candidates)
    if (existsSync(path.join(candidate, 'View.stx')))
      return candidate
  return candidates[0]
}

export interface CompileScreenOptions {
  /** The project's own components, searched before the primitives. */
  componentsDir?: string
  /** Base directory for relative resolution. Defaults to the file's directory. */
  root?: string
  /** Server-side context for the template, as a page's props would be. */
  context?: Record<string, unknown>
}

export interface CompiledScreen {
  document: STXDocument
  /** Bindings keyed to `STXNode.bindingId`, consumed directly by the host runtime. */
  manifest: BindingManifest
  /** Client setup transformed by stx, ready to run against the shared runtime. */
  setup: GeneratedSetupScript | null
  diagnostics: TranslationDiagnostic[]
  /** The rendered HTML the IR was translated from, for debugging a bad tree. */
  html: string
}

/**
 * Render a screen's source with stx and translate it to the native IR.
 */
export async function compileScreenSource(
  source: string,
  filePath: string,
  options: CompileScreenOptions = {},
): Promise<CompiledScreen> {
  const root = options.root ?? path.dirname(filePath)
  const config = {
    root,
    componentsDir: options.componentsDir ?? path.join(root, 'components'),
    buildMode: 'serve',
    cache: false,
    // Searched after every project directory, so an app's own component of the
    // same name still resolves first.
    _pluginComponentDirs: [nativePrimitivesDir()],
  }

  // Native style classes are translated into IR below. Generating and
  // injecting browser CSS here is redundant, and its development diagnostics
  // would corrupt `stx native compile --format ir` JSON on stdout.
  const context = { ...(options.context ?? {}), __stx_inject_css: false }
  const renderedHtml = await processDirectives(
    source,
    context,
    filePath,
    config as never,
    new Set<string>(),
  )
  const { html, manifest } = extractBindingManifest(renderedHtml)

  const { document, diagnostics } = await translateHtmlToDocument(html, {
    source: filePath,
    // Read from the source, not from the rendered page: the rendered page also
    // carries the signals runtime and the router, which are not the screen's.
    script: extractClientScript(source),
  })

  return { document, manifest, setup: extractGeneratedSetupScript(html), diagnostics, html }
}

/** The same, reading the screen off disk. */
export async function compileScreenFile(
  filePath: string,
  options: CompileScreenOptions = {},
): Promise<CompiledScreen> {
  return compileScreenSource(await Bun.file(filePath).text(), filePath, options)
}
