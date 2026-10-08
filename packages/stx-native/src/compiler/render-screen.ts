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
 * closest HTML tag and naming its own native type with `data-stx-native`. They
 * are registered after the project's own components, so a screen that defines
 * its own `View` still wins.
 *
 * Events and bindings survive the trip without anything special: stx forwards
 * `@click` and `:text` written on a component tag onto the component's root
 * element, which is exactly where the translator reads them.
 */
import type { STXDocument } from './ir'
import type { TranslationDiagnostic } from './html-to-ir'
import path from 'node:path'
import { processDirectives } from '@stacksjs/stx'
import { translateHtmlToDocument } from './html-to-ir'
import { extractClientScript } from './client-script'

/** Where the native primitive components live, for an app's stx config. */
export function nativePrimitivesDir(): string {
  return path.join(import.meta.dir, '..', 'primitives')
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

  const html = await processDirectives(
    source,
    options.context ?? {},
    filePath,
    config as never,
    new Set<string>(),
  )

  const { document, diagnostics } = await translateHtmlToDocument(html, {
    source: filePath,
    // Read from the source, not from the rendered page: the rendered page also
    // carries the signals runtime and the router, which are not the screen's.
    script: extractClientScript(source),
  })

  return { document, diagnostics, html }
}

/** The same, reading the screen off disk. */
export async function compileScreenFile(
  filePath: string,
  options: CompileScreenOptions = {},
): Promise<CompiledScreen> {
  return compileScreenSource(await Bun.file(filePath).text(), filePath, options)
}
