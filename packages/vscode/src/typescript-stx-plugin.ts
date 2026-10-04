import type * as ts from 'typescript/lib/tsserverlibrary'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { ResolvedPosition, ScriptBlock, VirtualFile } from '../../stx/src/stx-virtual-ts'
// Imported by relative path on purpose. The plugin is bundled (see build.ts),
// so this module is inlined; declaring `@stacksjs/stx` as a dependency would
// pull the whole framework into the published extension to reuse one extractor.
import {
  buildVirtualTypeScript,
  crossScopeCollisions,
  extractScriptBlocks,
  isTemplateArtefact,
  lineStarts,
  offsetToPosition,
  positionToOffset,
  resolvePosition,
} from '../../stx/src/stx-virtual-ts'
import { stxImportDiagnostics } from '../../stx/src/stx-module-imports'
import { findStxPluginEntry } from '../../stx/src/stx-plugin-config'

/**
 * Type-check `.stx` files in the editor using the same extractor as
 * `stx typecheck` (stacksjs/stx#1852 ask 5).
 *
 * The previous implementation built its virtual file by appending every
 * `<script>` body into one buffer and dropping the markup. That was wrong three
 * ways at once:
 *
 *  1. **Every diagnostic landed on the wrong line.** Removing the HTML shifts
 *     every subsequent line up, so a squiggle pointed at unrelated code — and
 *     the further down the file, the further off it was.
 *  2. **Blocks collided.** A `<script server>` and a `<script client>` that both
 *     declare `items` are separate scopes at runtime, but sharing one buffer
 *     made that a redeclaration error.
 *  3. **Real typos were suppressed.** `getSemanticDiagnostics` dropped every
 *     TS2304 whose message mentioned one of a hardcoded list of runtime globals
 *     (`state`, `derived`, `onMount`, …), which also silently dropped
 *     `Cannot find name 'stcate'`.
 *
 * All three are now handled by construction: the buffer keeps every line at the
 * index it already occupies, the runtime globals are *declared* rather than
 * having their diagnostics filtered, and the only suppression left is for the
 * one signal that is genuinely false — a name declared on both sides of the
 * server/client boundary, computed per file rather than hardcoded.
 *
 * ## What the program gets (stacksjs/stx#2028)
 *
 * VS Code only sends a `.stx` file to tsserver because the contribution claims
 * the `stx` language. Once it does, the program has to know what the stx
 * runtime knows, or every component reports errors on code that runs:
 *
 *  - **The runtime's types.** The package's own `stx.d.ts` and
 *    `stx-module.d.ts`, and the context names as global `any`s — the files
 *    `stx typecheck` adds — are referenced from line 1 of every buffer, so `state(0)` is a typed
 *    `StxSignal<number>` rather than `any`, and `import { defineProps } from
 *    'stx'` resolves to exactly what that specifier binds at runtime. Without
 *    them the module was "Cannot find module 'stx'" and every
 *    `defineProps<Props>()` behind it "Untyped function calls may not accept
 *    type arguments".
 *  - **The app's path aliases.** A `.stx` file is in no tsconfig's `include`
 *    (they list `.ts`), so it lands in an inferred project, which knows nothing
 *    about `~/` — that was "Cannot find module" on every aliased import. The
 *    nearest tsconfig's `paths` are lent to that project, as `stx typecheck`
 *    does for its own.
 *
 * ## What it must not do
 *
 * Every tsserver feature VS Code asks for on an `stx` document reaches this
 * plugin, and tsserver answers in offsets of the VIRTUAL buffer, which the
 * client then applies to the real file. Only the features that are mapped back
 * here — diagnostics, hover, completions, definitions, highlights, signature
 * help, references and the outline — are answered. The rest (formatting, code
 * fixes, refactors, semantic tokens, folding, inlay hints, …) answer nothing
 * for a `.stx` file rather than edit or colour the wrong text.
 *
 * ## The remaining known gap
 *
 * tsserver maps one file to one snapshot, so blocks cannot be given separate
 * modules the way `stx typecheck` does. A client block can therefore still
 * *see* a server binding it could not reach at runtime. That is a missing
 * error rather than an invented one, and closing it needs a real language
 * server (what Volar is to Vue), which is a larger change than this.
 */

