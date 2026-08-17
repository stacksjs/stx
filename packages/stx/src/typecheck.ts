/**
 * Type-check the TypeScript inside `.stx` files.
 *
 * `tsc` treats `.stx` as an unknown extension, so a page's `<script server>` and
 * `<script client>` blocks were checked by nothing. The only way to get coverage
 * on template logic was to move it into a `.ts` file on the tsconfig include
 * path — so apps split pages by "can tsc see it" rather than by cohesion, and
 * hand-wrote ambient interfaces that verify nothing. See #1852.
 *
 * ## How it works
 *
 * Each script block becomes its own virtual `.ts` file. Two properties matter:
 *
 *  - **Blocks are checked separately, never concatenated.** The editor plugin
 *    appends every block into one virtual file, which makes two blocks that
 *    legitimately declare the same local name collide, and lets a client block
 *    "see" server bindings it cannot reach at runtime. Both are false signals.
 *
 *  - **Line numbers are preserved by padding.** The virtual file is prefixed
 *    with one newline per line that preceded the block, so a diagnostic's line
 *    number IS the line number in the `.stx` file. No offset arithmetic, and
 *    nothing to get wrong when a file has several blocks.
 *
 * Runtime globals (`state`, `onMount`, `useQuery`, …) resolve because the
 * package's own `stx.d.ts` is added to the program. That is the difference
 * between this and the editor plugin, which instead *suppresses* every
 * "Cannot find name" diagnostic mentioning a known global — and so also
 * suppresses genuine typos.
 *
 * @module typecheck
 */

import type { ScriptBlock, ScriptKind, VirtualFile } from './stx-virtual-ts'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { ComposableModule } from './composable-loader'
import { listComposableModules } from './composable-loader'
import { STX_RUNTIME_GLOBALS } from './runtime-globals'
import { stateDir } from './state-dir'
import {
  absolutizeRelativeSpecifiers,
  buildVirtualTypeScript,
  extractScriptBlocks,
  resolvePosition,
  clientPayloadDeclarations,
  scrapedBridgeNames,
  serverContextDeclarations,
  blankScriptDirectives,
  substituteInterpolationsInPlace,
} from './stx-virtual-ts'

export type { ScriptBlock, ScriptKind } from './stx-virtual-ts'
export {
  extractScriptBlocks,
  extractTemplateExpressions,
  type TemplateExpression,
} from './stx-virtual-ts'

/** Where a diagnostic came from: a script block, or the markup itself. */
export type DiagnosticOrigin = ScriptKind | 'template'

export interface TypecheckDiagnostic {
  file: string
  line: number
  column: number
  code: number
  message: string
  category: 'error' | 'warning' | 'suggestion' | 'message'
  blockKind: DiagnosticOrigin
  /** The template expression at fault, when the origin is `template`. */
  expression?: string
}

export interface TypecheckOptions {
  /** Extra ambient declaration files to include (e.g. an app's own types). */
  extraLibs?: string[]
  /** Check `<script client>` and bare `<script>` blocks. Default true. */
  client?: boolean
  /** Check `<script server>` blocks. Default true. */
  server?: boolean
  /** Check `{{ }}` and directive expressions in the markup. Default true. */
  templates?: boolean
  /** Compiler options to merge over the defaults. */
  compilerOptions?: Record<string, unknown>
}

export interface TypecheckResult {
  diagnostics: TypecheckDiagnostic[]
  /**
   * Set when the checker itself failed rather than the code being clean.
   *
   * `tsc` exiting non-zero while producing nothing this parser recognises means
   * it aborted — a syntax error in an ambient file does that, and
   * `skipLibCheck` does not help because it suppresses SEMANTIC diagnostics
   * only. Reported as zero errors, that is indistinguishable from success, and
   * the flag people reach for when the checker cannot see their types is
   * `--lib` — which is exactly how you would introduce such a file. One app's
   * 220 errors became 0 that way and read as "wired up correctly, codebase is
   * clean" (stacksjs/stx#1906).
   */
  failure?: string
  /** Files that contained at least one checkable block. */
  checkedFiles: string[]
  /** Number of script blocks checked. */
  blockCount: number
  /** Number of template expressions checked. */
  expressionCount: number
}

