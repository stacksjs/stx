/* eslint-disable no-console */
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as vscode from 'vscode'

/**
 * Creates a completion provider for file paths in @include and @component directives
 */
export function createPathCompletionProvider(): vscode.CompletionItemProvider {
  return {
    provideCompletionItems(document, position, token, context) {
      const line = document.lineAt(position.line).text
      const linePrefix = line.substring(0, position.character)

      // Check if we're inside an @include or @component directive
      const includeMatch = linePrefix.match(/@include(?:If|When|Unless|First)?\s*\(\s*['"`]([^'"`]*)$/)
      const componentMatch = linePrefix.match(/@(?:component|webcomponent)\s*\(\s*['"`]([^'"`]*)$/)

      if (!includeMatch && !componentMatch) {
        return undefined
      }

      const currentPath = includeMatch ? includeMatch[1] : componentMatch![1]
      const isInclude = !!includeMatch

      // Get workspace folder
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
      if (!workspaceFolder) {
        return undefined
      }

      const workspacePath = workspaceFolder.uri.fsPath

      // Common template directories
      const templateDirs = [
        'views',
        'templates',
        'resources/views',
        'src/views',
        'src/templates',
        'app/views',
        'partials',
        'components',
        'layouts',
      ]

      // If component, also check components directories
      if (!isInclude) {
        templateDirs.push('src/components', 'app/components', 'ui', 'src/ui')
      }

      const completions: vscode.CompletionItem[] = []

      // Parse the current path to determine base directory
      let searchPath = workspacePath
      let searchRelative = ''

      if (currentPath.includes('/')) {
        // Path contains slashes, search within that directory
        const parts = currentPath.split('/')
        searchRelative = parts.slice(0, -1).join('/')

        // Try to find the base directory
        for (const templateDir of templateDirs) {
          const fullPath = path.join(workspacePath, templateDir, searchRelative)
          if (fs.existsSync(fullPath)) {
            searchPath = fullPath
            break
          }
        }
      }
      else {
        // No slashes, search in all template directories
        for (const templateDir of templateDirs) {
          const fullPath = path.join(workspacePath, templateDir)
          if (fs.existsSync(fullPath)) {
            try {
              const entries = fs.readdirSync(fullPath, { withFileTypes: true })

              for (const entry of entries) {
                if (entry.name.startsWith('.'))
                  continue

                if (entry.isDirectory()) {
                  const item = new vscode.CompletionItem(entry.name, vscode.CompletionItemKind.Folder)
                  item.detail = `Directory in ${templateDir}`
                  item.insertText = entry.name
                  item.sortText = `0${entry.name}`
                  completions.push(item)
                }
                else if (entry.isFile() && (entry.name.endsWith('.stx') || entry.name.endsWith('.html'))) {
                  // Remove extension for completion
                  const nameWithoutExt = entry.name.replace(/\.(stx|html)$/, '')
                  const item = new vscode.CompletionItem(nameWithoutExt, vscode.CompletionItemKind.File)
                  item.detail = `Template in ${templateDir}`
                  item.insertText = nameWithoutExt
                  item.sortText = `1${nameWithoutExt}`
                  completions.push(item)
                }
              }
            }
            catch (error) {
              console.error(`Error reading directory ${fullPath}:`, error)
            }
          }
        }

        return completions
      }

      // Search in the determined path
      try {
        if (!fs.existsSync(searchPath)) {
          return undefined
        }

        const entries = fs.readdirSync(searchPath, { withFileTypes: true })

        for (const entry of entries) {
          if (entry.name.startsWith('.'))
            continue

          if (entry.isDirectory()) {
            const item = new vscode.CompletionItem(entry.name, vscode.CompletionItemKind.Folder)
            item.detail = 'Directory'
            item.insertText = entry.name
            item.sortText = `0${entry.name}`
            completions.push(item)
          }
          else if (entry.isFile() && (entry.name.endsWith('.stx') || entry.name.endsWith('.html'))) {
            // Remove extension for completion
            const nameWithoutExt = entry.name.replace(/\.(stx|html)$/, '')
            const item = new vscode.CompletionItem(nameWithoutExt, vscode.CompletionItemKind.File)
            item.detail = 'Template file'
            item.insertText = nameWithoutExt
            item.sortText = `1${nameWithoutExt}`
            completions.push(item)
          }
        }
      }
      catch (error) {
        console.error(`Error reading directory ${searchPath}:`, error)
      }

      return completions
    },
  }
}
