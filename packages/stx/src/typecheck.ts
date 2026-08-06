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

import { STX_RUNTIME_GLOBALS } from './runtime-globals'
import { stateDir } from './state-dir'

export type ScriptKind = 'server' | 'client' | 'plain'

export interface ScriptBlock {
  kind: ScriptKind
  /** Block body, without the surrounding tags. */
  code: string
  /** 1-based line in the source file where the body's first line sits. */
  startLine: number
}

export interface TypecheckDiagnostic {
  file: string
  line: number
  column: number
  code: number
  message: string
  category: 'error' | 'warning' | 'suggestion' | 'message'
  blockKind: ScriptKind
}

export interface TypecheckOptions {
  /** Extra ambient declaration files to include (e.g. an app's own types). */
  extraLibs?: string[]
  /** Check `<script client>` blocks. Default true. */
  client?: boolean
  /** Check `<script server>` blocks. Default true. */
  server?: boolean
  /** Compiler options to merge over the defaults. */
  compilerOptions?: Record<string, unknown>
}

export interface TypecheckResult {
  diagnostics: TypecheckDiagnostic[]
  /** Files that contained at least one checkable block. */
  checkedFiles: string[]
  /** Number of script blocks checked. */
  blockCount: number
}

const SCRIPT_RE = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi

/**
 * Pull the script blocks out of a `.stx` source, with the line each body starts on.
 *
 * `<script server>` and `<script client>` are recognised by attribute. A bare
 * `<script>` is reported as `plain`: it ships to the browser verbatim without the
 * auto-import preamble, so it is a different checking context and callers may
 * want to skip it.
 */
export function extractScriptBlocks(source: string): ScriptBlock[] {
  const blocks: ScriptBlock[] = []
  SCRIPT_RE.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = SCRIPT_RE.exec(source)) !== null) {
    const attrs = (match[1] || '').trim()
    const body = match[2] ?? ''

    // `src` scripts have no inline body to check.
    if (/\bsrc\s*=/.test(attrs))
      continue
    // Skip non-TS/JS types (JSON-LD, importmap, text/template, …).
    const typeMatch = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)
    if (typeMatch && !/^(?:module|text\/(?:javascript|typescript))$/i.test(typeMatch[1]))
      continue

    const kind: ScriptKind = /\bserver\b/.test(attrs)
      ? 'server'
      : /\bclient\b/.test(attrs)
        ? 'client'
        : 'plain'

    // Line the body starts on. The body begins right after the opening tag, so
    // count newlines up to that point; +1 converts to a 1-based line number.
    const bodyStart = match.index + match[0].indexOf('>', 0) + 1
    const openTagEnd = match.index + (match[0].match(/^<script[^>]*>/i)?.[0].length ?? 0)
    const upTo = source.slice(0, Math.max(bodyStart, openTagEnd))
    const startLine = upTo.split('\n').length

    blocks.push({ kind, code: body, startLine })
  }

  return blocks
}

/**
 * Build the virtual TypeScript source for one block.
 *
 * The body is prefixed with blank lines so its first line lands on the same line
 * number it occupies in the `.stx` file — which makes every diagnostic's line
 * number directly usable with no mapping table.
 */
export function buildVirtualSource(block: ScriptBlock): string {
  const leadingNewlines = block.startLine > 1 ? '\n'.repeat(block.startLine - 1) : ''
  return leadingNewlines + block.code
}

/** Virtual path for a block, stable and traceable back to its origin. */
export function virtualPathFor(filePath: string, kind: ScriptKind, index: number): string {
  return `${filePath}.__stx_${kind}${index}.ts`
}