/**
 * Build the virtual TypeScript source for one block.
 *
 * The body is prefixed with blank lines so its first line lands on the same line
 * number it occupies in the `.stx` file — which makes every diagnostic's line
 * number directly usable with no mapping table.
 *
 * The trailing `export {}` makes the buffer a MODULE, and that is load-bearing.
 * Without it a block with no imports is a global script, so every top-level
 * declaration collides with the DOM lib: `const name = …` and `const status = …`
 * in a `<script server>` block both reported "Cannot redeclare block-scoped
 * variable", and those are ordinary names for server-rendered page data. It is
 * appended rather than prepended so the line numbers above it are untouched.
 *
 * `originDir` is the directory the `.stx` file really lives in. The buffer is
 * written into the state directory, and tsc resolves a relative specifier
 * against the file containing it — so without this, `../target` was looked for
 * next to `.stx/typecheck/` (#1928).
 */
export function buildVirtualSource(block: ScriptBlock, serverCode = '', originDir = ''): string {
  const leadingNewlines = block.startLine > 1 ? '\n'.repeat(block.startLine - 1) : ''

  // A block may take a server value through an interpolation. As TypeScript
  // that is a syntax error, and a parse failure suppresses every real
  // diagnostic in the same file — so the checker was blind wherever this is
  // used, which is 48 of the framework's own 95 components.
  // Interpolations first: the directive matcher requires the directive to be
  // alone on its line, and a multi-line `{{ }}` in its argument is collapsed to
  // one line by the substitution above.
  const code = blankScriptDirectives(substituteInterpolationsInPlace(block.code))

  /*
   * A client block is checked in its own buffer, so a value reaching it through
   * the server-to-client bridge was simply "Cannot find name" — which made
   * `stx typecheck` report an error on every page that used the bridge at all.
   * A checker that invents errors gets muted, and a muted gate catches nothing.
   *
   * Appended rather than prepended: every declaration it emits hoists, so the
   * block's own lines keep their numbers and a diagnostic still points where
   * the author wrote the code (#1868 ask 2).
   */
  const payload = block.kind === 'client' || block.kind === 'plain'
    ? clientPayloadDeclarations(serverCode, block.code)
    : ''

  // Applied to the whole buffer rather than to `code` alone: a hoisted server
  // type can carry an `import('./x').Foo`, and the rewrite adds no lines, so
  // the padding above still puts every diagnostic on the author's line.
  return absolutizeRelativeSpecifiers(`${leadingNewlines + code}\n${payload}\nexport {}\n`, originDir)
}

/**
 * Make `from 'stx'` resolve, because the framework accepts it.
 *
 * Inside a `.stx` script block, `stx` is a VIRTUAL specifier: `client-script.ts`
 * treats `'stx'` and `'@stacksjs/stx'` alike and strips the import, handing the
 * names to the block as runtime globals. It is also the house spelling — 164
 * uses across `docs/` and `src/` against 126 of the scoped name — so it is what
 * an author copies out of the documentation.
 *
 * The checker did not know that, and reported `Cannot find module 'stx'` on the
 * documented form. That is not merely a false error; it MASKED a real one. An
 * unresolved module is `any`, so every signature behind it stopped being
 * enforced: correcting the specifier in one app turned 18 "Cannot find module"
 * errors into 36 genuine constraint errors that had been invisible the whole
 * time (stacksjs/stx#1917).
 *
 * Aliased to the real package rather than re-declaring its exports, so there is
 * no second list of the public API to drift. Emitted only when the package
 * actually resolves — a `declare module` pointing at nothing would put an error
 * in an ambient file, and a syntax-level failure there takes the whole run down
 * with it (#1906).
 *
 * Scoped to this checker on purpose. The specifier is virtual only where the
 * import is stripped, which is inside a `.stx` block; a `.ts` composable has a
 * real import and must keep using the real package name.
 */
function virtualStxModuleDeclaration(files: string[]): string {
  const anchor = files.length > 0 ? path.dirname(path.resolve(files[0])) : process.cwd()

  try {
    Bun.resolveSync('@stacksjs/stx', anchor)
  }
  catch {
    return ''
  }

  return [
    '// Generated — `stx` is the virtual specifier client-script.ts strips.',
    'declare module \'stx\' {',
    '  export * from \'@stacksjs/stx\'',
    '}',
  ].join('\n')
}

/**
 * Names the composable loader refuses to publish as bare globals.
 *
 * At runtime it skips any name already on `window`, warns, and tells the author
 * to import it instead. The checker cannot evaluate `in window`, so it mirrors
 * the decision with the properties a composable is plausibly named after. The
 * cost of a miss is small and one-directional: an unlisted collision produces a
 * redeclaration error in the generated ambient file rather than silence.
 *
 * Declaring these anyway would be worse than not declaring them — it would
 * typecheck a bare call that the runtime has refused to bind.
 */