/**
 * Set on a language service this plugin has decorated (stacksjs/stx#2028).
 *
 * Two extensions contribute this plugin under the same name: the stx
 * extension and the Stacks extension, which builds stx support in. VS Code
 * passes every contribution to tsserver (`--globalPlugins name,name`), and
 * tsserver dedupes neither the names nor the loads, so with both installed it
 * called `create` twice on one language service. The second pass wrapped the
 * first: it read the virtual buffer back as if it were the `.stx` source and
 * the file's diagnostics never arrived. A registered symbol, so a copy of the
 * plugin from another extension's bundle recognises it too.
 */
const APPLIED = Symbol.for('@stacksjs/stx-typescript-plugin')

/** Diagnostics that report the same name being declared twice. */
const REDECLARATION_CODES = new Set([2300, 2451, 2403])

/** The `stxTypescriptPlugin.*` settings the extension forwards (configurePlugin). */
export interface StxPluginConfig {
  enabled?: boolean
}

interface StxDocument {
  version: string
  source: string
  virtual: VirtualFile
  blocks: ScriptBlock[]
  sourceStarts: number[]
  virtualStarts: number[]
  /** Names declared by both a server and a client block, in this file. */
  collisions: Set<string>
}

function isStx(fileName: string): boolean {
  return fileName.endsWith('.stx')
}

function isHandled(fileName: string): boolean {
  return isStx(fileName) || fileName.endsWith('.md')
}

/**
 * The fallback `stx-module.d.ts` build.ts writes into `dist/types/`, beside
 * the `stx.d.ts` it references (ts-plugin-declarations.ts).
 *
 * The directory is handed in rather than derived from `__dirname`: Bun inlines
 * `__dirname` at BUILD time, so the bundle would look in the source tree of
 * whoever built it. The plugin package's `index.js`, which tsserver loads from
 * the installed extension, passes its real location instead
 * (scripts/ts-plugin-package.ts).
 */
export function findStxDeclarations(dir: string | undefined): string | undefined {
  if (!dir)
    return undefined
  return existsSync(path.join(dir, 'stx-module.d.ts')) && existsSync(path.join(dir, 'stx.d.ts'))
    ? path.join(dir, 'stx-module.d.ts')
    : undefined
}

/**
 * The `stx-module.d.ts` of the `@stacksjs/stx` an app has installed, nearest
 * to `fromDir`, if that version ships one.
 *
 * Preferred over the extension's own copy because it is the runtime the app
 * actually runs: an extension newer or older than the app would otherwise
 * declare names the app's runtime does not have, or miss ones it does. It is
 * also what `stx typecheck` loads, run from that app.
 */
export function findInstalledStxDeclarations(fromDir: string, exists: (file: string) => boolean = existsSync): string | undefined {
  let dir = fromDir
  for (;;) {
    const candidate = path.join(dir, 'node_modules', '@stacksjs', 'stx', 'stx-module.d.ts')
    if (exists(candidate))
      return candidate
    const parent = path.dirname(dir)
    if (parent === dir)
      return undefined
    dir = parent
  }
}

/**
 * One declaration file that references several, for a buffer that has a
 * single line to reference them from. Written once per distinct list, under
 * the system temp directory, and named by its content so two projects with
 * the same list share it.
 */
export function declarationEntry(files: string[], dir: string = path.join(tmpdir(), 'stx-typescript-plugin')): string {
  const text = files.map(file => `/// <reference path=${JSON.stringify(file.replace(/\\/g, '/'))} />`).join('\n') + '\n'
  const entry = path.join(dir, `${createHash('sha1').update(text).digest('hex').slice(0, 16)}.d.ts`)
  if (!existsSync(entry)) {
    mkdirSync(dir, { recursive: true })
    writeFileSync(entry, text)
  }
  return entry
}

/** What the plugin package's `index.js` passes alongside tsserver's modules. */
export interface StxPluginOptions {
  /** Where the declaration files are; see {@link findStxDeclarations}. */
  declarationsDir?: string
}

