import * as vscode from 'vscode'

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
    provideDocumentSemanticTokens(document, token) {
      const tokensBuilder = new vscode.SemanticTokensBuilder(legend)

      // Directive categories for different highlighting
      const controlFlowDirectives = ['if', 'else', 'elseif', 'unless', 'endif', 'endunless', 'switch', 'case', 'default', 'endswitch']
      const loopDirectives = ['for', 'foreach', 'while', 'forelse', 'endfor', 'endforeach', 'endwhile', 'endforelse', 'break', 'continue']
      const functionDirectives = ['component', 'include', 'includeIf', 'includeWhen', 'includeUnless', 'includeFirst', 'extends', 'use']
      const contentDirectives = ['ts', 'js', 'script', 'css', 'markdown', 'raw', 'verbatim', 'json']

      // Process each line
      for (let lineNum = 0; lineNum < document.lineCount; lineNum++) {
        const line = document.lineAt(lineNum)
        const text = line.text

        // Match stx directives
        const directiveRegex = /@(\w+)/g
        let match: RegExpExecArray | null

        while ((match = directiveRegex.exec(text)) !== null) {
          const directiveName = match[1]
          const startChar = match.index
          const length = match[0].length

          // Determine token type based on directive category
          let tokenType: string

          if (controlFlowDirectives.includes(directiveName)) {
            tokenType = 'keyword' // Blue color for control flow
          }
          else if (loopDirectives.includes(directiveName)) {
            tokenType = 'keyword' // Blue color for loops
          }
          else if (functionDirectives.includes(directiveName)) {
            tokenType = 'function' // Yellow/gold color for functions
          }
          else if (contentDirectives.includes(directiveName)) {
            tokenType = 'keyword' // Blue for content blocks
          }
          else if (directiveName.startsWith('end')) {
            tokenType = 'keyword' // Blue for end directives
          }
          else {
            tokenType = 'function' // Default to function style
          }

          const tokenTypeIndex = tokenTypes.indexOf(tokenType)
          if (tokenTypeIndex >= 0) {
            tokensBuilder.push(
              new vscode.Range(
                new vscode.Position(lineNum, startChar),
                new vscode.Position(lineNum, startChar + length),
              ),
              tokenType,
            )
          }
        }

        // Highlight stx comments {{-- --}}
        const commentRegex = /\{\{--.*?--\}\}/g
        let commentMatch: RegExpExecArray | null

        while ((commentMatch = commentRegex.exec(text)) !== null) {
          const startChar = commentMatch.index
          const length = commentMatch[0].length

          tokensBuilder.push(
            new vscode.Range(
              new vscode.Position(lineNum, startChar),
              new vscode.Position(lineNum, startChar + length),
            ),
            'comment',
          )
        }

        // Highlight stx expressions {{ }}
        const expressionRegex = /\{\{(?!--)(.+?)\}\}/g
        let exprMatch: RegExpExecArray | null

        while ((exprMatch = expressionRegex.exec(text)) !== null) {
          const content = exprMatch[1]
          const startChar = exprMatch.index + 2 // Skip {{

          // Tokenize the expression content
          // Look for variables, function calls, etc.
          const variableRegex = /\b([a-z_$][\w$]*)\b/gi
          let varMatch: RegExpExecArray | null

          while ((varMatch = variableRegex.exec(content)) !== null) {
            const varName = varMatch[1]
            const varStartChar = startChar + varMatch.index

            // Skip keywords
            if (['true', 'false', 'null', 'undefined', 'const', 'let', 'var', 'function', 'return'].includes(varName)) {
              continue
            }

            tokensBuilder.push(
              new vscode.Range(
                new vscode.Position(lineNum, varStartChar),
                new vscode.Position(lineNum, varStartChar + varName.length),
              ),
              'variable',
            )
          }
        }

        // Highlight directive parameters in parentheses
        const directiveWithParamsRegex = /@\w+\s*\(([^)]+)\)/g
        let paramMatch: RegExpExecArray | null

        while ((paramMatch = directiveWithParamsRegex.exec(text)) !== null) {
          const params = paramMatch[1]
          const paramsStart = paramMatch.index + paramMatch[0].indexOf('(') + 1

          // Tokenize string literals in parameters
          const stringRegex = /(['"`])(?:(?=(\\?))\2.)*?\1/g
          let stringMatch: RegExpExecArray | null

          while ((stringMatch = stringRegex.exec(params)) !== null) {
            const stringStart = paramsStart + stringMatch.index

            tokensBuilder.push(
              new vscode.Range(
                new vscode.Position(lineNum, stringStart),
                new vscode.Position(lineNum, stringStart + stringMatch[0].length),
              ),
              'string',
            )
          }
        }
      }

      return tokensBuilder.build()
    },
  }
}
