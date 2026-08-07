import type * as ts from 'typescript/lib/tsserverlibrary'
import type { VirtualFile } from '../../stx/src/stx-virtual-ts'
// Imported by relative path on purpose. The plugin is bundled (see build.ts),
// so this module is inlined; declaring `@stacksjs/stx` as a dependency would
// pull the whole framework into the published extension to reuse one extractor.
import {
  buildVirtualTypeScript,
  crossScopeCollisions,
  extractScriptBlocks,
  lineStarts,
  offsetToPosition,
  positionToOffset,
  resolvePosition,
} from '../../stx/src/stx-virtual-ts'

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
 * ## The remaining known gap
 *
 * tsserver maps one file to one snapshot, so blocks cannot be given separate
 * modules the way `stx typecheck` does. A client block can therefore still
 * *see* a server binding it could not reach at runtime. That is a missing
 * error rather than an invented one, and closing it needs a real language
 * server (what Volar is to Vue), which is a larger change than this.
 */

/** Diagnostics that report the same name being declared twice. */
const REDECLARATION_CODES = new Set([2300, 2451, 2403])

interface StxDocument {
  version: string
  source: string
  virtual: VirtualFile
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

function buildDocument(fileName: string, source: string, version: string): StxDocument {
  // Markdown is not a template: its `{{ }}` are usually documentation OF stx
  // syntax, so checking them would invent errors in every doc page.
  const virtual = buildVirtualTypeScript(source, { templateExpressions: isStx(fileName) })
  return {
    version,
    source,
    virtual,
    sourceStarts: lineStarts(source),
    virtualStarts: lineStarts(virtual.text),
    collisions: new Set(crossScopeCollisions(extractScriptBlocks(source))),
  }
}

function init(modules: { typescript: typeof ts }): ts.server.PluginModule {
  const tsLib = modules.typescript

  return {
    create(info: ts.server.PluginCreateInfo): ts.LanguageService {
      const log = (msg: string) => {
        info.project.projectService.logger.info(`[stx-plugin] ${msg}`)
      }

      log('TypeScript stx plugin initialized')

      const languageService = info.languageService
      const languageServiceHost = info.languageServiceHost

      const originalGetScriptSnapshot = languageServiceHost.getScriptSnapshot?.bind(languageServiceHost)
      const originalGetScriptVersion = languageServiceHost.getScriptVersion?.bind(languageServiceHost)

      const documents = new Map<string, StxDocument>()

      /** The parsed form of a `.stx` file, rebuilt when its version changes. */
      const documentFor = (fileName: string): StxDocument | undefined => {
        if (!isHandled(fileName) || !originalGetScriptSnapshot)
          return undefined

        const version = originalGetScriptVersion?.(fileName) || '0'
        const cached = documents.get(fileName)
        if (cached && cached.version === version)
          return cached

        const snapshot = originalGetScriptSnapshot(fileName)
        if (!snapshot)
          return undefined

        try {
          const document = buildDocument(fileName, snapshot.getText(0, snapshot.getLength()), version)
          documents.set(fileName, document)
          return document
        }
        catch (error) {
          // A malformed file must not take the language service down with it.
          log(`failed to build virtual document for ${fileName}: ${String(error)}`)
          return undefined
        }
      }

      /** An offset in the virtual buffer → an offset in the `.stx` file. */
      const toSource = (document: StxDocument, offset: number): number | undefined => {
        const position = offsetToPosition(document.virtualStarts, offset)
        const resolved = resolvePosition(document.virtual, position.line, position.column)
        if (!resolved)
          return undefined
        return positionToOffset(document.sourceStarts, resolved.line, resolved.column)
      }

      /**
       * An offset in the `.stx` file → an offset in the virtual buffer.
       *
       * Lines are aligned, so this is exact for anything inside a script block.
       * A position in the markup lands on a blank virtual line, which yields no
       * completions rather than wrong ones.
       */
      const toVirtual = (document: StxDocument, offset: number): number => {
        const position = offsetToPosition(document.sourceStarts, offset)
        return positionToOffset(document.virtualStarts, position.line, position.column)
      }

      if (originalGetScriptSnapshot) {
        languageServiceHost.getScriptSnapshot = (fileName: string): ts.IScriptSnapshot | undefined => {
          const document = documentFor(fileName)
          if (document)
            return tsLib.ScriptSnapshot.fromString(document.virtual.text)
          return originalGetScriptSnapshot(fileName)
        }
      }

      /** Move a diagnostic onto the position the author actually wrote. */
      const remapDiagnostics = (fileName: string, diagnostics: ts.Diagnostic[]): ts.Diagnostic[] => {
        const document = documentFor(fileName)
        if (!document)
          return diagnostics

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

          const start = toSource(document, diagnostic.start)
          // Undefined means the diagnostic is on an ambient declaration this
          // module appended — it corresponds to nothing the author wrote.
          if (start === undefined)
            continue

          const end = toSource(document, diagnostic.start + (diagnostic.length ?? 0))
          remapped.push({
            ...diagnostic,
            start,
            length: end !== undefined && end > start ? end - start : (diagnostic.length ?? 0),
          })
        }
        return remapped
      }

      const originalGetSemanticDiagnostics = languageService.getSemanticDiagnostics.bind(languageService)
      languageService.getSemanticDiagnostics = (fileName: string): ts.Diagnostic[] =>
        remapDiagnostics(fileName, originalGetSemanticDiagnostics(fileName))

      const originalGetSyntacticDiagnostics = languageService.getSyntacticDiagnostics.bind(languageService)
      languageService.getSyntacticDiagnostics = (fileName: string): ts.DiagnosticWithLocation[] =>
        remapDiagnostics(fileName, originalGetSyntacticDiagnostics(fileName)) as ts.DiagnosticWithLocation[]

      const originalGetSuggestionDiagnostics = languageService.getSuggestionDiagnostics.bind(languageService)
      languageService.getSuggestionDiagnostics = (fileName: string): ts.DiagnosticWithLocation[] =>
        remapDiagnostics(fileName, originalGetSuggestionDiagnostics(fileName)) as ts.DiagnosticWithLocation[]

      // Hover. The incoming position is in the .stx file and has to be moved
      // into the buffer; the outgoing span has to be moved back.
      const originalGetQuickInfo = languageService.getQuickInfoAtPosition.bind(languageService)
      languageService.getQuickInfoAtPosition = (fileName: string, position: number): ts.QuickInfo | undefined => {
        const document = documentFor(fileName)
        if (!document)
          return originalGetQuickInfo(fileName, position)

        const quickInfo = originalGetQuickInfo(fileName, toVirtual(document, position))
        if (!quickInfo)
          return quickInfo

        const start = toSource(document, quickInfo.textSpan.start)
        if (start === undefined)
          return quickInfo
        return { ...quickInfo, textSpan: { ...quickInfo.textSpan, start } }
      }

      const originalGetCompletions = languageService.getCompletionsAtPosition.bind(languageService)
      languageService.getCompletionsAtPosition = (
        fileName: string,
        position: number,
        options: ts.GetCompletionsAtPositionOptions | undefined,
      ): ts.CompletionInfo | undefined => {
        const document = documentFor(fileName)
        const completions = originalGetCompletions(
          fileName,
          document ? toVirtual(document, position) : position,
          options,
        )

        if (completions && document) {
          // Hide this module's own scaffolding (`__StxElement`,
          // `__stx_interpolated`) without hiding the user's symbols.
          completions.entries = completions.entries.filter(entry => !entry.name.startsWith('__stx') && !entry.name.startsWith('__Stx'))
        }

        return completions
      }

      log('Language service proxy created')
      return languageService
    },

    getExternalFiles(project: ts.server.Project): string[] {
      return project.getFileNames().filter(isHandled)
    },
  }
}

export default init
