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
import { existsSync } from 'node:fs'
import path from 'node:path'
import { STX_RUNTIME_GLOBALS } from './runtime-globals'
import { stateDir } from './state-dir'
import {
  buildVirtualTypeScript,
  extractScriptBlocks,
  resolvePosition,
  clientPayloadDeclarations,
  scrapedBridgeNames,
  serverContextDeclarations,
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
  /** Check `<script client>` blocks. Default true. */
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
 */
export function buildVirtualSource(block: ScriptBlock, serverCode = ''): string {
  const leadingNewlines = block.startLine > 1 ? '\n'.repeat(block.startLine - 1) : ''

  // A block may take a server value through an interpolation. As TypeScript
  // that is a syntax error, and a parse failure suppresses every real
  // diagnostic in the same file — so the checker was blind wherever this is
  // used, which is 48 of the framework's own 95 components.
  const code = substituteInterpolationsInPlace(block.code)

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
    ? clientPayloadDeclarations(serverCode)
    : ''

  return `${leadingNewlines + code}\n${payload}\nexport {}\n`
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
  const scrapedByFile = new Map<string, { names: string[], line: number }>()
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
      if (b.kind === 'client')
        return checkClient
      return false // `plain` blocks are not part of the authored TS surface
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
      const clientBlocks = blocks.filter(block => block.kind === 'client')
      const names = [...new Set(clientBlocks.flatMap(block => scrapedBridgeNames(serverCode, block.code)))]
      if (names.length > 0)
        scrapedByFile.set(file, { names, line: clientBlocks[0].startLine })
    }

    // The template buffer inlines the script bodies, so an expression sees the
    // real types the blocks declare — which is what catches `{{ row.total_vists }}`
    // against a typed row rather than merely an undeclared name.
    const templateBuffer = checkTemplates
      ? buildVirtualTypeScript(source, { runtimeGlobals: !runtimeTypes })
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
        source: buildVirtualSource(block, serverCode),
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

  const ambient: string[] = [...(options.extraLibs ?? [])]

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
  ].join('\n')

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

  const tsconfig = {
    compilerOptions: {
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
      ...(options.compilerOptions ?? {}),
    },
    files: [...writtenToOrigin.keys()].map(name => `${workDir}/${name}`).concat(globalsDts, ...ambient),
  }
  const tsconfigPath = `${workDir}/tsconfig.json`
  await Bun.write(tsconfigPath, JSON.stringify(tsconfig, null, 2))

  const proc = Bun.spawnSync(["bun", "x", "tsc", "-p", tsconfigPath, "--pretty", "false"], {
    stdout: "pipe",
    stderr: "pipe",
  })
  const output = new TextDecoder().decode(proc.stdout) + new TextDecoder().decode(proc.stderr)

  const diagnostics: TypecheckDiagnostic[] = []
  for (const rawLine of output.split("\n")) {
    const m = rawLine.match(TSC_LINE_RE)
    if (!m)
      continue
    const [, filePart, lineStr, colStr, category, code, message] = m
    const entry = writtenToOrigin.get(filePart.split('/').pop()!)
    if (!entry)
      continue

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
        blockKind: 'client',
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
  return { diagnostics: unique, checkedFiles, blockCount, expressionCount }
}

/** Render diagnostics the way a CLI should: file:line:col, then the message. */
export function formatTypecheckDiagnostics(diagnostics: TypecheckDiagnostic[]): string {
  return diagnostics
    .map((d) => {
      const where = d.blockKind === 'template'
        ? `[template: ${d.expression ?? ''}]`
        : `[<script ${d.blockKind}>]`
      return `${d.file}:${d.line}:${d.column}  ${d.category} TS${d.code}  ${d.message}  ${where}`
    })
    .join('\n')
}
