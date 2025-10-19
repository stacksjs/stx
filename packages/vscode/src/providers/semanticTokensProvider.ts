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
    provideDocumentSemanticTokens(document, _token) {
      // Check configuration
      const config = vscode.workspace.getConfiguration('stx.semanticHighlighting')
      const semanticEnabled = config.get<boolean>('enable', true)

      if (!semanticEnabled) {
        return new vscode.SemanticTokensBuilder(legend).build()
      }

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

        match = directiveRegex.exec(text)
        while (match !== null) {
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
          match = directiveRegex.exec(text)
        }

        // Highlight stx comments {{-- --}}
        const commentRegex = /\{\{--.*?--\}\}/g
        let commentMatch: RegExpExecArray | null

        commentMatch = commentRegex.exec(text)
        while (commentMatch !== null) {
          const startChar = commentMatch.index
          const length = commentMatch[0].length

          tokensBuilder.push(
            new vscode.Range(
              new vscode.Position(lineNum, startChar),
              new vscode.Position(lineNum, startChar + length),
            ),
            'comment',
          )
          commentMatch = commentRegex.exec(text)
        }

        // Highlight stx expressions {{ }}
        const expressionRegex = /\{\{(?!--)(.+?)\}\}/
        let exprMatch: RegExpExecArray | null

        exprMatch = expressionRegex.exec(text)
        while (exprMatch !== null) {
          const content = exprMatch[1]
          const startChar = exprMatch.index + 2 // Skip {{

          // Tokenize the expression content
          // Look for variables, function calls, etc.
          const variableRegex = /\b([a-z_$][\w$]*)\b/gi
          let varMatch: RegExpExecArray | null

          varMatch = variableRegex.exec(content)
          while (varMatch !== null) {
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
            varMatch = variableRegex.exec(content)
          }
          exprMatch = expressionRegex.exec(text)
        }

        // Highlight directive parameters in parentheses
        const directiveWithParamsRegex = /@\w+\s*\(([^)]+)\)/
        let paramMatch: RegExpExecArray | null

        paramMatch = directiveWithParamsRegex.exec(text)
        while (paramMatch !== null) {
          const params = paramMatch[1]
          const paramsStart = paramMatch.index + paramMatch[0].indexOf('(') + 1

          // Tokenize string literals in parameters
          const stringRegex = /(['"`])(?:[^\\]|\\.)*?\1/g
          let stringMatch: RegExpExecArray | null

          stringMatch = stringRegex.exec(params)
          while (stringMatch !== null) {
            const stringStart = paramsStart + stringMatch.index

            tokensBuilder.push(
              new vscode.Range(
                new vscode.Position(lineNum, stringStart),
                new vscode.Position(lineNum, stringStart + stringMatch[0].length),
              ),
              'string',
            )
            stringMatch = stringRegex.exec(params)
          }
          paramMatch = directiveWithParamsRegex.exec(text)
        }
      }

      return tokensBuilder.build()
    },
  }
}
