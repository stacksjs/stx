import * as vscode from 'vscode'
import { semanticTokenSpans } from './semanticTokenSpans'

// Define token types
export const tokenTypes = [
  'keyword', // For directive keywords like @if, @foreach
  'function', // For directive functions like @component, @include
  'variable', // For variables in expressions
  'parameter', // For directive parameters
  'string', // For string literals
  'comment', // For comments
  'operator', // For operators
]

// Define token modifiers
export const tokenModifiers = [
  'declaration',
  'readonly',
  'deprecated',
  'modification',
]

// Create the legend for semantic tokens
export const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers)

/**
 * Creates a semantic tokens provider for enhanced syntax highlighting
 */
export function createSemanticTokensProvider(): vscode.DocumentSemanticTokensProvider {
  return {
    provideDocumentSemanticTokens(document, _token) {
      // Check configuration
      const config = vscode.workspace.getConfiguration('stx.semanticHighlighting')
      const semanticEnabled = config.get<boolean>('enable', true)

      if (!semanticEnabled) {
        return new vscode.SemanticTokensBuilder(legend).build()
      }

      const tokensBuilder = new vscode.SemanticTokensBuilder(legend)

      // Process each line
      for (let lineNum = 0; lineNum < document.lineCount; lineNum++) {
        for (const span of semanticTokenSpans(document.lineAt(lineNum).text)) {
          tokensBuilder.push(
            new vscode.Range(new vscode.Position(lineNum, span.start), new vscode.Position(lineNum, span.end)),
            span.type,
          )
        }
      }

      return tokensBuilder.build()
    },
  }
}