/** Map a virtual path back to the `.stx` file it came from. */
export function sourcePathFor(virtualPath: string): string {
  return virtualPath.replace(/\.__stx_(?:server|client|plain)\d+\.ts$/, '')
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

  const virtualFiles = new Map<string, { source: string, origin: string, kind: ScriptKind }>()
  const checkedFiles: string[] = []

  for (const file of files) {
    const source = await Bun.file(file).text()
    const blocks = extractScriptBlocks(source).filter((b) => {
      if (b.kind === 'server')
        return checkServer
      if (b.kind === 'client')
        return checkClient
      return false // `plain` blocks are not part of the authored TS surface
    })
    if (blocks.length === 0)
      continue

    checkedFiles.push(file)
    blocks.forEach((block, i) => {
      virtualFiles.set(virtualPathFor(file, block.kind, i), {
        source: buildVirtualSource(block),
        origin: file,
        kind: block.kind,
      })
    })
  }

  if (virtualFiles.size === 0)
    return { diagnostics: [], checkedFiles, blockCount: 0 }

  // stx.d.ts carries the runtime globals with real types, so `state()` and
  // friends resolve properly instead of needing a wall of suppressions. This is
  // the difference from the editor plugin, which instead SUPPRESSES every
  // "Cannot find name" mentioning a known global, and so also hides real typos.
  const ambient: string[] = [...(options.extraLibs ?? [])]

  // Runtime globals are declared here rather than by pulling in the package's
  // own stx.d.ts.
  //
  // stx.d.ts types them richly, but including it drags in the package's built
  // declarations, and `dist/composables.d.ts` is currently syntactically invalid
  // — `navigate: (path: string)) => unknown;`. tsc aborts on a SYNTAX error in a
  // lib file (skipLibCheck only suppresses semantic ones), so the checker
  // reported nothing at all about the user's code. Generating the surface from
  // STX_RUNTIME_GLOBALS keeps this tool working regardless of the state of the
  // build output; an app that wants precise global types can pass its own
  // declaration file through `extraLibs`.
  const globalsDts = `${stateDir()}/typecheck/__stx_globals.d.ts`
  const globalDecls = [
    '// Generated. The stx runtime injects these into every script block.',
    'declare const window: any',
    ...STX_RUNTIME_GLOBALS.map(name => `declare const ${name}: any`),
  ].join('\n')

  const workDir = `${stateDir()}/typecheck`
  await Bun.$`rm -rf ${workDir}`.quiet().nothrow()
  await Bun.$`mkdir -p ${workDir}`.quiet().nothrow()

  await Bun.write(globalsDts, globalDecls)

  // Written flat with a path-safe name; the map carries the way back.
  const writtenToOrigin = new Map<string, { origin: string, kind: ScriptKind }>()
  for (const [virtualPath, meta] of virtualFiles) {
    const safe = virtualPath.replace(/[^\w.-]+/g, "_")
    const onDisk = `${workDir}/${safe}`
    await Bun.write(onDisk, meta.source)
    writtenToOrigin.set(onDisk, { origin: meta.origin, kind: meta.kind })
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
    files: [...writtenToOrigin.keys(), globalsDts, ...ambient],
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
    const resolved = [...writtenToOrigin.entries()].find(([onDisk]) => filePart.endsWith(onDisk.split("/").pop()!))
    if (!resolved)
      continue
    diagnostics.push({
      file: resolved[1].origin,
      // Already the .stx line number: the virtual source was padded so the
      // block starts on the line it occupies in the original file.
      line: Number(lineStr),
      column: Number(colStr),
      code: Number(code),
      message,
      category: category === "error" ? "error" : "warning",
      blockKind: resolved[1].kind,
    })
  }

  diagnostics.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column)
  return { diagnostics, checkedFiles, blockCount: virtualFiles.size }
}

/** Render diagnostics the way a CLI should: file:line:col, then the message. */
export function formatTypecheckDiagnostics(diagnostics: TypecheckDiagnostic[]): string {
  return diagnostics
    .map(d => `${d.file}:${d.line}:${d.column}  ${d.category} TS${d.code}  ${d.message}  [<script ${d.blockKind}>]`)
    .join('\n')
}
