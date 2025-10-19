import type * as ts from 'typescript/lib/tsserverlibrary'

/**
 * Extract TypeScript code from stx template
 */
function extractTypeScriptFromStx(content: string): string {
  let tsContent = ''

  // Extract @ts blocks
  const tsBlockRegex = /@ts\s+([\s\S]*?)@endts/g
  let match
  match = tsBlockRegex.exec(content)
  while (match !== null) {
    tsContent += `${match[1]}\n`
    match = tsBlockRegex.exec(content)
  }

  // Extract {{ }} expressions and create variable declarations
  const exprRegex = /\{\{([\s\S]*?)\}\}/g
  let exprCounter = 0
  match = exprRegex.exec(content)
  while (match !== null) {
    const expr = match[1].trim()
    // Create a type-preserving expression
    tsContent += `const __expr${exprCounter} = ${expr};\n`
    exprCounter++
    match = exprRegex.exec(content)
  }

  return tsContent || '// No TypeScript content found'
}

/**
 * Create a ScriptSnapshot from stx content
 */
function createStxSnapshot(
  ts: typeof import('typescript/lib/tsserverlibrary'),
  content: string,
): ts.IScriptSnapshot {
  const tsContent = extractTypeScriptFromStx(content)
  return ts.ScriptSnapshot.fromString(tsContent)
}

function init(modules: { typescript: typeof ts }): ts.server.PluginModule {
  const ts = modules.typescript

  return {
    create(info: ts.server.PluginCreateInfo): ts.LanguageService {
      const log = (msg: string) => {
        info.project.projectService.logger.info(`[stx-plugin] ${msg}`)
      }

      log('TypeScript stx plugin initialized')

      // Get the original language service and host
      const languageService = info.languageService
      const languageServiceHost = info.languageServiceHost

      // Store original methods
      const getScriptSnapshot = languageServiceHost.getScriptSnapshot?.bind(languageServiceHost)
      const getScriptVersion = languageServiceHost.getScriptVersion?.bind(languageServiceHost)

      // Track stx file versions
      const stxVersions = new Map<string, string>()

      // Override getScriptSnapshot to transform stx files
      if (getScriptSnapshot) {
        languageServiceHost.getScriptSnapshot = (fileName: string): ts.IScriptSnapshot | undefined => {
          if (fileName.endsWith('.stx') || fileName.endsWith('.md')) {
            const snapshot = getScriptSnapshot(fileName)
            if (snapshot) {
              const content = snapshot.getText(0, snapshot.getLength())
              // Update version tracking
              const version = getScriptVersion?.(fileName) || '0'
              stxVersions.set(fileName, version)

              // Transform stx to TypeScript
              return createStxSnapshot(ts, content)
            }
          }
          return getScriptSnapshot(fileName)
        }
      }

      // Proxy hover to improve variable type display
      const getQuickInfoAtPosition = languageService.getQuickInfoAtPosition.bind(languageService)
      languageService.getQuickInfoAtPosition = (fileName: string, position: number): ts.QuickInfo | undefined => {
        const quickInfo = getQuickInfoAtPosition(fileName, position)

        if (quickInfo && (fileName.endsWith('.stx') || fileName.endsWith('.md'))) {
          // Enhance display for variables
          if (quickInfo.displayParts) {
            const displayText = quickInfo.displayParts.map(part => part.text).join('')

            // Replace generic "var" or "const" with more specific type information
            if (displayText.includes('var ') || displayText.includes('const ')) {
              // Extract the actual type from the display parts
              const typeInfo = quickInfo.displayParts.find(part =>
                part.kind === 'typeParameterName'
                || part.kind === 'className'
                || part.kind === 'interfaceName',
              )

              if (typeInfo) {
                // Update the documentation to include the type
                if (quickInfo.documentation) {
                  quickInfo.documentation = [
                    { text: `Type: ${typeInfo.text}\n\n`, kind: 'text' },
                    ...quickInfo.documentation,
                  ]
                }
              }
            }
          }
        }

        return quickInfo
      }

      // Proxy completion to improve suggestions
      const getCompletionsAtPosition = languageService.getCompletionsAtPosition.bind(languageService)
      languageService.getCompletionsAtPosition = (
        fileName: string,
        position: number,
        options: ts.GetCompletionsAtPositionOptions | undefined,
      ): ts.CompletionInfo | undefined => {
        const completions = getCompletionsAtPosition(fileName, position, options)

        if (completions && (fileName.endsWith('.stx') || fileName.endsWith('.md'))) {
          // Filter out irrelevant completions in stx context
          completions.entries = completions.entries.filter((entry) => {
            // Keep user-defined symbols
            if (entry.kind === ts.ScriptElementKind.variableElement
              || entry.kind === ts.ScriptElementKind.functionElement
              || entry.kind === ts.ScriptElementKind.constElement
              || entry.kind === ts.ScriptElementKind.letElement) {
              return true
            }
            // Filter out some global symbols that are less relevant
            return !entry.name.startsWith('__')
          })
        }

        return completions
      }

      log('Language service proxy created')
      return languageService
    },

    getExternalFiles(project: ts.server.Project): string[] {
      // Add stx and MD files to the project
      return project.getFileNames().filter(file =>
        file.endsWith('.stx')
        || file.endsWith('.md'),
      )
    },
  }
}

export default init