function buildDocument(fileName: string, source: string, version: string, options: { declarations?: string, readComponent?: (file: string) => string | undefined, componentsDir?: string, projectRoot?: string }): StxDocument {
  const build = (declarations: string | undefined): VirtualFile => buildVirtualTypeScript(source, {
    // Markdown is not a template: its `{{ }}` are usually documentation OF stx
    // syntax, so checking them would invent errors in every doc page.
    templateExpressions: isStx(fileName),
    originDir: path.dirname(fileName),
    filePath: fileName,
    readComponent: options.readComponent,
    componentsDir: options.componentsDir,
    projectRoot: options.projectRoot,
    // The declarations come in through a reference on the buffer's first
    // line, the way an import would bring them, so only programs that hold a
    // `.stx` file ever see them.
    reference: declarations,
    // With the typed declarations in the program, `any` copies here would
    // shadow them, exactly as in `stx typecheck` (#1889).
    runtimeGlobals: !declarations,
    // The context names are global there too, so a block's own binding of one
    // (`const { query } = defineProps()`) shadows it instead of colliding.
    contextScope: 'global',
  })

  let virtual = build(options.declarations)
  // Code on line 1 leaves no room for the reference; fall back to `any`s.
  if (options.declarations && !virtual.referenced)
    virtual = build(undefined)

  const blocks = extractScriptBlocks(source)
  return {
    version,
    source,
    virtual,
    blocks,
    sourceStarts: lineStarts(source),
    virtualStarts: lineStarts(virtual.text),
    collisions: new Set(crossScopeCollisions(blocks)),
  }
}

/**
 * What an inferred project borrows from the app's tsconfig: `paths`, with
 * every target made absolute, and `types`.
 *
 * Read through TypeScript's own config parser, so `extends` chains and JSONC
 * are handled the way tsc handles them. Absolute targets and no `baseUrl`, for
 * the reason `stx typecheck` gives: a `baseUrl` would make every bare specifier
 * resolve against the app root first.
 *
 * `types` because TypeScript 6 stopped including every `@types` package by
 * default, and a server block runs on Bun: without the app's `types: ["bun"]`,
 * `process`, `require` and `bun:sqlite` in a `<script server>` were all
 * "Cannot find".
 */
function projectOptions(tsLib: typeof ts, fromDir: string): Pick<ts.CompilerOptions, 'paths' | 'types'> | undefined {
  const configPath = tsLib.findConfigFile(fromDir, tsLib.sys.fileExists)
  if (!configPath)
    return undefined
  const read = tsLib.readConfigFile(configPath, tsLib.sys.readFile)
  if (read.error)
    return undefined
  const parsed = tsLib.parseJsonConfigFileContent(read.config, tsLib.sys, path.dirname(configPath), undefined, configPath)
  const lent: Pick<ts.CompilerOptions, 'paths' | 'types'> = {}
  if (parsed.options.types)
    lent.types = parsed.options.types
  const paths = parsed.options.paths
  if (paths) {
    const base = parsed.options.baseUrl
      ?? (parsed.options as { pathsBasePath?: string }).pathsBasePath
      ?? path.dirname(configPath)
    lent.paths = {}
    for (const [pattern, targets] of Object.entries(paths))
      lent.paths[pattern] = targets.map(target => (path.isAbsolute(target) ? target : path.resolve(base, target)))
  }
  return lent
}

