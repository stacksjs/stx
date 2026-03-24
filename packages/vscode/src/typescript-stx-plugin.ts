import type * as ts from 'typescript/lib/tsserverlibrary'

/**
 * Extract TypeScript code from stx template content.
 *
 * Handles three sources of TS code in .stx files:
 * 1. <script> / <script lang="ts"> tags (primary TS source)
 * 2. @ts ... @endts blocks (inline TypeScript declarations)
 * 3. {{ expression }} template expressions (wrapped as const declarations)
 *
 * Server-side scripts (<script server>) are included since they still contain
 * valid TypeScript that benefits from type checking.
 */
function extractTypeScriptFromStx(content: string): string {
  let tsContent = ''

  // 1. Extract <script> tag content (handles lang="ts", server, client attributes)
  // Skip <script> tags with an external src attribute (CDN scripts etc.)
  const scriptTagRegex = /<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi
  let scriptMatch
  while ((scriptMatch = scriptTagRegex.exec(content)) !== null) {
    const scriptBody = scriptMatch[1]
    if (scriptBody.trim()) {
      tsContent += `${scriptBody}\n`
    }
  }

  // 2. Extract @ts blocks
  const tsBlockRegex = /@ts\b([\s\S]*?)@endts/g
  let match
  while ((match = tsBlockRegex.exec(content)) !== null) {
    tsContent += `${match[1]}\n`
  }

  // 3. Extract {{ }} expressions as type-checked variable declarations
  const exprRegex = /\{\{([\s\S]*?)\}\}/g
  let exprCounter = 0
  while ((match = exprRegex.exec(content)) !== null) {
    const expr = match[1].trim()
    // Skip filter expressions (contain |) and empty expressions
    if (expr && !expr.includes('|')) {
      tsContent += `const __stx_expr${exprCounter} = ${expr};\n`
      exprCounter++
    }
  }

  return tsContent || '// No TypeScript content found in .stx file'
}

/**
 * Create a ScriptSnapshot from stx content
 */
function createStxSnapshot(
  tsLib: typeof import('typescript/lib/tsserverlibrary'),
  content: string,
): ts.IScriptSnapshot {
  const tsContent = extractTypeScriptFromStx(content)
  return tsLib.ScriptSnapshot.fromString(tsContent)
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

      // Track stx file versions for cache invalidation
      const stxVersions = new Map<string, string>()

      // Override getScriptSnapshot to transform stx/md files into TypeScript
      if (originalGetScriptSnapshot) {
        languageServiceHost.getScriptSnapshot = (fileName: string): ts.IScriptSnapshot | undefined => {
          if (fileName.endsWith('.stx') || fileName.endsWith('.md')) {
            const snapshot = originalGetScriptSnapshot(fileName)
            if (snapshot) {
              const content = snapshot.getText(0, snapshot.getLength())
              const version = originalGetScriptVersion?.(fileName) || '0'
              stxVersions.set(fileName, version)
              return createStxSnapshot(tsLib, content)
            }
          }
          return originalGetScriptSnapshot(fileName)
        }
      }

      // Proxy hover to enhance variable type display in stx files
      const originalGetQuickInfo = languageService.getQuickInfoAtPosition.bind(languageService)
      languageService.getQuickInfoAtPosition = (fileName: string, position: number): ts.QuickInfo | undefined => {
        const quickInfo = originalGetQuickInfo(fileName, position)

        if (quickInfo && (fileName.endsWith('.stx') || fileName.endsWith('.md'))) {
          if (quickInfo.displayParts) {
            const displayText = quickInfo.displayParts.map(part => part.text).join('')

            // Replace generic "var"/"const" with more specific type information
            if (displayText.includes('var ') || displayText.includes('const ')) {
              const typeInfo = quickInfo.displayParts.find(part =>
                part.kind === 'typeParameterName'
                || part.kind === 'className'
                || part.kind === 'interfaceName',
              )

              if (typeInfo && quickInfo.documentation) {
                quickInfo.documentation = [
                  { text: `Type: ${typeInfo.text}\n\n`, kind: 'text' },
                  ...quickInfo.documentation,
                ]
              }
            }
          }
        }

        return quickInfo
      }

      // Proxy completions to filter irrelevant suggestions in stx context
      const originalGetCompletions = languageService.getCompletionsAtPosition.bind(languageService)
      languageService.getCompletionsAtPosition = (
        fileName: string,
        position: number,
        options: ts.GetCompletionsAtPositionOptions | undefined,
      ): ts.CompletionInfo | undefined => {
        const completions = originalGetCompletions(fileName, position, options)

        if (completions && (fileName.endsWith('.stx') || fileName.endsWith('.md'))) {
          completions.entries = completions.entries.filter((entry) => {
            // Keep user-defined symbols and common types
            if (entry.kind === tsLib.ScriptElementKind.variableElement
              || entry.kind === tsLib.ScriptElementKind.functionElement
              || entry.kind === tsLib.ScriptElementKind.constElement
              || entry.kind === tsLib.ScriptElementKind.letElement
              || entry.kind === tsLib.ScriptElementKind.classElement
              || entry.kind === tsLib.ScriptElementKind.interfaceElement
              || entry.kind === tsLib.ScriptElementKind.typeElement
              || entry.kind === tsLib.ScriptElementKind.enumElement) {
              return true
            }
            // Filter out internal/dunder symbols
            return !entry.name.startsWith('__')
          })
        }

        return completions
      }

      // Proxy diagnostics to filter out false positives in stx files
      const originalGetSemanticDiagnostics = languageService.getSemanticDiagnostics.bind(languageService)
      languageService.getSemanticDiagnostics = (fileName: string): ts.Diagnostic[] => {
        const diagnostics = originalGetSemanticDiagnostics(fileName)

        if (fileName.endsWith('.stx') || fileName.endsWith('.md')) {
          return diagnostics.filter((diag) => {
            // Filter out "cannot find name" for common stx globals and template variables
            if (diag.code === 2304) { // Cannot find name
              const msgText = typeof diag.messageText === 'string'
                ? diag.messageText
                : diag.messageText.messageText
              // Skip errors for common stx runtime symbols
              const stxGlobals = ['props', '$props', 'defineProps', 'withDefaults', 'state', 'derived', 'effect', 'batch', 'onMount', 'onDestroy', '$loop', 'loop']
              if (stxGlobals.some(g => msgText.includes(`'${g}'`))) {
                return false
              }
            }
            return true
          })
        }

        return diagnostics
      }

      log('Language service proxy created')
      return languageService
    },

    getExternalFiles(project: ts.server.Project): string[] {
      return project.getFileNames().filter(file =>
        file.endsWith('.stx')
        || file.endsWith('.md'),
      )
    },
  }
}

export default init
