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
 * are searched after the screen's own components (`componentsDir`, and a
 * `components/` beside the screen), so a screen that defines its own `View`
 * still wins. Unmigrated primitive names precede convention directories and
 * plugins. Verified shared names (Button, and checked/change usage of
 * Checkbox/Switch, unambiguous value-model usage of TextInput, and src Video
 * calls with shared media events) use the same
 * app/plugin implementation as web, retaining a primitive fallback when none
 * is installed. Native host attributes also fall through ordinary shared roots.
 *
 * Events and bindings survive the trip without anything special: stx forwards
 * `@click` and `:text` written on a component tag onto the component's root
 * element, which is exactly where the translator reads them.
 *
 * This is also the CLI's IR and bundle path. Client-reactive conditions and
 * loops survive as binding-manifest entries and run through the shared stx
 * signals runtime; server-only directives resolve here before translation.
 */
import type { STXDocument, STXNode } from './ir'
import type { TranslationDiagnostic } from './html-to-ir'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { loadStxConfig } from '../../config'
import { classifyAttribute, extractBindingManifest, type BindingManifest } from '../../binding-manifest'
import { processDirectives } from '../../process'
import { processScriptSetup } from '../../signal-processing'
import { appThemeCSS } from './app-theme'
import { excludeNativeSubtrees, translateHtmlToDocument } from './html-to-ir'
import { extractClientScript } from './client-script'
import { extractLayoutChrome } from './layout-chrome'
import { extractGeneratedSetupScript, extractNativeClientScripts, type GeneratedSetupScript, type NativeClientScript } from './setup-script'

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
  /** Override the app's configured component directory, before primitives. */
  componentsDir?: string
  /** Base directory for relative resolution. Defaults to the file's directory. */
  root?: string
  /** Server-side context for the template, as a page's props would be. */
  context?: Record<string, unknown>
}

export interface CompiledScreen {
  /** Template and component inputs used by this compilation. */
  dependencies: string[]
  document: STXDocument
  /** Bindings keyed to `STXNode.bindingId`, consumed directly by the host runtime. */
  manifest: BindingManifest
  /** Client setup transformed by stx, ready to run against the shared runtime. */
  setup: GeneratedSetupScript | null
  /** Page setup and component scope factories in document order. */
  scripts: NativeClientScript[]
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
  source = await excludeNativeSubtrees(source)
  const root = options.root ?? path.dirname(filePath)
  const loaded = await loadStxConfig(root)
  // The app's directories, resolved against its root as the dev server
  // resolves them (serve-app.ts): a web view's `@extends`, `@include` and
  // `useStore` find what they find in the browser.
  // Relative to the config's source root (`root: 'resources'` in a Stacks
  // app, whose stores are resources/stores), as the dev server reads them.
  const sourceRoot = typeof loaded.root === 'string' && loaded.root ? path.resolve(root, loaded.root) : root
  const fromRoot = (dir: string | undefined, fallback: string): string => dir
    ? (path.isAbsolute(dir) ? dir : path.resolve(sourceRoot, dir))
    : path.join(sourceRoot, fallback)
  const config = {
    root,
    layoutsDir: fromRoot(loaded.layoutsDir, 'layouts'),
    partialsDir: fromRoot(loaded.partialsDir, 'partials'),
    storesDir: fromRoot((loaded as { storesDir?: string }).storesDir, 'stores'),
    componentsDir: options.componentsDir ?? (loaded.componentsDir ? fromRoot(loaded.componentsDir, 'components') : path.join(sourceRoot, 'components')),
    buildMode: 'serve',
    cache: false,
    // After screen-owned components; verified shared names move to fallback.
    _targetComponentDirs: [nativePrimitivesDir()],
    // Verified shared implementations beat the primitive fallback on both
    // targets. Checkbox/Switch keep primitive resolution for legacy value /
    // value-change calls. TextInput keeps primitive resolution for legacy or
    // ambiguous input listeners. Video keeps primitive resolution for source
    // and mixed src/source calls or legacy event aliases. utils.ts selects
    // shared APIs per invocation.
    _targetComponentFallbackNames: ['Button', 'Checkbox', 'Switch', 'TextInput', 'Image', 'Video'],
    _nativeHostAttrs: true,
    // A native screen's events are bindings in its manifest, read from the
    // `@click` it keeps. The web's other path, an element id and a standalone
    // script that binds it, is taken when the template has no reactive
    // context (a client block of plain functions, with no onMount and no
    // signal), and that script never runs natively: every handler on such a
    // screen was dead.
    skipEventDirectives: true,
    _pluginComponentDirs: (loaded as any)._pluginComponentDirs ?? [],
  }

  // Native style classes are translated into IR below. Generating and
  // injecting browser CSS here is redundant, and its development diagnostics
  // would corrupt `stx native compile --format ir` JSON on stdout.
  // `__stx_native_screen`: a mustache that calls a server helper (a layout's
  // request-language `t`) is the device's to answer (expressions.ts).
  const context = { ...(options.context ?? {}), __stx_inject_css: false, __stx_native_screen: true }
  const dependencies = new Set<string>([filePath])
  const renderedHtml = await processDirectives(
    source,
    context,
    filePath,
    config as never,
    dependencies,
  )
  // The layout's chrome is the app's own on a phone: left out of the tree,
  // its links kept for the tab and navigation bars (layout-chrome.ts).
  const chromeDiagnostics: TranslationDiagnostic[] = []
  const { html: content, chrome } = await extractLayoutChrome(await excludeNativeSubtrees(renderedHtml), name => {
    chromeDiagnostics.push({ kind: 'unknown-icon', tag: 'data-native-chrome', name })
  })
  const { html, manifest } = extractBindingManifest(await excludeNativeSubtrees(content))