const WINDOW_OWNED_NAMES = new Set([
  'name', 'status', 'length', 'location', 'history', 'origin', 'closed', 'close',
  'open', 'focus', 'blur', 'print', 'scroll', 'scrollTo', 'scrollBy', 'stop',
  'top', 'parent', 'self', 'frames', 'event', 'external', 'menubar', 'toolbar',
])

/**
 * Ambient declarations for an app's own `composablesDir` exports.
 *
 * The runtime publishes every one of them as a bare global, so a page calls
 * `useSessionToken()` with no import. The checker only knew the framework's
 * globals from `stx.d.ts`, so an app's own composable was a hard error — TS2552,
 * "Cannot find name", usually with a suggestion pointing at an unrelated
 * built-in — on code that works in dev and in the static build (#1934).
 *
 * Each name is bound to its real module through `typeof import(...)`, not to
 * `any`. Declaring `any` would silence the error while checking nothing, which
 * is the same shape as the bug: the checker reporting a verdict on a surface it
 * cannot see. With the real type, a wrong argument or a misspelled property on
 * the result is caught too.
 *
 * `@composables` is declared as a module in the same pass, so the explicit
 * import form typechecks as well — that is the documented escape hatch for a
 * name the runtime will not bind, and it would be odd for the escape hatch to
 * be the thing that fails.
 */
function composableGlobalDeclarations(modules: ComposableModule[]): string {
  if (modules.length === 0)
    return ''

  const lines = ['// Generated — the composables the runtime publishes as bare globals.']
  const taken = new Set<string>(STX_RUNTIME_GLOBALS)
  const reExports: string[] = []

  for (const { file, names } of modules) {
    const specifier = JSON.stringify(file.replace(/\\/g, '/').replace(/\.ts$/, ''))
    reExports.push(`  export * from ${specifier}`)

    for (const name of names) {
      // A duplicate across two composable files is the author's problem at
      // runtime too (last one wins); declaring it twice would only add a
      // confusing redeclaration error on top.
      if (taken.has(name) || WINDOW_OWNED_NAMES.has(name))
        continue
      taken.add(name)
      lines.push(`declare const ${name}: typeof import(${specifier})[${JSON.stringify(name)}]`)
    }
  }

  lines.push('declare module \'@composables\' {', ...reExports, '}')
  return lines.join('\n')
}

/** Virtual path for a block, stable and traceable back to its origin. */
export function virtualPathFor(filePath: string, kind: DiagnosticOrigin, index: number): string {
  return `${filePath}.__stx_${kind}${index}.ts`
}

/** Map a virtual path back to the `.stx` file it came from. */
export function sourcePathFor(virtualPath: string): string {
  return virtualPath.replace(/\.__stx_(?:server|client|plain|template)\d+\.ts$/, '')
}

/**
 * Locate the package's own `stx.d.ts`, which types the runtime globals.
 *
 * Checked rather than assumed: this module runs from `src/` in the repo and
 * from `dist/` when installed, and both sit one level under the package root.
 * Returns `null` when it is genuinely absent so the caller can fall back rather
 * than hand tsc a path to nothing.
 */
export function findRuntimeTypeDeclarations(): string | null {
  for (const candidate of [
    path.resolve(import.meta.dir, '..', 'stx.d.ts'),
    path.resolve(import.meta.dir, '..', '..', 'stx.d.ts'),
  ]) {
    if (existsSync(candidate))
      return candidate
  }
  return null
}

/**
 * One diagnostic line as `tsc --pretty false` prints it:
 *
 *   path/to/file.ts(12,5): error TS2322: Type 'string' is not assignable …
 */
const TSC_LINE_RE = /^(.*?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.*)$/

/**
 * Whether a diagnostic code is one TypeScript raises while PARSING.
 *
 * TypeScript numbers its messages by phase: 1xxx is the syntactic and grammar
 * range ("';' expected", "Declaration or statement expected"), and everything
 * the type checker itself produces starts at 2000. The distinction matters
 * because tsc skips semantic checking for the entire program when any file has
 * a syntax error, so these are the codes that decide which buffers have to sit
 * out the second pass.
 *
 * Bounded below as well as above. This checker raises diagnostics of its own
 * under code 0 — the implicit-bridge warning — and a bare `code < 2000` would
 * count one of those as a parse failure.
 */
function isSyntactic(code: number): boolean {
  return code >= 1000 && code < 2000
}

