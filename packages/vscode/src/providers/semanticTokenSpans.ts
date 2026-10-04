/** One token on a line: character offsets and a `tokenTypes` entry. */
export interface SemanticTokenSpan {
  start: number
  end: number
  type: string
}

/**
 * The semantic tokens of one line of a template. Pure, so it is tested
 * without the editor; semanticTokensProvider.ts only turns spans into ranges.
 */
export function semanticTokenSpans(text: string): SemanticTokenSpan[] {
  const spans: SemanticTokenSpan[] = []

  // Directive categories for different highlighting
  const controlFlowDirectives = ['if', 'else', 'elseif', 'unless', 'endif', 'endunless', 'switch', 'case', 'default', 'endswitch']
  const loopDirectives = ['for', 'foreach', 'while', 'forelse', 'endfor', 'endforeach', 'endwhile', 'endforelse', 'break', 'continue']
  const functionDirectives = ['component', 'include', 'includeIf', 'includeWhen', 'includeUnless', 'includeFirst', 'extends', 'use']
  const contentDirectives = ['ts', 'js', 'script', 'css', 'markdown', 'raw', 'verbatim', 'json']

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

    spans.push({ start: startChar, end: startChar + length, type: tokenType })
    match = directiveRegex.exec(text)
  }

  // Highlight stx comments {{-- --}}
  const commentRegex = /\{\{--.*?--\}\}/g
  let commentMatch: RegExpExecArray | null

  commentMatch = commentRegex.exec(text)
  while (commentMatch !== null) {
    const startChar = commentMatch.index
    const length = commentMatch[0].length

    spans.push({ start: startChar, end: startChar + length, type: 'comment' })
    commentMatch = commentRegex.exec(text)
  }

  // Highlight stx expressions {{ }}
  const expressionRegex = /\{\{(?!--)(.+?)\}\}/g
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
        varMatch = variableRegex.exec(content)
        continue
      }

      spans.push({ start: varStartChar, end: varStartChar + varName.length, type: 'variable' })
      varMatch = variableRegex.exec(content)
    }
    exprMatch = expressionRegex.exec(text)
  }

  // Highlight directive parameters in parentheses
  const directiveWithParamsRegex = /@\w+\s*\(([^)]+)\)/g
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

      spans.push({ start: stringStart, end: stringStart + stringMatch[0].length, type: 'string' })
      stringMatch = stringRegex.exec(params)
    }
    paramMatch = directiveWithParamsRegex.exec(text)
  }

  return spans
}
