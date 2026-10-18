/**
 * The JavaScriptCore bundle for a set of native screens.
 *
 * Layout of the file the host evaluates:
 *
 *   1. a header that settles which route this context shows,
 *   2. the shared stx signals runtime and native host adapter, once,
 *   3. the selected screen's rendered IR, manifest and generated setup.
 *
 * With `routesDir`, each route also gets a file of its own holding only that
 * route's screen (or the app script) and the runtime. Every native screen is
 * a JavaScriptCore context of its own, and the host evaluates the whole file
 * it is given: one file of every screen made each mount parse every screen's
 * code (HQ's 17 MB took ~170 ms of main thread per tab and push, before the
 * screen drew anything). A route file is that screen's code alone.
 *
 * A screen's script is TypeScript with imports: the `.stx` file is the build's
 * entry, loaded through a plugin that hands Bun the generated module
 * (`codegen.ts`), so `import { x } from '../functions/mobile'` resolves from
 * where the screen lives, exactly as it would on the web.
 */
import type { BunPlugin } from 'bun'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { compileScreenFile } from './render-screen'
import type { STXDocument } from './ir'
import { NATIVE_APP_ROUTE } from '../runtime/shared-screen'
import { generateSignalsRuntime } from '../../signals'
import type { BrowserScreenOptions } from '../runtime/browser-screen'

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
  /**
   * The app script (relative to `root`): a module whose default export runs
   * once for the app's life, with no screen, when the host names the route
   * `__app` (Craft's `nativeApp`). It is called with `craft` and may return
   * a cleanup. Its imports are bundled with the screens', so its module body
   * runs in every context: keep the work in the default export.
   */
  app?: string
  /** Compile the same component for the browser host instead of a device host. */
  browser?: BrowserScreenOptions & { platformModule: string, platformOptions?: Record<string, unknown> }
  /**
   * A directory (relative to `root`) to write one self-contained bundle per
   * route into: `<Screen>.js` for each screen and `__app.js` for the app
   * script. A host that finds `<route>.js` there evaluates only that file
   * (Craft's `dist/native-screens/`). With `routesDir` and no `outFile`, the
   * one-file bundle is not built at all, and `code` is empty.
   */
  routesDir?: string
}

/** Something the compiler could not translate exactly: an unknown icon or class. */
export interface NativeDiagnostic {
  level: 'warning'
  message: string
}

export interface NativeBundleResult {
  /** All template and imported module inputs, for dependency-aware build caches. */
  dependencies: string[]
  /** The bundle the host evaluates (Craft's `native-screen.js`). */
  code: string
  /** The absolute path written, when `outFile` was given. */
  outFile?: string
  /** Each route's own bundle, by route name, when `routesDir` was given. */
  routes?: Record<string, string>
  diagnostics: NativeDiagnostic[]
}

/** @deprecated Use `CompileNativeBundleOptions`. */
export type BundleOptions = CompileNativeBundleOptions

function nativeRuntimeModule(name: 'jsc-globals' | 'shared-screen' | 'browser-screen'): string {
  // Source modules, published ESM modules, and shared CLI chunks have different
  // directories and extensions. Resolve a shipped file before generating imports.
  const candidates = [
    path.join(import.meta.dir, '..', 'runtime', `${name}.ts`),
    path.join(import.meta.dir, '..', 'runtime', `${name}.js`),
    path.join(import.meta.dir, 'native', 'runtime', `${name}.js`),
  ]
  const resolved = candidates.find(candidate => existsSync(candidate))
  if (!resolved) throw new Error(`Native runtime module ${name} is missing`)
  return resolved
}

async function build(entry: string, plugins: BunPlugin[], minify: boolean, dependencies: Set<string>): Promise<string> {
  const track: BunPlugin = { name: 'stx-screen-inputs', setup(builder) {
    builder.onLoad({ filter: /.*/, namespace: 'file' }, ({ path: file }) => { dependencies.add(file); return undefined })
  } }
  const result = await Bun.build({
    entrypoints: [entry],
    target: 'browser',
    format: 'iife',
    minify,
    plugins: [track, ...plugins],
    define: { 'process.env.NODE_ENV': JSON.stringify(minify ? 'production' : 'development') },
  })
  if (!result.success) {
    const messages = result.logs.map(log => String(log.message ?? log)).join('\n')
    throw new Error(`Could not bundle ${entry}:\n${messages}`)
  }
  return (await result.outputs[0].text()).trim()
}

/**
 * The document as the runtime reads it. Its `script` is the screen's client
 * source, kept for the IR output and hot reload; the bundle runs that code as
 * the compiled setup, so a copy of the source text (comments and all, as a
 * string the minifier cannot touch) only made every screen bigger to parse.
 */