/**
 * Type-check `.stx` files.
 *
 * Runs the `tsc` BINARY over generated virtual files rather than driving the
 * compiler API. TypeScript 7 ships as a Go port whose npm package exposes only
 * `version` — no `createProgram`, no `ScriptTarget` — so an API-based checker
 * would work on TS 5 and break on the version this repo actually resolves.
 * Shelling out works across both.
 *
 * TypeScript is not a declared dependency: anyone running a type-check already
 * has it, and making the package depend on a compiler to serve a page would be
 * the wrong trade.
 */
/**
 * The app's own path aliases, so an aliased import resolves.
 *
 * The generated tsconfig lives in a temp directory and declared nothing about
 * module resolution beyond `bundler`, so every alias an app defines —
 * `~/resources/types`, `@/components/Foo`, `Models/User` — was `TS2307 Cannot
 * find module`. A 77-file app reported 29 of them, none of which was a real
 * missing module. A checker that cannot resolve an app's own imports reports
 * noise in exactly the files that do the most work.
 *
 * Three details this has to get right:
 *
 *  - **`baseUrl` must come out absolute.** `paths` entries are relative to it,
 *    and the config they end up in is not in the project. With no `baseUrl`
 *    declared, TypeScript resolves `paths` against the tsconfig's own
 *    directory, so that is the default here.
 *  - **tsconfig is JSONC.** Comments and trailing commas are legal and common
 *    (the app that surfaced this opens with a four-line comment), so
 *    `JSON.parse` on the raw text throws.
 *  - **`extends` chains.** The nearest config wins; a base only supplies what
 *    the child left unset.
 *
 * Failure is silent and non-fatal: an unreadable or absent tsconfig just means
 * no aliases, which is what the checker did before.
 */
function readProjectPathAliases(startDir: string): { paths?: Record<string, string[]> } {
  let dir = path.resolve(startDir)
  let configPath: string | undefined
  for (;;) {
    const candidate = path.join(dir, 'tsconfig.json')
    if (existsSync(candidate)) {
      configPath = candidate
      break
    }
    const parent = path.dirname(dir)
    if (parent === dir)
      break
    dir = parent
  }
  if (!configPath)
    return {}

  // Character scan, not regex. A glob is indistinguishable from a comment to a
  // regex: `"app/Models/**/*.ts"` contains a literal `/**/`, which a block-comment
  // pattern happily eats, and the result parses as garbage or — worse — as valid
  // JSON with a silently wrong value. Only a scanner that knows whether it is
  // inside a string can tell the two apart.
  const stripJsonc = (text: string): string => {
    let out = ''
    let inString = false
    let escaped = false

    for (let i = 0; i < text.length; i++) {
      const c = text[i]

      if (inString) {
        out += c
        if (escaped) escaped = false
        else if (c === '\\') escaped = true
        else if (c === '"') inString = false
        continue
      }

      if (c === '"') {
        inString = true
        out += c
        continue
      }
      if (c === '/' && text[i + 1] === '/') {
        while (i < text.length && text[i] !== '\n') i++
        out += '\n'
        continue
      }
      if (c === '/' && text[i + 1] === '*') {
        i += 2
        while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
        i++
        continue
      }
      out += c
    }

    // Trailing commas are legal in tsconfig and not in JSON. Safe as a regex
    // now: every string has already survived the scan above intact.
    return out.replace(/,(\s*[}\]])/g, '$1')
  }

  const seen = new Set<string>()
  let current: string | undefined = configPath
  let paths: Record<string, string[]> | undefined
  let baseUrl: string | undefined
  let owner = configPath

  while (current && !seen.has(current)) {
    seen.add(current)
    let parsed: any
    try {
      parsed = JSON.parse(stripJsonc(readFileSync(current, 'utf8')))
    }
    catch {
      break
    }

    const co = parsed?.compilerOptions ?? {}
    if (!paths && co.paths && typeof co.paths === 'object') {
      paths = co.paths
      owner = current
    }
    if (!baseUrl && typeof co.baseUrl === 'string') {
      baseUrl = path.resolve(path.dirname(current), co.baseUrl)
    }

    if (paths && baseUrl)
      break

    current = typeof parsed?.extends === 'string'
      ? path.resolve(path.dirname(current), parsed.extends.endsWith('.json') ? parsed.extends : `${parsed.extends}.json`)
      : undefined
  }

  if (!paths)
    return {}

  // Absolute targets, and NO `baseUrl`.
  //
  // `paths` values resolve against `baseUrl`, and failing that against the
  // tsconfig's own directory — which for the generated config is a temp dir,
  // so relative targets would point at nothing. Emitting the app's `baseUrl`
  // instead looks like the obvious fix and is worse: it makes EVERY bare
  // specifier resolve against the app root first, which shadows real package
  // resolution. Rewriting just the alias targets to absolute leaves everything
  // else exactly as it was.
  const base = baseUrl ?? path.dirname(owner)
  const absolute: Record<string, string[]> = {}
  for (const [pattern, targets] of Object.entries(paths)) {
    if (!Array.isArray(targets))
      continue
    absolute[pattern] = targets.map(t => (typeof t === 'string' && !path.isAbsolute(t) ? path.resolve(base, t) : t))
  }

  return { paths: absolute }
}