function init(modules: { typescript: typeof ts }, options: StxPluginOptions = {}): ts.server.PluginModule {
  const tsLib = modules.typescript
  let config: StxPluginConfig = {}
  const onConfigChange = new Set<() => void>()
  /** Projects another load of the plugin had already decorated; see {@link APPLIED}. */
  const stoodDown = new WeakSet<object>()

  return {
    create(info: ts.server.PluginCreateInfo): ts.LanguageService {
      const log = (msg: string) => {
        info.project.projectService.logger.info(`[stx-plugin] ${msg}`)
      }

      if ((info.languageService as unknown as Record<symbol, unknown>)[APPLIED]) {
        stoodDown.add(info.project)
        log('already applied to this project by another registration of the plugin; leaving it as it is')
        return info.languageService
      }

      log('TypeScript stx plugin initialized')

      const languageService = info.languageService
      const languageServiceHost = info.languageServiceHost

      /** A language-service method, bound; a no-op where this TypeScript lacks it. */
      const originalOf = <K extends keyof ts.LanguageService>(method: K): ts.LanguageService[K] => {
        const original = languageService[method] as unknown
        return (typeof original === 'function' ? original.bind(languageService) : () => undefined) as ts.LanguageService[K]
      }

      const originalGetScriptSnapshot = languageServiceHost.getScriptSnapshot?.bind(languageServiceHost)
      const originalGetScriptVersion = languageServiceHost.getScriptVersion?.bind(languageServiceHost)

      const bundled = findStxDeclarations(options.declarationsDir)
      if (!bundled)
        log('the bundled stx declarations were not found; apps without their own fall back to `any`')
      const exists = (file: string): boolean => tsLib.sys?.fileExists(file) ?? existsSync(file)
      const readConfig = (file: string): Record<string, any> | undefined => {
        const read = tsLib.readConfigFile?.(file, name => tsLib.sys.readFile(name))
        return read && !read.error ? read.config : undefined
      }
      const references = new Map<string, string | undefined>()
      /**
       * What a file's buffer references: its app's own declarations, else the
       * extension's, plus the `libs` of the stx entry in its tsconfig — the
       * list `stx typecheck` reads too (stx-plugin-config.ts).
       */
      const declarationsFor = (fileName: string): string | undefined => {
        const dir = path.dirname(fileName)
        if (!references.has(dir)) {
          const stxModule = findInstalledStxDeclarations(dir, exists) ?? bundled
          let libs: string[] = []
          try {
            libs = (findStxPluginEntry(dir, readConfig, exists)?.libs ?? []).filter(exists)
          }
          catch (error) {
            log(`could not read the stx entry of the project's tsconfig: ${String(error)}`)
          }
          references.set(dir, stxModule && libs.length > 0 ? declarationEntry([stxModule, ...libs]) : stxModule)
        }
        return references.get(dir)
      }

      const documents = new Map<string, StxDocument>()
      const readComponent = (file: string): string | undefined => {
        const snapshot = originalGetScriptSnapshot?.(file)
        return snapshot ? snapshot.getText(0, snapshot.getLength()) : tsLib.sys?.readFile(file)
      }

      const enabled = (): boolean => config.enabled !== false
      // A change of setting changes every answer, so the cache goes with it.
      onConfigChange.add(() => {
        documents.clear()
        info.project.refreshDiagnostics?.()
      })

      /** The parsed form of a `.stx` file, rebuilt when its version changes. */
      const documentFor = (fileName: string): StxDocument | undefined => {
        if (!isHandled(fileName) || !originalGetScriptSnapshot)
          return undefined

        const version = `${originalGetScriptVersion?.(fileName) || '0'}:${languageServiceHost.getProjectVersion?.() || ''}`
        const cached = documents.get(fileName)
        if (cached && cached.version === version
          && [...(cached.virtual.componentDependencies || [])].every(([file, text]) => readComponent(file) === text))
          return cached

        const snapshot = originalGetScriptSnapshot(fileName)
        if (!snapshot)
          return undefined

        try {
          const projectRoot = info.project.getCurrentDirectory?.()
          const componentsDir = projectRoot
            ? path.resolve(projectRoot, typeof info.config?.componentsDir === 'string' ? info.config.componentsDir : 'components')
            : undefined
          const document = buildDocument(fileName, snapshot.getText(0, snapshot.getLength()), version, {
            declarations: declarationsFor(fileName),
            readComponent,
            componentsDir,
            projectRoot,
          })
          documents.set(fileName, document)
          return document
        }
        catch (error) {
          // A malformed file must not take the language service down with it.
          log(`failed to build virtual document for ${fileName}: ${String(error)}`)
          return undefined
        }
      }

      /** A document this plugin answers for, or undefined to pass through. */
      const stxDocument = (fileName: string): StxDocument | undefined =>
        isStx(fileName) ? documentFor(fileName) : undefined

      /** An offset in the virtual buffer → where it belongs in the `.stx` file. */
      const resolveVirtual = (document: StxDocument, offset: number): ResolvedPosition | null => {
        const position = offsetToPosition(document.virtualStarts, offset)
        return resolvePosition(document.virtual, position.line, position.column)
      }

      /** An offset in the virtual buffer → an offset in the `.stx` file. */
      const toSource = (document: StxDocument, offset: number): number | undefined => {
        const resolved = resolveVirtual(document, offset)
        if (!resolved)
          return undefined
        return positionToOffset(document.sourceStarts, resolved.line, resolved.column)
      }

      /**
       * An offset in the `.stx` file → an offset in the virtual buffer.
       *
       * Lines are aligned, so this is exact for anything inside a script block.
       */
      const toVirtual = (document: StxDocument, offset: number): number => {
        const position = offsetToPosition(document.sourceStarts, offset)
        return positionToOffset(document.virtualStarts, position.line, position.column)
      }

      /** A virtual span → the `.stx` span it came from, if it came from one. */
      const spanToSource = (document: StxDocument, span: ts.TextSpan): ts.TextSpan | undefined => {
        const start = toSource(document, span.start)
        if (start === undefined)
          return undefined
        const end = toSource(document, span.start + span.length)
        return { start, length: end !== undefined && end >= start ? end - start : span.length }
      }

      /**
       * Whether a `.stx` offset is inside a script block body.
       *
       * Completions and signature help are offered there only. Markup maps to
       * a blank virtual line, where TypeScript would offer every global in
       * scope — `window`, `Array`, the whole DOM — as you type an attribute.
       */
      const inScript = (document: StxDocument, offset: number): boolean =>
        document.blocks.some(block => block.offset !== undefined && offset >= block.offset && offset <= block.offset + block.code.length)

      /** Map a span-bearing result whose `fileName` may be a `.stx` document. */
      const mapLocation = <T extends { fileName: string, textSpan: ts.TextSpan, contextSpan?: ts.TextSpan }>(location: T): T | undefined => {
        const document = stxDocument(location.fileName)
        if (!document)
          return location
        const textSpan = spanToSource(document, location.textSpan)
        if (!textSpan)
          return undefined
        const contextSpan = location.contextSpan ? spanToSource(document, location.contextSpan) : undefined
        return { ...location, textSpan, contextSpan }
      }
      const mapLocations = <T extends { fileName: string, textSpan: ts.TextSpan, contextSpan?: ts.TextSpan }>(locations: readonly T[] | undefined): T[] | undefined =>
        locations?.map(mapLocation).filter((l): l is T => l !== undefined)

      /**
       * Definitions are the exception to mapping back. tsserver turns their
       * spans into line and column through the language service's own source
       * file - the virtual buffer - where every other feature uses the real
       * file's text (session `toFileSpan`). A script line has the same line and
       * column in both, so its span is left as it is; one on the scaffolding
       * appended past the file has no place in it and is dropped.
       */
      const scriptLocations = <T extends { fileName: string, textSpan: ts.TextSpan }>(locations: readonly T[] | undefined): T[] | undefined =>
        locations?.filter((location) => {
          const document = stxDocument(location.fileName)
          if (!document)
            return true
          const { line } = offsetToPosition(document.virtualStarts, location.textSpan.start)
          return line <= document.virtual.sourceLineCount && !document.virtual.lineMap.has(line)
        })

      if (originalGetScriptSnapshot) {
        languageServiceHost.getScriptSnapshot = (fileName: string): ts.IScriptSnapshot | undefined => {
          const document = documentFor(fileName)
          if (document)
            return tsLib.ScriptSnapshot.fromString(document.virtual.text)
          return originalGetScriptSnapshot(fileName)
        }
      }

      // The app's `~/` and `@/` aliases and its `types`, for the inferred
      // project a `.stx` file lands in. A configured project has its own.
      const originalGetCompilationSettings = languageServiceHost.getCompilationSettings?.bind(languageServiceHost)
      const inferred = tsLib.server?.ProjectKind !== undefined && info.project.projectKind === tsLib.server.ProjectKind.Inferred
      if (originalGetCompilationSettings && inferred) {
        let lent: Pick<ts.CompilerOptions, 'paths' | 'types'> | undefined | null = null
        let merged: { from: ts.CompilerOptions, options: ts.CompilerOptions } | undefined
        languageServiceHost.getCompilationSettings = (): ts.CompilerOptions => {
          const settings = originalGetCompilationSettings()
          if (lent === null) {
            try {
              lent = projectOptions(tsLib, info.project.getCurrentDirectory())
            }
            catch (error) {
              log(`could not read the project's tsconfig: ${String(error)}`)
              lent = undefined
            }
          }
          if (!lent)
            return settings
          // The same object back for the same settings, so the language
          // service sees one set of options rather than a new one per call.
          if (merged?.from !== settings) {
            merged = {
              from: settings,
              options: {
                ...settings,
                ...(lent.paths && !settings.paths ? { paths: lent.paths } : {}),
                ...(lent.types && !settings.types ? { types: lent.types } : {}),
              },
            }
          }
          return merged.options
        }
      }

      /** Move a diagnostic onto the position the author actually wrote. */
      const remapDiagnostics = (fileName: string, diagnostics: ts.Diagnostic[]): ts.Diagnostic[] => {
        const document = documentFor(fileName)
        if (!document)
          return diagnostics
        if (isStx(fileName) && !enabled())
          return []

        const remapped: ts.Diagnostic[] = []
        for (const diagnostic of diagnostics) {
          const text = typeof diagnostic.messageText === 'string'
            ? diagnostic.messageText
            : diagnostic.messageText.messageText

          // The one suppression left, and it is computed rather than hardcoded:
          // a name declared in both a server and a client block shares a scope
          // here but not at runtime, so the redeclaration is an artefact of
          // there being a single buffer per file.
          if (REDECLARATION_CODES.has(diagnostic.code)) {
            const named = text.match(/'([^']+)'/)?.[1]
            if (named && document.collisions.has(named))
              continue
          }

          if (diagnostic.start === undefined) {
            remapped.push(diagnostic)
            continue
          }

          // Null means the diagnostic is on an ambient declaration this module
          // appended — it corresponds to nothing the author wrote.
          const at = resolveVirtual(document, diagnostic.start)
          if (!at || isTemplateArtefact(at, diagnostic.code))
            continue
          const start = positionToOffset(document.sourceStarts, at.line, at.column)

          const end = toSource(document, diagnostic.start + (diagnostic.length ?? 0))
          remapped.push({
            ...diagnostic,
            start,
            length: end !== undefined && end > start ? end - start : (diagnostic.length ?? 0),
          })
        }
        return remapped
      }

      const originalGetSemanticDiagnostics = originalOf('getSemanticDiagnostics')
      languageService.getSemanticDiagnostics = (fileName: string): ts.Diagnostic[] => {
        const diagnostics = remapDiagnostics(fileName, originalGetSemanticDiagnostics(fileName))
        const document = stxDocument(fileName)
        if (!document || !enabled())
          return diagnostics

        // One declaration of `stx` serves both block kinds, so which kind gets
        // which name is checked here, as `stx typecheck` does.
        const file = languageService.getProgram?.()?.getSourceFile(fileName)
        for (const d of stxImportDiagnostics(document.source, document.blocks)) {
          diagnostics.push({
            file,
            start: d.offset,
            length: d.length,
            messageText: d.message,
            category: tsLib.DiagnosticCategory?.Error ?? 1,
            code: 0,
            source: 'stx',
          })
        }
        return diagnostics
      }

      const originalGetSyntacticDiagnostics = originalOf('getSyntacticDiagnostics')
      languageService.getSyntacticDiagnostics = (fileName: string): ts.DiagnosticWithLocation[] =>
        remapDiagnostics(fileName, originalGetSyntacticDiagnostics(fileName)) as ts.DiagnosticWithLocation[]

      const originalGetSuggestionDiagnostics = originalOf('getSuggestionDiagnostics')
      languageService.getSuggestionDiagnostics = (fileName: string): ts.DiagnosticWithLocation[] =>
        remapDiagnostics(fileName, originalGetSuggestionDiagnostics(fileName)) as ts.DiagnosticWithLocation[]

      // Hover. The incoming position is in the .stx file and has to be moved
      // into the buffer; the outgoing span has to be moved back.
      const originalGetQuickInfo = originalOf('getQuickInfoAtPosition')
      languageService.getQuickInfoAtPosition = (fileName: string, position: number, ...rest: any[]): ts.QuickInfo | undefined => {
        const document = stxDocument(fileName)
        if (!document)
          return (originalGetQuickInfo as any)(fileName, position, ...rest)
        if (!enabled())
          return undefined

        const quickInfo = (originalGetQuickInfo as any)(fileName, toVirtual(document, position), ...rest) as ts.QuickInfo | undefined
        if (!quickInfo)
          return quickInfo

        const textSpan = spanToSource(document, quickInfo.textSpan)
        return textSpan ? { ...quickInfo, textSpan } : undefined
      }

      const originalGetCompletions = originalOf('getCompletionsAtPosition')
      languageService.getCompletionsAtPosition = (
        fileName: string,
        position: number,
        options: ts.GetCompletionsAtPositionOptions | undefined,
        ...rest: any[]
      ): ts.CompletionInfo | undefined => {
        const document = stxDocument(fileName)
        if (!document)
          return (originalGetCompletions as any)(fileName, position, options, ...rest)
        if (!enabled() || !inScript(document, position))
          return undefined

        // No auto-import entries: accepting one inserts an `import` at an
        // offset of the virtual buffer, which is not where it belongs in the
        // `.stx` file.
        const completions = (originalGetCompletions as any)(
          fileName,
          toVirtual(document, position),
          { ...options, includeCompletionsForModuleExports: false },
          ...rest,
        ) as ts.CompletionInfo | undefined
        if (!completions)
          return completions

        const mapSpan = (span: ts.TextSpan | undefined): ts.TextSpan | undefined => span && spanToSource(document, span)
        return {
          ...completions,
          optionalReplacementSpan: mapSpan(completions.optionalReplacementSpan),
          // Hide this module's own scaffolding (`__StxElement`,
          // `__stx_interpolated`) without hiding the user's symbols.
          entries: completions.entries
            .filter(entry => !entry.name.startsWith('__stx') && !entry.name.startsWith('__Stx'))
            .map(entry => (entry.replacementSpan ? { ...entry, replacementSpan: mapSpan(entry.replacementSpan) } : entry)),
        }
      }

      const originalGetCompletionDetails = originalOf('getCompletionEntryDetails')
      languageService.getCompletionEntryDetails = (fileName: string, position: number, ...rest: any[]): ts.CompletionEntryDetails | undefined => {
        const document = stxDocument(fileName)
        if (!document)
          return (originalGetCompletionDetails as any)(fileName, position, ...rest)
        const details = (originalGetCompletionDetails as any)(fileName, toVirtual(document, position), ...rest) as ts.CompletionEntryDetails | undefined
        // Code actions carry edits in virtual offsets; drop them.
        return details ? { ...details, codeActions: undefined } : details
      }

      const originalGetSignatureHelp = originalOf('getSignatureHelpItems')
      languageService.getSignatureHelpItems = (fileName: string, position: number, ...rest: any[]): ts.SignatureHelpItems | undefined => {
        const document = stxDocument(fileName)
        if (!document)
          return (originalGetSignatureHelp as any)(fileName, position, ...rest)
        if (!enabled() || !inScript(document, position))
          return undefined
        const help = (originalGetSignatureHelp as any)(fileName, toVirtual(document, position), ...rest) as ts.SignatureHelpItems | undefined
        const applicableSpan = help && spanToSource(document, help.applicableSpan)
        return help && applicableSpan ? { ...help, applicableSpan } : undefined
      }

      // Definitions, references and highlights: the position goes in, and
      // every location in a `.stx` file comes back out (definitions: see
      // scriptLocations). Locations on the scaffolding this module appends
      // map to nothing and are dropped.
      const originalGetDefinitionAndBoundSpan = originalOf('getDefinitionAndBoundSpan')
      languageService.getDefinitionAndBoundSpan = (fileName: string, position: number): ts.DefinitionInfoAndBoundSpan | undefined => {
        const document = stxDocument(fileName)
        if (!document)
          return mapDefinitionResult(originalGetDefinitionAndBoundSpan(fileName, position))
        if (!enabled())
          return undefined
        const result = originalGetDefinitionAndBoundSpan(fileName, toVirtual(document, position))
        const textSpan = result && spanToSource(document, result.textSpan)
        return result && textSpan ? { ...mapDefinitionResult(result)!, textSpan } : undefined
      }
      const mapDefinitionResult = (result: ts.DefinitionInfoAndBoundSpan | undefined): ts.DefinitionInfoAndBoundSpan | undefined =>
        result && { ...result, definitions: scriptLocations(result.definitions) }

      for (const method of ['getDefinitionAtPosition', 'getTypeDefinitionAtPosition', 'getImplementationAtPosition'] as const) {
        const original = originalOf(method) as (...args: any[]) => any
        ;(languageService as any)[method] = (fileName: string, position: number, ...rest: any[]) => {
          const document = stxDocument(fileName)
          if (document && !enabled())
            return undefined
          return scriptLocations(original(fileName, document ? toVirtual(document, position) : position, ...rest))
        }
      }

      for (const method of ['getReferencesAtPosition'] as const) {
        const original = originalOf(method) as (...args: any[]) => any
        ;(languageService as any)[method] = (fileName: string, position: number, ...rest: any[]) => {
          const document = stxDocument(fileName)
          if (document && !enabled())
            return undefined
          return mapLocations(original(fileName, document ? toVirtual(document, position) : position, ...rest))
        }
      }

      const originalFindReferences = originalOf('findReferences')
      languageService.findReferences = (fileName: string, position: number): ts.ReferencedSymbol[] | undefined => {
        const document = stxDocument(fileName)
        if (document && !enabled())
          return undefined
        return originalFindReferences(fileName, document ? toVirtual(document, position) : position)
          ?.map((symbol) => {
            const definition = mapLocation(symbol.definition)
            return definition ? { definition, references: mapLocations(symbol.references)! } : undefined
          })
          .filter((s): s is ts.ReferencedSymbol => s !== undefined)
      }

      const originalGetDocumentHighlights = originalOf('getDocumentHighlights')
      languageService.getDocumentHighlights = (fileName: string, position: number, filesToSearch: string[]): ts.DocumentHighlights[] | undefined => {
        const document = stxDocument(fileName)
        if (document && (!enabled() || !inScript(document, position)))
          return undefined
        return originalGetDocumentHighlights(fileName, document ? toVirtual(document, position) : position, filesToSearch)
          ?.map((highlights) => {
            const target = stxDocument(highlights.fileName)
            if (!target)
              return highlights
            return {
              ...highlights,
              highlightSpans: highlights.highlightSpans
                .map((span) => {
                  const textSpan = spanToSource(target, span.textSpan)
                  return textSpan ? { ...span, textSpan, contextSpan: span.contextSpan && spanToSource(target, span.contextSpan) } : undefined
                })
                .filter((s): s is ts.HighlightSpan => s !== undefined),
            }
          })
      }

      // The outline: the tree's spans are virtual offsets, so they are mapped,
      // and a node that maps nowhere (the appended scaffolding) is left out.
      const originalGetNavigationTree = originalOf('getNavigationTree')
      languageService.getNavigationTree = (fileName: string): ts.NavigationTree => {
        const tree = originalGetNavigationTree(fileName)
        const document = stxDocument(fileName)
        if (!document)
          return tree
        const mapNode = (node: ts.NavigationTree): ts.NavigationTree | undefined => {
          const spans = node.spans.map(span => spanToSource(document, span)).filter((s): s is ts.TextSpan => s !== undefined)
          if (spans.length === 0)
            return undefined
          const nameSpan = node.nameSpan && spanToSource(document, node.nameSpan)
          const childItems = node.childItems?.map(mapNode).filter((c): c is ts.NavigationTree => c !== undefined)
          return { ...node, spans, nameSpan, childItems }
        }
        const root = { ...tree, spans: [{ start: 0, length: document.source.length }] }
        return enabled()
          ? { ...root, childItems: tree.childItems?.map(mapNode).filter((c): c is ts.NavigationTree => c !== undefined) }
          : { ...root, childItems: [] }
      }

      /*
       * Everything else answers nothing for a `.stx` file.
       *
       * Each of these returns offsets or edits against the virtual buffer that
       * would be applied to the real file unmapped: a format pass would rewrite
       * the markup, a quick fix would insert an import before `<script>`, and
       * semantic tokens would colour the wrong characters — and, being a
       * non-null answer, would also hide the stx extension's own tokens.
       */
      const nothing: Partial<Record<keyof ts.LanguageService, () => unknown>> = {
        getEncodedSemanticClassifications: () => undefined,
        getEncodedSyntacticClassifications: () => undefined,
        getSemanticClassifications: () => [],
        getSyntacticClassifications: () => [],
        getFormattingEditsForDocument: () => [],
        getFormattingEditsForRange: () => [],
        getFormattingEditsAfterKeystroke: () => [],
        getNavigationBarItems: () => [],
        getOutliningSpans: () => [],
        getBraceMatchingAtPosition: () => [],
        getTodoComments: () => [],
        getDocCommentTemplateAtPosition: () => undefined,
        getJsxClosingTagAtPosition: () => undefined,
        getLinkedEditingRangeAtPosition: () => undefined,
        getSpanOfEnclosingComment: () => undefined,
        getCodeFixesAtPosition: () => [],
        getApplicableRefactors: () => [],
        getEditsForRefactor: () => undefined,
        getRenameInfo: () => ({ canRename: false, localizedErrorMessage: 'Rename is not supported in .stx files.' }),
        findRenameLocations: () => undefined,
        provideInlayHints: () => [],
        prepareCallHierarchy: () => undefined,
        provideCallHierarchyIncomingCalls: () => [],
        provideCallHierarchyOutgoingCalls: () => [],
        getFileReferences: () => [],
      }
      for (const [method, answer] of Object.entries(nothing)) {
        const original = (languageService as any)[method]
        if (typeof original !== 'function')
          continue
        const bound = original.bind(languageService)
        ;(languageService as any)[method] = (fileName: unknown, ...rest: unknown[]) =>
          typeof fileName === 'string' && isStx(fileName) ? answer() : bound(fileName, ...rest)
      }

      ;(languageService as unknown as Record<symbol, unknown>)[APPLIED] = true
      log('Language service proxy created')
      return languageService
    },

    getExternalFiles(project: ts.server.Project): string[] {
      // The registration that decorated the project already names them.
      if (stoodDown.has(project))
        return []
      return project.getFileNames().filter(isHandled)
    },

    onConfigurationChanged(next: StxPluginConfig): void {
      config = { ...config, ...next }
      for (const listener of onConfigChange)
        listener()
    },
  }
}

export default init