  // The app's answers for the role tokens, which the web gets from the page
  // stylesheet and a native screen otherwise never sees (app-theme.ts).
  const theme = await appThemeCSS(root)
  const { document, diagnostics } = await translateHtmlToDocument(theme ? `<style>${theme}</style>${html}` : html, {
    source: filePath,
    // Read from the source, not from the rendered page: the rendered page also
    // carries the signals runtime and the router, which are not the screen's.
    script: extractClientScript(source),
  })
  diagnostics.unshift(...chromeDiagnostics)

  enterTemplatedBindings(document.root, manifest)

  // The page's title, as the web's <title> has it: the navigation title.
  const head = (context as { __stx_runtime_head?: { title?: unknown } }).__stx_runtime_head
  if (typeof head?.title === 'string' && head.title.trim()) document.title = head.title.trim()
  if (chrome) document.chrome = chrome

  let setup = extractGeneratedSetupScript(html)
  const scripts = extractNativeClientScripts(html)
  if (extractClientScript(source).code.trim()) {
    const forced = await processScriptSetup(source, filePath, options.context, { forceClientSetup: true })
    const forcedSetup = extractGeneratedSetupScript(forced.setupCode ?? '')
    setup = forcedSetup ?? setup
    if (forcedSetup && !scripts.some(script => script.code === forcedSetup.code))
      scripts.push({ code: forcedSetup.code })
  }
  // Serve HTML externalizes the page's module registry. A native screen has
  // no HTTP script loader: embed the same registry before component setups.
  const { buildModuleRegistryScript, registeredModuleIdsIn } = await import('../../client-module-registry')
  const registry = async (): Promise<string | null> => {
    const inputs: string[] = []
    const code = await buildModuleRegistryScript(registeredModuleIdsIn(...scripts.map(script => script.code)), { collectInputs: inputs })
    for (const input of inputs) dependencies.add(input)
    return code
  }
  let modules = await registry()
  // The app's stores, which the page loads ahead of its own scripts
  // (`data-stx-stores`, process.ts): `useStore` in the screen's setup finds
  // them defined, as it does in the browser. Served HTML may name the bundle
  // by URL, and a native screen has nothing to fetch it from, so the bundle
  // is built here from the same directory. Only for a screen whose code (or
  // a module it imports) reads a store: every store's definition runs when
  // it loads, which a screen that uses none should not pay for, nor see the
  // effects of (a store reading a language's messages on definition).
  const usesStores = [...scripts.map(script => script.code), modules ?? ''].some(code => /\buseStore\s*\(/.test(code))
  if (usesStores && /<script\b[^>]*\bdata-stx-stores\b/i.test(html)) {
    const { getStoreScript } = await import('../../store-loader')
    const stores = await getStoreScript(config.storesDir)
    if (stores) {
      scripts.unshift({ code: stores })
      for (const file of new Bun.Glob('*.ts').scanSync({ cwd: config.storesDir, absolute: true }))
        dependencies.add(file)
      // The stores' own imports join the registry.
      modules = await registry()
    }
  }
  if (modules) scripts.unshift({ code: modules })

  return { document, manifest, setup, scripts, diagnostics, html, dependencies: [...dependencies] }
}

/**
 * The bindings the translation made of `{{ }}` the server left (html-to-ir.ts
 * `mustacheBinding`), entered in the manifest the runtime binds from, as the
 * `:text` an author wrote is: a node keeps its entry and gains them, or gets
 * an entry of its own.
 */
function enterTemplatedBindings(root: STXNode, manifest: BindingManifest): void {
  const entries = new Map(manifest.entries.map(entry => [entry.id, entry]))
  let next = manifest.entries.reduce((highest, entry) => Math.max(highest, entry.id), -1) + 1
  const visit = (node: STXNode): void => {
    if (node._templated?.length && node.bindings) {
      if (node.bindingId === undefined || !entries.has(node.bindingId)) {
        const entry = { id: node.bindingId ?? next++, bindings: [] }
        node.bindingId = entry.id
        entries.set(entry.id, entry)
        manifest.entries.push(entry)
      }
      const entry = entries.get(node.bindingId)!
      for (const name of node._templated) {
        const attribute = `:${name}`
        const kind = classifyAttribute(attribute)
        if (kind && !entry.bindings.some(binding => binding.name === attribute))
          entry.bindings.push({ name: attribute, value: node.bindings[name]!, kind })
      }
    }
    for (const child of node.children) {
      if (typeof child !== 'string') visit(child)
    }
  }
  visit(root)
}

/** The same, reading the screen off disk. */
export async function compileScreenFile(
  filePath: string,
  options: CompileScreenOptions = {},
): Promise<CompiledScreen> {
  return compileScreenSource(await Bun.file(filePath).text(), filePath, options)
}