export async function typecheckStxFiles(
  files: string[],
  options: TypecheckOptions = {},
): Promise<TypecheckResult> {
  const checkClient = options.client !== false
  const checkServer = options.server !== false
  const checkTemplates = options.templates !== false

  interface VirtualEntry {
    source: string
    origin: string
    kind: DiagnosticOrigin
    /** Present for the whole-file template buffer, which needs a line map. */
    virtual?: VirtualFile
  }

  const virtualFiles = new Map<string, VirtualEntry>()
  /** Per file: the bridge names still crossing implicitly, and where to say so. */
  const scrapedByFile = new Map<string, { names: string[], line: number, kind: ScriptKind }>()
  const checkedFiles: string[] = []
  let blockCount = 0
  let expressionCount = 0

  // Resolved before the buffers are built: when the real declarations are
  // available, the buffers must NOT also emit `any` versions of the same names.
  const runtimeTypes = findRuntimeTypeDeclarations()

  for (const file of files) {
    const source = await Bun.file(file).text()
    const blocks = extractScriptBlocks(source).filter((b) => {
      if (b.kind === 'server')
        return checkServer
      // A bare `<script>` is a client block — the `client` attribute is an
      // explicit alias, not a different thing — so it is checked under the same
      // switch. It used to be dropped here as "not part of the authored TS
      // surface", which is the one script form nobody writes an attribute for
      // and therefore the most common one in the wild: the framework's own
      // defaults shipped 18 blocks that could not parse and typecheck reported
      // the 2 that happened to say `client` (stacksjs/stx#1920).
      return checkClient
    })

    /*
     * The server blocks' source, for the client blocks' payload projection.
     * Taken from ALL server blocks rather than the first: a layout and the page
     * it wraps may each declare their own crossings, and `defineClientPayload`
     * merges rather than replaces.
     */
    const serverCode = extractScriptBlocks(source)
      .filter(block => block.kind === 'server')
      .map(block => block.code)
      .join('\n')

    // Recorded here, where both halves of the file are in hand, and reported
    // after tsc has run so the warning sits alongside the real diagnostics.
    if (checkClient && serverCode) {
      const clientBlocks = blocks.filter(block => block.kind !== 'server')
      const names = [...new Set(clientBlocks.flatMap(block => scrapedBridgeNames(serverCode, block.code)))]
      if (names.length > 0)
        scrapedByFile.set(file, { names, line: clientBlocks[0].startLine, kind: clientBlocks[0].kind })
    }

    // The template buffer inlines the script bodies, so an expression sees the
    // real types the blocks declare — which is what catches `{{ row.total_vists }}`
    // against a typed row rather than merely an undeclared name.
    // Where the file really is, so its relative imports resolve against it
    // rather than against the temp directory its buffers are written to (#1928).
    const originDir = path.dirname(path.resolve(file))

    const templateBuffer = checkTemplates
      ? buildVirtualTypeScript(source, { runtimeGlobals: !runtimeTypes, originDir })
      : null
    const expressions = templateBuffer
      ? [...templateBuffer.lineMap.values()].filter(m => m.expression).length
      : 0

    if (blocks.length === 0 && expressions === 0)
      continue

    checkedFiles.push(file)
    blockCount += blocks.length
    expressionCount += expressions

    blocks.forEach((block, i) => {
      virtualFiles.set(virtualPathFor(file, block.kind, i), {
        source: buildVirtualSource(block, serverCode, originDir),
        origin: file,
        kind: block.kind,
      })
    })

    if (templateBuffer && expressions > 0) {
      virtualFiles.set(virtualPathFor(file, 'template', 0), {
        source: templateBuffer.text,
        origin: file,
        kind: 'template',
        virtual: templateBuffer,
      })
    }
  }

  if (virtualFiles.size === 0)
    return { diagnostics: [], checkedFiles, blockCount: 0, expressionCount: 0 }

  /*
   * Resolved against the caller's cwd, not left relative (#1906).
   *
   * The generated tsconfig lives in a temp directory, and tsc resolves a
   * relative entry in `files` against the tsconfig — so `--lib types/session.d.ts`,
   * the most natural way to write it, looked for
   * `.stx/typecheck/types/session.d.ts` and found nothing. tsc then aborted
   * with TS6053 and reported no diagnostics at all, which read as a clean run:
   * one app's 220 errors became 0 and looked like a correctly wired gate.
   *
   * An absolute path the caller passed is left exactly as it is.
   */
  const ambient: string[] = (options.extraLibs ?? []).map(lib => path.resolve(lib))

  // The runtime globals come from the package's own `stx.d.ts`, which types
  // them properly — `state<T>(initial: T): StxSignal<T>` rather than `any`.
  //
  // That file was avoided at first on the belief that including it drags in the
  // built declarations, and `dist/composables.d.ts` has been syntactically
  // invalid before now (`navigate: (path: string)) => unknown;`); tsc aborts on
  // a SYNTAX error in a lib file, since skipLibCheck only suppresses semantic
  // ones, and the checker then reported nothing at all about the user's code.
  // That belief was wrong: `stx.d.ts` has no imports and no triple-slash
  // references — it is a self-contained ambient declaration file, so nothing
  // about `dist/` is reachable from it. It is also shipped (`files` in
  // package.json), so this resolves for an installed package too.
  //
  // With `any` globals, every client-side template expression was unchecked:
  // `const n = state(0)` gave `n: any`, so `{{ n.nosuch }}` passed. See #1889.
  if (runtimeTypes)
    ambient.push(runtimeTypes)

  const globalsDts = `${stateDir()}/typecheck/__stx_globals.d.ts`
  const globalDecls = [
    '// Generated — the context serve.ts injects into <script server> blocks.',
    serverContextDeclarations(),
    ...(runtimeTypes
      ? []
      // Fallback only: if stx.d.ts cannot be found (an unusual install layout),
      // untyped globals still beat unresolved ones, because the alternative is
      // a wall of "Cannot find name" on working code.
      : ['declare const window: any', ...STX_RUNTIME_GLOBALS.map(name => `declare const ${name}: any`)]),
    virtualStxModuleDeclaration(files),
    composableGlobalDeclarations(await listComposableModules()),
  ].filter(Boolean).join('\n')

  const workDir = `${stateDir()}/typecheck`
  await Bun.$`rm -rf ${workDir}`.quiet().nothrow()
  await Bun.$`mkdir -p ${workDir}`.quiet().nothrow()

  await Bun.write(globalsDts, globalDecls)

  // Written flat, keyed by BASENAME so a diagnostic resolves exactly.
  //
  // Two things were wrong with deriving the name from the path alone. Sanitising
  // is not injective — `a/b.stx` and `a_b.stx` both become `a_b.stx…` — so one
  // file silently overwrote the other and its blocks were never checked. And
  // resolving by `endsWith` misattributed: `sub/views/a.stx` ends with
  // `views/a.stx`, so its errors were reported against a different file. A
  // counter makes the name unique, and an exact lookup makes the way back exact.
  const writtenToOrigin = new Map<string, VirtualEntry>()
  let counter = 0
  for (const [virtualPath, meta] of virtualFiles) {
    const safe = `${counter++}_${virtualPath.replace(/[^\w.-]+/g, '_')}`
    await Bun.write(`${workDir}/${safe}`, meta.source)
    writtenToOrigin.set(safe, meta)
  }

  const compilerOptions = {
      target: "ESNext",
      module: "ESNext",
      moduleResolution: "bundler",
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      allowJs: true,
      esModuleInterop: true,
      resolveJsonModule: true,
      lib: ["ESNext", "DOM", "DOM.Iterable"],
      types: [],
      // The app's own aliases, ahead of the explicit override so a caller can
      // still replace them.
      //
      // Anchored on a FILE BEING CHECKED, not on `process.cwd()`. The checker
      // is routinely run from somewhere other than the project it is pointed
      // at — and resolving from the cwd picks up whatever tsconfig happens to
      // sit there and forces it on files that have nothing to do with it,
      // which broke this package's own fixtures the moment it was tried.
      ...readProjectPathAliases(files.length > 0 ? path.dirname(path.resolve(files[0])) : process.cwd()),
      ...(options.compilerOptions ?? {}),
  }

  /** Run tsc over a chosen subset of the generated buffers. */
  const runTsc = async (names: string[], pass: number): Promise<{ output: string, exitCode: number }> => {
    const tsconfigPath = `${workDir}/tsconfig${pass === 1 ? '' : `.${pass}`}.json`
    await Bun.write(tsconfigPath, JSON.stringify({
      compilerOptions,
      files: names.map(name => `${workDir}/${name}`).concat(globalsDts, ...ambient),
    }, null, 2))

    const proc = Bun.spawnSync(["bun", "x", "tsc", "-p", tsconfigPath, "--pretty", "false"], {
      stdout: "pipe",
      stderr: "pipe",
    })
    return {
      output: new TextDecoder().decode(proc.stdout) + new TextDecoder().decode(proc.stderr),
      exitCode: proc.exitCode ?? 0,
    }
  }

  const first = await runTsc([...writtenToOrigin.keys()], 1)
  const output = first.output

  const diagnostics: TypecheckDiagnostic[] = []
  const exitCode = first.exitCode
  // Diagnostic lines tsc PRINTED, before any are filtered for belonging to a
  // file we generated, and whether any landed in a file WE added to the
  // program. Both distinctions matter below.
  let printedDiagnostics = 0
  const ambientBasenames = new Set(ambient.map(lib => lib.split('/').pop()!))
  let ambientDiagnostics = 0
  /** Buffers that failed to PARSE — the ones that mute the rest of the run. */
  const unparseable = new Set<string>()

  const parseTscOutput = (text: string): void => {
  for (const rawLine of text.split("\n")) {
    const m = rawLine.match(TSC_LINE_RE)
    if (!m)
      continue
    printedDiagnostics++
    if (ambientBasenames.has(m[1].split('/').pop()!))
      ambientDiagnostics++
    const [, filePart, lineStr, colStr, category, code, message] = m
    const written = filePart.split('/').pop()!
    const entry = writtenToOrigin.get(written)
    if (!entry)
      continue
    if (isSyntactic(Number(code)))
      unparseable.add(written)

    let line = Number(lineStr)
    let column = Number(colStr)
    let expression: string | undefined

    if (entry.virtual) {
      const at = resolvePosition(entry.virtual, line, column)
      // The template buffer inlines the script bodies, so it also reports the
      // blocks' own errors — which the per-block files already cover. Only
      // expression diagnostics are new; everything else would be a duplicate.
      if (!at?.expression)
        continue

      // TS2774 "this condition will always return true since this function is
      // always defined — did you mean to call it instead?" is wrong about a
      // template, and only about a template.
      //
      // `UNWRAP_HELPER` types a signal as the INTERSECTION of the signal and
      // its value, so that `:if="flag"` and `@click="flag.set(true)"` both
      // type-check off one declaration. The intersection stays callable, and
      // TS2774 fires on precisely that: a callable in a boolean position. So
      // the diagnostic lands on `x-class="ready ? '' : 'hidden'"` — the exact
      // form the unwrap exists to bless.
      //
      // The runtime disagrees with it. `createExpressionAutoUnwrapProxy`
      // decides PER IDENTIFIER, from the expression text: a name the
      // expression calls stays a callable signal, a name it only reads is
      // handed over unwrapped. So in `a && !b()`, `b` stays callable and `a`
      // reads as its value — the condition does not always return true.
      //
      // Left in place for script blocks, where it is a true positive: a
      // `<script client>` body gets the raw signal and `if (flag)` there really
      // is always truthy. Only the template buffer suppresses it.
      if (Number(code) === 2774)
        continue

      line = at.line
      column = at.column
      expression = at.expression.code.trim()
    }

    diagnostics.push({
      file: entry.origin,
      // Already the .stx line number: the virtual source was padded so the
      // block starts on the line it occupies in the original file.
      line,
      column,
      code: Number(code),
      message,
      category: category === "error" ? "error" : "warning",
      blockKind: entry.kind,
      expression,
    })
  }
  }

  parseTscOutput(output)
  // Snapshotted before any second pass: the checks below ask whether THIS run
  // aborted, and a retry's output would answer a different question.
  const firstPassPrinted = printedDiagnostics
  const firstPassAmbient = ambientDiagnostics

  /*
   * A second pass, without the buffers that could not be parsed.
   *
   * tsc collects SEMANTIC diagnostics only when the program has no SYNTACTIC
   * ones — not per file, program-wide (`emitFilesAndReportErrors`). So a single
   * unparseable block anywhere in the run silently disables type checking for
   * every other file in it: a corpus reporting 500 real type errors reported 52
   * syntax errors and nothing else once one broken block joined the program.
   *
   * That is the same shape as #1906 — a number that reads as a total while most
   * of the work never happened — and checking bare `<script>` blocks (#1920)
   * walked straight into it, because an unparseable bare block is exactly what
   * that issue is about. Fixing the blind spot would have created a new one.
   *
   * So the broken buffers are dropped and the rest are checked again. The user
   * gets both halves at once instead of discovering the second half only after
   * fixing the first. Costs a second tsc run, and only on a run that is already
   * failing.
   */
  if (unparseable.size > 0 && unparseable.size < writtenToOrigin.size) {
    const survivors = [...writtenToOrigin.keys()].filter(name => !unparseable.has(name))
    parseTscOutput((await runTsc(survivors, 2)).output)
  }

  /*
   * Names still crossing on the implicit bridge (#1868 ask 4).
   *
   * A warning, not an error. These pages work — the value does arrive — but it
   * arrives because its name happened to appear in the client source, and it
   * arrives untyped. Now that `defineClientPayload` gives them somewhere to go,
   * saying so is a nudge rather than the noise it would have been before.
   *
   * Reported once per file at the client block that reaches for them, rather
   * than once per name, so a page with a dozen crossings gets one line.
   */
  if (checkClient) {
    for (const [file, scraped] of scrapedByFile) {
      if (scraped.names.length === 0)
        continue

      diagnostics.push({
        file,
        line: scraped.line,
        column: 1,
        code: 0,
        message: `${scraped.names.length === 1 ? '1 value reaches' : `${scraped.names.length} values reach`} `
          + `this block on the implicit bridge and ${scraped.names.length === 1 ? 'is' : 'are'} untyped: ${scraped.names.join(', ')}. `
          + `Declare them with defineClientPayload({ ${scraped.names.join(', ')} }) in the server block to have them checked.`,
        category: 'warning',
        blockKind: scraped.kind,
      })
    }
  }

  // Deduplicate: an expression that appears twice in a file produces the same
  // diagnostic at the same place once per occurrence only if they really are
  // distinct positions, so the key includes them.
  const seen = new Set<string>()
  const unique = diagnostics.filter((d) => {
    const key = `${d.file}:${d.line}:${d.column}:${d.code}:${d.message}`
    if (seen.has(key))
      return false
    seen.add(key)
    return true
  })

  unique.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column)
  /*
   * tsc failed but said nothing this parser recognises: it aborted rather than
   * finding the code clean. Reporting zero errors here is the one outcome that
   * cannot be told apart from success (#1906).
   *
   * Two shapes, because one condition could not tell them apart:
   *
   * - tsc printed NOTHING positioned and exited non-zero. A missing `--lib`
   *   file does this (TS6053 carries no position), and it is the case that
   *   started the report.
   * - tsc printed diagnostics IN A FILE WE ADDED, and nothing of the user's
   *   survived. That is a broken lib taking the run down with it.
   *
   * Deliberately not "no diagnostics survived filtering": tsc can legitimately
   * report errors in files this checker does not own, all of which are
   * discarded, and calling that "did not run" would make the checker cry wolf
   * on a genuinely clean page.
   */
  const brokenLib = firstPassAmbient > 0 && unique.length === 0
  const abortedSilently = exitCode !== 0 && firstPassPrinted === 0
  const failure = brokenLib || abortedSilently
    ? `${brokenLib
      ? 'a file passed with --lib has errors of its own, so nothing in your code was checked'
      : `tsc exited ${exitCode} without reporting any diagnostic, so nothing was checked`}. `
      + `A syntax error in an ambient declaration file does this — skipLibCheck suppresses `
      + `SEMANTIC diagnostics only. tsc said:\n${output.trim().split('\n').slice(0, 12).join('\n') || '(no output)'}`
    : undefined

  return { diagnostics: unique, checkedFiles, blockCount, expressionCount, failure }
}

/** Render diagnostics the way a CLI should: file:line:col, then the message. */
export function formatTypecheckDiagnostics(diagnostics: TypecheckDiagnostic[]): string {
  return diagnostics
    .map((d) => {
      // `plain` is this checker's internal name for a block whose tag carries no
      // attribute. Printing it back as `<script plain>` would name a tag the
      // author cannot write and did not write; the tag they wrote is `<script>`.
      const where = d.blockKind === 'template'
        ? `[template: ${d.expression ?? ''}]`
        : `[${d.blockKind === 'plain' ? '<script>' : `<script ${d.blockKind}>`}]`
      return `${d.file}:${d.line}:${d.column}  ${d.category} TS${d.code}  ${d.message}  ${where}`
    })
    .join('\n')
}
