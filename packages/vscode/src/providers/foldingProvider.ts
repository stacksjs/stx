import * as vscode from 'vscode'
import { STX_DIRECTIVE_PAIRS, STX_OPENING_DIRECTIVE_BY_CLOSE } from '../language-features'

/**
 * Creates a folding range provider for stx directive blocks
 */
export function createFoldingRangeProvider(): vscode.FoldingRangeProvider {
  return {
    provideFoldingRanges(document, _context, _token) {
      // Check configuration
      const config = vscode.workspace.getConfiguration('stx.folding')
      const foldingEnabled = config.get<boolean>('enable', true)

      if (!foldingEnabled) {
        return []
      }

      const foldingRanges: vscode.FoldingRange[] = []

      // Stack to track open directives
      interface DirectiveInfo {
        name: string
        line: number
        kind: vscode.FoldingRangeKind
      }
      const stack: DirectiveInfo[] = []

      // Regular expression to match directives
      const directiveRegex = /@(\w+)(?:\(|$|\s)/g

      // Determine folding kind based on directive type
      function getFoldingKind(directiveName: string): vscode.FoldingRangeKind {
        // Code blocks
        if (['ts', 'js', 'script', 'css'].includes(directiveName)) {
          return vscode.FoldingRangeKind.Region
        }
        // Comments and documentation
        if (['markdown', 'raw', 'verbatim'].includes(directiveName)) {
          return vscode.FoldingRangeKind.Comment
        }
        // Default for control flow
        return vscode.FoldingRangeKind.Region
      }

      // Process each line
      for (let lineNum = 0; lineNum < document.lineCount; lineNum++) {
        const line = document.lineAt(lineNum)
        const text = line.text

        // Find all directives in the line
        let match: RegExpExecArray | null
        directiveRegex.lastIndex = 0
        match = directiveRegex.exec(text)
        while (match !== null) {
          const directiveName = match[1]

          // Check if it's an opening directive
          if (STX_DIRECTIVE_PAIRS[directiveName]) {
            stack.push({
              name: directiveName,
              line: lineNum,
              kind: getFoldingKind(directiveName),
            })
          }
          // Check if it's a closing directive
          else {
            const isEndDirective = directiveName.startsWith('end')
            if (isEndDirective) {
              // Find the corresponding opening directive
              const openingName = STX_OPENING_DIRECTIVE_BY_CLOSE.get(directiveName)

              if (openingName && stack.length > 0) {
                const lastOpening = stack[stack.length - 1]
                if (lastOpening.name === openingName) {
                  const opening = stack.pop()!
                  // Only create folding range if there's content between opening and closing
                  if (lineNum > opening.line) {
                    foldingRanges.push(
                      new vscode.FoldingRange(
                        opening.line,
                        lineNum,
                        opening.kind,
                      ),
                    )
                  }
                }
              }
            }
          }
          match = directiveRegex.exec(text)
        }
      }

      // Also fold HTML-style tags
      const htmlTagRegex = /<([a-z][^>]*)>[\s\S]*?<\/\1>/gi
      const fullText = document.getText()
      let htmlMatch: RegExpExecArray | null
      htmlMatch = htmlTagRegex.exec(fullText)

      while (htmlMatch !== null) {
        const startPos = document.positionAt(htmlMatch.index)
        const endPos = document.positionAt(htmlMatch.index + htmlMatch[0].length)

        // Only fold if spans multiple lines
        if (endPos.line > startPos.line) {
          foldingRanges.push(
            new vscode.FoldingRange(
              startPos.line,
              endPos.line,
              vscode.FoldingRangeKind.Region,
            ),
          )
        }
        htmlMatch = htmlTagRegex.exec(fullText)
      }

      // Fold comment blocks {{-- --}}
      const commentRegex = /\{\{--[\s\S]*?--\}\}/g
      let commentMatch: RegExpExecArray | null
      commentMatch = commentRegex.exec(fullText)

      while (commentMatch !== null) {
        const startPos = document.positionAt(commentMatch.index)
        const endPos = document.positionAt(commentMatch.index + commentMatch[0].length)

        // Only fold if spans multiple lines
        if (endPos.line > startPos.line) {
          foldingRanges.push(
            new vscode.FoldingRange(
              startPos.line,
              endPos.line,
              vscode.FoldingRangeKind.Comment,
            ),
          )
        }
        commentMatch = commentRegex.exec(fullText)
      }

      return foldingRanges
    },
  }
}
