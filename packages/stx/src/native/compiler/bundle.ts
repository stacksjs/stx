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
 * route's screen (or the app script), beside one runtime file they share. Every native screen is
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
import { existsSync, mkdirSync, realpathSync, rmSync } from 'node:fs'
import path from 'node:path'
import { compileScreenFile } from './render-screen'
import { nativeStyleConfigFrom, withNativeStyleConfig, type NativeStyleConfig } from './style-config'
import type { STXDocument } from './ir'
import { NATIVE_APP_ROUTE } from '../runtime/shared-screen'
import { generateSignalsRuntime } from '../../signals'
import { withModuleSubstitutes } from '../../client-script-bundler'
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
   * A directory (relative to `root`) to write one bundle per route into:
   * `<Screen>.js` for each screen and `__app.js` for the app script. A host
   * evaluates the route's own file in the route's context (Craft's
   * `dist/native-screens/`), and no other screen's code. With `routesDir`
   * and no `outFile`, the one-file bundle is not built at all, and `code`
   * is empty.
   */
  routesDir?: string
  /**
   * With `routesDir`: the runtime every route needs (the JSC globals, the
   * screen host, the signals runtime) is a file of its own, `__runtime.js`,
   * instead of a copy in each route's file, and a host evaluates it in the
   * route's context before the route's own file. It was 247 KB of every
   * route file; a host whose screens share one JavaScriptCore VM parses it
   * once. Only for a host that does this (Craft's `nativeRouteRuntime`): a
   * route file built so refuses to run without it.
   */
  sharedRuntime?: boolean
  /**
   * Message catalogs to ship a language at a time, with `routesDir` and
   * `sharedRuntime` (whose runtime reads them), for a host that answers
   * `__stxNativeReadMessages` or evaluates them first (Craft's
   * `nativeMessages`). Each
   * language's messages live in files of their own under `dir`:
   * `<dir>/<language>/<area>.ts`, whose default export is plain data (what
   * JSON can hold) and which export nothing else. Route files carry none of
   * them: each such module is, in a route file, the messages its language
   * and area name, which the runtime reads from
   * `<routesDir>/__messages/<language>/<area>.json` the first time a screen
   * looks inside them, through the host's
   * `__stxNativeReadMessages(language, area)` (JSON text, or null). A screen
   * shown in one language parses that language alone, and only the areas
   * it uses; another language is read when it is asked for, so a language
   * changed while the app runs needs no reload. A host that cannot read a
   * file synchronously evaluates the route's messages first instead
   * (`__messages/routes.json` names each route's areas), setting
   * `globalThis.__stxNativeMessages[language][area]`.
   */
  messages?: NativeMessagesOptions
  /**
   * The app's utility vocabulary for native styles: Crosswind shortcuts,
   * theme colours, breakpoints. Defaults to the project's CSS config
   * (`config/css.ts`), the same one its web pages use.
   */
  styleConfig?: NativeStyleConfig
}

/** The project's CSS config, as native styles read it; empty without one. */
export async function projectStyleConfig(root: string): Promise<NativeStyleConfig> {
  try {
    const { loadCssEngineConfig } = await import('../../dev-server/ts-css')
    return nativeStyleConfigFrom(await loadCssEngineConfig(root) as Record<string, any> | null)
  }
  catch {
    return {}
  }
}

export interface NativeMessagesOptions {
  /** The directory (relative to `root`) holding a directory per language. */
  dir: string
  /** The languages, each a directory of `dir`. */
  languages: string[]
}

/**
 * The runtime prelude's name in a `routesDir`: `__runtime.js`, which a host
 * evaluates in each screen's context before that screen's own route file.
 */
export const NATIVE_RUNTIME_ROUTE = '__runtime'

/**
 * Where a `routesDir` keeps the messages: `__messages/<language>/<area>.json`,
 * and `__messages/routes.json`, each route's areas.
 */
export const NATIVE_MESSAGES_DIR = '__messages'

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
  /** The runtime prelude every route file needs first, when `routesDir` was given. */
  runtime?: string
  /** The messages written beside the routes, when `messages` was given. */
  messages?: {
    /** The absolute `__messages` directory. */
    dir: string
    languages: string[]
    /** Each route's areas, by route name. */
    routes: Record<string, string[]>
  }
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

/**
 * Bun takes the first `onLoad` that matches a file, so the inputs are
 * tracked, and a module's stand-in (`substitutes`, by absolute path) handed
 * in, by one hook.
 */