function runtimeDocument(document: STXDocument): STXDocument {
  return { ...document, script: { exports: document.script.exports, functions: [], code: '' } }
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
/** Compile routed screens through stx and run them on the shared signals runtime. */
export async function compileNativeBundle(options: CompileNativeBundleOptions): Promise<NativeBundleResult> {
  const names = Object.keys(options.screens)
  if (names.length === 0) throw new Error('screens must name at least one .stx file')
  const routed = options.routed ?? true
  const initialScreen = options.initialScreen ?? names[0]
  if (!options.screens[initialScreen]) throw new Error(`Initial screen ${initialScreen} is not in screens`)
  const root = path.resolve(options.root ?? process.cwd())
  const compiledScreens: Array<{ name: string, file: string, compiled: Awaited<ReturnType<typeof compileScreenFile>> }> = []
  for (const name of names) {
    const file = path.resolve(root, options.screens[name])
    if (!file.endsWith('.stx')) throw new Error(`Screen ${name} must name a .stx file`)
    compiledScreens.push({ name, file, compiled: await compileScreenFile(file, { root }) })
  }

  const runtimeGlobals = nativeRuntimeModule('jsc-globals')
  const sharedScreen = nativeRuntimeModule('shared-screen')
  const appFile = options.app ? path.resolve(root, options.app) : null
  if (appFile && !existsSync(appFile)) throw new Error(`The app script ${options.app} does not exist`)
  if (appFile && !routed) throw new Error('An app script needs a routed bundle')
  if (appFile && options.screens[NATIVE_APP_ROUTE]) throw new Error(`${NATIVE_APP_ROUTE} is the app script's route, not a screen name`)
  const browser = options.browser
  if (browser && options.routesDir) throw new Error('A browser screen is one route; routesDir is for device hosts')
  const entry = (bundled: typeof compiledScreens, withApp: boolean): string => {
    const route = routed
      ? `var routeName = g.__stxNativeRoute || ${JSON.stringify(initialScreen)};
var isApp = ${appFile ? `routeName === ${JSON.stringify(NATIVE_APP_ROUTE)}` : 'false'};
if (!isApp && routeNames.indexOf(routeName) === -1) throw new Error(['Unknown native screen:', routeName].join(' '));
if (isApp ? ${!withApp} : ${JSON.stringify(bundled.map(({ name }) => name))}.indexOf(routeName) === -1) throw new Error(['This bundle does not hold the native screen', routeName].join(' '));`
      : "var routeName = 'main';\nvar isApp = false;"
    const selections = bundled.map(({ name, compiled }, index) => `${index === 0 ? 'if' : 'else if'} (routeName === ${JSON.stringify(routed ? name : 'main')}) {
  nativeDocument = ${JSON.stringify(runtimeDocument(compiled.document))};
  manifest = ${JSON.stringify(compiled.manifest)};
}`).join('\n')
    const setups = bundled.map(({ name, compiled }, index) => `${index === 0 ? 'if' : 'else if'} (routeName === ${JSON.stringify(routed ? name : 'main')}) {
  g.__stx_latestSetup = null;
${compiled.scripts.map(script => script.owner
    ? `  g.__STX_SETUP_ROOT__ = screen && screen.scopeRoot(${JSON.stringify(script.owner)});
  try {
${script.code}
  }
  finally { g.__STX_SETUP_ROOT__ = null; }`
    : script.code).join('\n')}
}`).join('\n')
    const app = withApp && appFile
    const browserRuntime = browser ? nativeRuntimeModule('browser-screen') : null
    const platformModule = browser ? Bun.resolveSync(browser.platformModule, root) : null
    const contents = `
import { installJSCGlobals } from ${JSON.stringify(runtimeGlobals)};
import { prepareNativeApp, prepareSharedNativeScreen } from ${JSON.stringify(sharedScreen)};
${browser ? `import { createBrowserScreenBridge } from ${JSON.stringify(browserRuntime)};\nimport { createBrowserPlatform } from ${JSON.stringify(platformModule)};` : ''}
${app ? `import * as nativeAppModule from ${JSON.stringify(appFile)};` : 'var nativeAppModule = null;'}
${browser ? '(async function() {' : ''}
var g = globalThis;
installJSCGlobals(g);
${browser ? `var browserPlatform = await createBrowserPlatform(${JSON.stringify(browser.platformOptions ?? {})});\nvar browserBridge = createBrowserScreenBridge(browserPlatform, ${JSON.stringify(browser)});\nvar bridge = browserBridge;\ng.__stxNativeRoute = ${JSON.stringify(initialScreen)};` : 'var bridge = g.__stxNativeBridge;'}
if (!bridge) throw new Error('Missing __stxNativeBridge');
var routeNames = ${JSON.stringify(routed ? names : ['main'])};
${route}
g.__stxNativeRoute = routeName;
var nativeDocument;
var manifest;
${selections}
var screen = null;
var app = null;
if (isApp) {
  app = prepareNativeApp(bridge, { routeName: routeName, routeNames: routeNames });
  g.__stxNativeUnmount = function() { app.unmount(); };
}
else {
  screen = prepareSharedNativeScreen(nativeDocument, manifest, bridge, { routeName: routeName, routeNames: routeNames });
  g.__stx_host = screen.host;
  g.__stxNativeUnmount = function() { screen.unmount(); };
}
${generateSignalsRuntime()}
${setups}
if (isApp) app.start(nativeAppModule);
else screen.mount(g.stx, g.__stx_latestSetup || null);
${browser ? `var stopApp = nativeAppModule && typeof nativeAppModule.default === 'function' ? nativeAppModule.default(g.craft) : null;
var unmount = g.__stxNativeUnmount;
var ended = false;
g.__stxNativeUnmount = function() { if (ended) return; ended = true; if (typeof stopApp === 'function') stopApp(); unmount(); browserBridge.dispose(); };
g.addEventListener('pagehide', function(event) { if (!event.persisted) g.__stxNativeUnmount(); });
})().catch(function(error) { console.error('[stx browser screen]', error); var node = document.querySelector(${JSON.stringify(browser.container)}); if (node) { node.textContent = 'This screen could not start. Reload to try again.'; node.setAttribute('role', 'alert'); } });` : ''}
`
    return contents
  }
  const plugin = (contents: string): BunPlugin => ({
    name: 'stx-native-shared-screens',
    setup(builder) {
      builder.onResolve({ filter: /^stx:native-shared-screens$/ }, () => ({ path: 'entry', namespace: 'stx-native-shared-screens' }))
      builder.onLoad({ filter: /.*/, namespace: 'stx-native-shared-screens' }, () => ({ contents, loader: 'js' }))
    },
  })
  const dependencies = new Set(compiledScreens.flatMap(({ compiled }) => compiled.dependencies))
  const diagnostics = compiledScreens.flatMap(({ compiled }) => compiled.diagnostics).map(diagnostic => ({
    level: 'warning' as const,
    message: [diagnostic.kind, diagnostic.tag, diagnostic.name].filter(Boolean).join(': '),
  }))
  const minify = options.minify ?? false
  let routes: Record<string, string> | undefined
  if (options.routesDir) {
    const dir = path.resolve(root, options.routesDir)
    mkdirSync(dir, { recursive: true })
    const targets = [
      ...compiledScreens.map(screen => ({ name: screen.name, screens: [screen], app: false })),
      ...(appFile ? [{ name: NATIVE_APP_ROUTE, screens: [], app: true }] : []),
    ]
    // A few builds at a time: one per route at once held every screen's
    // module graph in memory together.
    routes = {}
    for (let next = 0; next < targets.length; next += 6) {
      await Promise.all(targets.slice(next, next + 6).map(async (target) => {
        const file = path.join(dir, `${target.name}.js`)
        await Bun.write(file, await build('stx:native-shared-screens', [plugin(entry(target.screens, target.app))], minify, dependencies))
        routes![target.name] = file
      }))
    }
    if (!options.outFile) return { code: '', routes, diagnostics, dependencies: [...dependencies] }
  }
  const code = await build('stx:native-shared-screens', [plugin(entry(compiledScreens, true))], minify, dependencies)
  if (!options.outFile) return { code, diagnostics, dependencies: [...dependencies] }
  const outFile = path.resolve(root, options.outFile)
  mkdirSync(path.dirname(outFile), { recursive: true })
  await Bun.write(outFile, code)
  return { code, outFile, ...(routes ? { routes } : {}), diagnostics, dependencies: [...dependencies] }
}

/** Compile one screen against stx's shared signals runtime, without the legacy parser/runtime. */
export async function compileSharedScreenBundle(
  file: string,
  options: Pick<CompileNativeBundleOptions, 'minify' | 'outFile' | 'root'> = {},
): Promise<NativeBundleResult> {
  return compileNativeBundle({ ...options, screens: { main: file }, routed: false })
}

/** One `.stx` file, as the public single-screen native compiler writes it. */
export function compileScreenBundle(file: string, options: Pick<CompileNativeBundleOptions, 'minify' | 'outFile' | 'root'> = {}): Promise<NativeBundleResult> {
  return compileSharedScreenBundle(file, options)
}
