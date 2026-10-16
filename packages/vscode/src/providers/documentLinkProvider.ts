/* eslint-disable unused-imports/no-unused-vars, regexp/no-unused-capturing-group */
import * as vscode from 'vscode'
import { findTemplatePathReferences } from '../utils/template-paths'
import { resolveTemplatePath } from '../utils/templateUtils'

export function createDocumentLinkProvider(): vscode.DocumentLinkProvider {
  return {
    async provideDocumentLinks(document, token) {
      const links: vscode.DocumentLink[] = []

      // Process file line by line
      for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
        const line = document.lineAt(lineIndex).text

        for (const reference of findTemplatePathReferences(line)) {
          const resolvedUri = resolveTemplatePath(document.uri, reference.path)

          if (resolvedUri) {
            const range = new vscode.Range(lineIndex, reference.start, lineIndex, reference.end)
            const documentLink = new vscode.DocumentLink(range, resolvedUri)
            documentLink.tooltip = `Open ${reference.path}`
            links.push(documentLink)
          }
        }
      }

      return links
    },
  }
}