async function build(entry: string, plugins: BunPlugin[], minify: boolean, dependencies: Set<string>, substitutes?: ReadonlyMap<string, string>): Promise<string> {
  const track: BunPlugin = { name: 'stx-screen-inputs', setup(builder) {
    builder.onLoad({ filter: /.*/, namespace: 'file' }, ({ path: file }) => {
      dependencies.add(file)
      const contents = substitutes?.get(file)
      return contents === undefined ? undefined : { contents, loader: 'js' }
    })
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

const MESSAGE_AREA = /^[\w-]+(?:\/[\w-]+)*$/
const MESSAGE_LANGUAGE = /^[\w-]+$/

interface CollectedMessages {
  /** Each message module, by absolute path: its language and area. */
  files: Map<string, { language: string, area: string }>
  /** Each language's messages, as JSON text, by area. */
  data: Map<string, Map<string, string>>
}

/** Read every language's message modules, at build time. */
async function collectMessages(root: string, options: NativeMessagesOptions): Promise<CollectedMessages> {
  const dir = path.resolve(root, options.dir)
  if (!options.languages?.length) throw new Error('messages.languages must name at least one language')
  const files: CollectedMessages['files'] = new Map()
  const data: CollectedMessages['data'] = new Map()
  for (const language of options.languages) {
    if (!MESSAGE_LANGUAGE.test(language)) throw new Error(`messages: "${language}" is not a language directory name`)
    const base = path.join(dir, language)
    if (!existsSync(base)) throw new Error(`messages: ${path.relative(root, base)} does not exist`)
    const areas = new Map<string, string>()
    for (const relative of [...new Bun.Glob('**/*.{ts,js,mjs,json}').scanSync({ cwd: base })].sort()) {
      if (/\.(?:test|spec|d)\.[^.]+$/.test(relative)) continue
      const area = relative.replace(/\.[^./]+$/, '').split(path.sep).join('/')
      if (!MESSAGE_AREA.test(area)) throw new Error(`messages: ${language}/${relative} is not an area name`)
      if (areas.has(area)) throw new Error(`messages: ${language}/${area} is defined twice`)
      const file = path.join(base, relative)
      const module = await import(file) as Record<string, unknown>
      const others = Object.keys(module).filter(name => name !== 'default')
      // The route files see the default export alone.
      if (others.length) throw new Error(`messages: ${language}/${relative} exports ${others.join(', ')}; a message module exports its messages as default, and nothing else`)
      const value = module.default
      const json = value !== null && typeof value === 'object' && !Array.isArray(value) ? JSON.stringify(value) : undefined
      if (json === undefined || !Bun.deepEquals(JSON.parse(json), value, true))
        throw new Error(`messages: ${language}/${relative} must export plain data (an object JSON can hold) as default`)
      areas.set(area, json)
      files.set(file, { language, area })
    }
    data.set(language, areas)
  }
  return { files, data }
}

/**
 * In a route file, a message module is its messages, read when a screen
 * first looks inside them (the runtime's `messages`).
 */
function messagesStub(language: string, area: string): string {
  return `export default globalThis.__stxNativeRuntime.messages(${JSON.stringify(language)}, ${JSON.stringify(area)});`
}

/**
 * The stand-in for every message module, by absolute path: as the project
 * names it and as Bun resolves it (macOS's /var is /private/var).
 */
function messageStubs(messages: CollectedMessages): Map<string, string> {
  const stubs = new Map<string, string>()
  for (const [file, { language, area }] of messages.files) {
    const stub = messagesStub(language, area)
    stubs.set(file, stub)
    stubs.set(realpathSync(file), stub)
  }
  return stubs
}

/**
 * The areas a route file reads. Found in the file itself: a screen's script
 * may come from the client bundle cache, which loads no module at all.
 */
function areasRead(code: string): string[] {
  const areas = new Set<string>()
  for (const match of code.matchAll(/__stxNativeRuntime\.messages\(\s*"[\w-]+"\s*,\s*"([\w/-]+)"\s*\)/g))
    areas.add(match[1]!)
  return [...areas].sort()
}

/**
 * The document as the runtime reads it. Its `script` is the screen's client
 * source, kept for the IR output and hot reload; the bundle runs that code as
 * the compiled setup, so a copy of the source text (comments and all, as a
 * string the minifier cannot touch) only made every screen bigger to parse.
 *
 * Its source is named from the project root, and the build's time is left
 * out (`compiledAt` 0): the same sources build the same bytes, so a rebuild
 * touches only the screens that changed, and an app never ships the path of
 * the machine that built it.
 */
function runtimeDocument(document: STXDocument, root: string): STXDocument {
  const source = path.isAbsolute(document.meta.source) ? path.relative(root, document.meta.source).split(path.sep).join('/') : document.meta.source
  return {
    ...document,
    script: { exports: document.script.exports, functions: [], code: '' },
    meta: { ...document.meta, source, compiledAt: 0 },
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
/** Compile routed screens through stx and run them on the shared signals runtime. */
export async function compileNativeBundle(options: CompileNativeBundleOptions): Promise<NativeBundleResult> {
  const names = Object.keys(options.screens)
  if (names.length === 0) throw new Error('screens must name at least one .stx file')
  const routed = options.routed ?? true
  const initialScreen = options.initialScreen ?? names[0]
  if (!options.screens[initialScreen]) throw new Error(`Initial screen ${initialScreen} is not in screens`)
  const root = path.resolve(options.root ?? process.cwd())
  if (options.messages && !options.routesDir) throw new Error('messages ship a language at a time beside route files: they need routesDir')
  if (options.sharedRuntime && !options.routesDir) throw new Error('sharedRuntime is the route files\' runtime: it needs routesDir')
  if (options.messages && !options.sharedRuntime) throw new Error('messages are read by the shared runtime: they need sharedRuntime')
  if (options.messages && options.outFile) throw new Error('messages leave the languages out of the screens\' code, which the one-file bundle cannot read: build it without messages')
  const messages = options.messages ? await collectMessages(root, options.messages) : null
  // Shortcuts, theme colours and breakpoints mean what the web gives them,
  // while compiling and (embedded below) on the device.
  const styleConfig = options.styleConfig ?? await projectStyleConfig(root)
  const stubs = messages ? messageStubs(messages) : null
  const compiledScreens: Array<{ name: string, file: string, compiled: Awaited<ReturnType<typeof compileScreenFile>> }> = []
  const compileScreens = async (): Promise<void> => {
    for (const name of names) {
      const file = path.resolve(root, options.screens[name])
      if (!file.endsWith('.stx')) throw new Error(`Screen ${name} must name a .stx file`)
      compiledScreens.push({ name, file, compiled: await compileScreenFile(file, { root }) })
    }
  }
  // A screen's script, its components' and its composables' are bundled as
  // the screen compiles: each message module goes in as its stand-in there.
  await withNativeStyleConfig(styleConfig, () => stubs ? withModuleSubstitutes(stubs, compileScreens) : compileScreens())

  const runtimeGlobals = nativeRuntimeModule('jsc-globals')
  const sharedScreen = nativeRuntimeModule('shared-screen')
  const appFile = options.app ? path.resolve(root, options.app) : null
  if (appFile && !existsSync(appFile)) throw new Error(`The app script ${options.app} does not exist`)
  if (appFile && !routed) throw new Error('An app script needs a routed bundle')
  if (appFile && options.screens[NATIVE_APP_ROUTE]) throw new Error(`${NATIVE_APP_ROUTE} is the app script's route, not a screen name`)
  const browser = options.browser
  if (options.screens[NATIVE_RUNTIME_ROUTE]) throw new Error(`${NATIVE_RUNTIME_ROUTE} is the runtime prelude's file, not a screen name`)
  const signalsRuntime = generateSignalsRuntime()
  if (browser && options.routesDir) throw new Error('A browser screen is one route; routesDir is for device hosts')
  /**
   * `runtimeVersion`: the route file leans on the runtime prelude
   * (`__runtime.js`) for the JSC globals, the screen host and the signals
   * runtime instead of carrying a copy of them. They were 247 KB of every
   * route file; evaluated as a file of their own, a host's shared
   * JavaScriptCore VM parses them once for every screen.
   */
  const entry = (bundled: typeof compiledScreens, withApp: boolean, runtimeVersion?: string): string => {
    const route = routed
      ? `var routeName = g.__stxNativeRoute || ${JSON.stringify(initialScreen)};
var isApp = ${appFile ? `routeName === ${JSON.stringify(NATIVE_APP_ROUTE)}` : 'false'};
if (!isApp && routeNames.indexOf(routeName) === -1) throw new Error(['Unknown native screen:', routeName].join(' '));
if (isApp ? ${!withApp} : ${JSON.stringify(bundled.map(({ name }) => name))}.indexOf(routeName) === -1) throw new Error(['This bundle does not hold the native screen', routeName].join(' '));`
      : "var routeName = 'main';\nvar isApp = false;"
    const selections = bundled.map(({ name, compiled }, index) => `${index === 0 ? 'if' : 'else if'} (routeName === ${JSON.stringify(routed ? name : 'main')}) {
  nativeDocument = ${JSON.stringify(runtimeDocument(compiled.document, root))};
  manifest = ${JSON.stringify(compiled.manifest)};
}`).join('\n')
    const setups = bundled.map(({ name, compiled }, index) => `${index === 0 ? 'if' : 'else if'} (routeName === ${JSON.stringify(routed ? name : 'main')}) {
  g.__stx_latestSetup = null;
${compiled.scripts.map(script => script.owner
    ? `  g.__stx_componentSetups = g.__stx_componentSetups || {};
  // Kept by id as well as run once: a :for or :if clone of this component
  // has no script to copy, and is set up from this (component hydration).
  g.__stx_componentSetups[${JSON.stringify(script.owner)}] = function() {
${script.code}
  };
  g.__STX_SETUP_ROOT__ = screen && screen.scopeRoot(${JSON.stringify(script.owner)});
  try { g.__stx_componentSetups[${JSON.stringify(script.owner)}](); }
  finally { g.__STX_SETUP_ROOT__ = null; }`
    : script.code).join('\n')}
}`).join('\n')
    const app = withApp && appFile
    const browserRuntime = browser ? nativeRuntimeModule('browser-screen') : null
    const platformModule = browser ? Bun.resolveSync(browser.platformModule, root) : null
    const runtimeImports = runtimeVersion
      ? `var runtime = globalThis.__stxNativeRuntime;
if (!runtime || runtime.version !== ${JSON.stringify(runtimeVersion)}) throw new Error('This screen needs the stx native runtime it was built with: evaluate ${NATIVE_RUNTIME_ROUTE}.js from the same build first');
var installJSCGlobals = runtime.installJSCGlobals;
var prepareNativeApp = runtime.prepareNativeApp;
var prepareSharedNativeScreen = runtime.prepareSharedNativeScreen;`
      : `import { installJSCGlobals } from ${JSON.stringify(runtimeGlobals)};
import { prepareNativeApp, prepareSharedNativeScreen } from ${JSON.stringify(sharedScreen)};`
    const contents = `
${runtimeImports}
${browser ? `import { createBrowserScreenBridge } from ${JSON.stringify(browserRuntime)};\nimport { createBrowserPlatform } from ${JSON.stringify(platformModule)};` : ''}
${app ? `import * as nativeAppModule from ${JSON.stringify(appFile)};` : 'var nativeAppModule = null;'}
${browser ? '(async function() {' : ''}
var g = globalThis;
installJSCGlobals(g);
g.__stxNativeStyleConfig = ${JSON.stringify(styleConfig)};
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
${runtimeVersion ? 'runtime.startSignals();' : signalsRuntime}
var pageSetup = g.__stx_latestSetup;
var pageRuntimeSetup = g.stx && g.stx._latestSetup;
${setups}
// The screen's setup is the native host's to run. A screen script publishes
// it where a page's document runtime adopts its own, and in a browser that
// runtime's DOMContentLoaded and stx:load ran it a second time: another copy
// of the screen, mounted beside this one. Take it, and hand the page back
// whatever setup it had.
var screenSetup = g.__stx_latestSetup || null;
g.__stx_latestSetup = pageSetup;
if (g.stx) g.stx._latestSetup = pageRuntimeSetup || null;
if (isApp) app.start(nativeAppModule);
else screen.mount(g.stx, screenSetup);
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
  let runtime: string | undefined
  let written: NativeBundleResult['messages']
  if (options.routesDir) {
    const dir = path.resolve(root, options.routesDir)
    mkdirSync(dir, { recursive: true })
    // The runtime every route file leans on, once. Its version is its own
    // content's hash, so the same build always writes the same bytes and a
    // route file refuses a prelude from another build.
    const prelude = `
import { installJSCGlobals } from ${JSON.stringify(runtimeGlobals)};
import { prepareNativeApp, prepareSharedNativeScreen } from ${JSON.stringify(sharedScreen)};
globalThis.__stxNativeRuntime = {
  version: '__STX_NATIVE_RUNTIME_VERSION__',
  installJSCGlobals: installJSCGlobals,
  prepareNativeApp: prepareNativeApp,
  prepareSharedNativeScreen: prepareSharedNativeScreen,
  // Each screen starts its own signals runtime, after its host is in place.
  startSignals: function() {
${signalsRuntime}
  },
  // A language's messages for an area (the compile's \`messages\`), read the
  // first time they are looked into: a screen never parses a language it
  // is not shown in, nor an area it does not use.
  messages: function(language, area) {
    var g = globalThis;
    var loaded = g.__stxNativeMessages || (g.__stxNativeMessages = {});
    function table() {
      var forLanguage = loaded[language] || (loaded[language] = {});
      if (Object.prototype.hasOwnProperty.call(forLanguage, area)) return forLanguage[area];
      var value = null;
      if (typeof g.__stxNativeReadMessages === 'function') {
        try {
          var text = g.__stxNativeReadMessages(language, area);
          if (typeof text === 'string') value = JSON.parse(text);
        }
        catch (error) { console.error('[stx native] could not read the ' + language + ' messages for ' + area, error); }
      }
      forLanguage[area] = value;
      return value;
    }
    var own = Object.prototype.hasOwnProperty;
    return new Proxy({}, {
      get: function(target, name) { var messages = table(); return messages && own.call(messages, name) ? messages[name] : undefined; },
      has: function(target, name) { var messages = table(); return !!messages && own.call(messages, name); },
      ownKeys: function() { var messages = table(); return messages ? Object.keys(messages) : []; },
      getOwnPropertyDescriptor: function(target, name) {
        var messages = table();
        return messages && own.call(messages, name) ? { value: messages[name], writable: false, enumerable: true, configurable: true } : undefined;
      },
    });
  },
};
`
    let runtimeVersion: string | undefined
    const runtimeFile = path.join(dir, `${NATIVE_RUNTIME_ROUTE}.js`)
    if (options.sharedRuntime) {
      const preludeCode = await build('stx:native-shared-screens', [plugin(prelude)], minify, dependencies)
      runtimeVersion = Bun.hash(preludeCode).toString(36)
      runtime = runtimeFile
      await Bun.write(runtime, preludeCode.replace('__STX_NATIVE_RUNTIME_VERSION__', runtimeVersion))
    }
    // Each route file carries its runtime itself: a prelude left from a
    // build that shared it must not be evaluated in front of them.
    else rmSync(runtimeFile, { force: true })
    const messagesDir = path.join(dir, NATIVE_MESSAGES_DIR)
    // Only this build's messages: a language or area since removed is gone.
    rmSync(messagesDir, { recursive: true, force: true })
    const routeAreas: Record<string, string[]> = {}
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
        // The app script's imports are bundled here, not as a screen's are.
        const code = await build('stx:native-shared-screens', [plugin(entry(target.screens, target.app, runtimeVersion))], minify, dependencies, stubs ?? undefined)
        await Bun.write(file, code)
        routes![target.name] = file
        if (messages) routeAreas[target.name] = areasRead(code)
      }))
    }
    if (messages) {
      for (const [language, areas] of messages.data) {
        for (const [area, json] of areas)
          await Bun.write(path.join(messagesDir, language, `${area}.json`), json)
      }
      const sorted = Object.fromEntries(Object.keys(routeAreas).sort().map(name => [name, routeAreas[name]!]))
      await Bun.write(path.join(messagesDir, 'routes.json'), JSON.stringify(sorted))
      for (const file of messages.files.keys()) dependencies.add(file)
      written = { dir: messagesDir, languages: [...messages.data.keys()], routes: sorted }
    }
    if (!options.outFile) return { code: '', routes, runtime, ...(written ? { messages: written } : {}), diagnostics, dependencies: [...dependencies] }
  }
  const code = await build('stx:native-shared-screens', [plugin(entry(compiledScreens, true))], minify, dependencies)
  if (!options.outFile) return { code, diagnostics, dependencies: [...dependencies] }
  const outFile = path.resolve(root, options.outFile)
  mkdirSync(path.dirname(outFile), { recursive: true })
  await Bun.write(outFile, code)
  return { code, outFile, ...(routes ? { routes, runtime } : {}), ...(written ? { messages: written } : {}), diagnostics, dependencies: [...dependencies] }
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
