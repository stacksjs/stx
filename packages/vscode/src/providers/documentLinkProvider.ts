/* eslint-disable unused-imports/no-unused-vars, regexp/no-unused-capturing-group */
import * as vscode from 'vscode'
import { extractTemplatePath, getTemplatePathRange, resolveTemplatePath } from '../utils/templateUtils'

export function createDocumentLinkProvider(): vscode.DocumentLinkProvider {
  return {
    async provideDocumentLinks(document, token) {
      const links: vscode.DocumentLink[] = []

      // Process file line by line
      for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
        const line = document.lineAt(lineIndex).text

        // Check for both regular and conditional template directives
        const isRegularDirective = /@(include|component)\s*\(/.test(line)
        const isConditionalDirective = /@(includeIf|includeWhen|includeUnless|includeFirst)\s*\([^,]*,/.test(line)

        if (isRegularDirective || isConditionalDirective) {
          const templatePath = extractTemplatePath(line)
          if (templatePath) {
            const range = getTemplatePathRange(document, lineIndex)

            if (range) {
              const resolvedUri = resolveTemplatePath(document.uri, templatePath)

              if (resolvedUri) {
                // Create a document link
                const documentLink = new vscode.DocumentLink(range, resolvedUri)
                // Add tooltip
                documentLink.tooltip = `Open ${templatePath}`
                links.push(documentLink)
              }
            }
          }
        }
      }

      return links
    },
  }
}
