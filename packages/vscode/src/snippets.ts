import * as fs from 'node:fs'
import * as vscode from 'vscode'

interface SnippetDefinition {
  prefix: string | string[]
  body: string | string[]
  description?: string
}

/**
 * Read a VS Code snippets file into completion items.
 *
 * A manifest's `contributes.snippets` is the usual way to ship snippets, but a
 * manifest entry cannot be switched off at runtime. An extension that embeds
 * stx support next to the stx extension needs exactly that, or every snippet
 * appears twice, so it offers them through this provider instead.
 */
export function snippetCompletionItems(file: string): vscode.CompletionItem[] {
  let definitions: Record<string, SnippetDefinition>
  try {
    definitions = JSON.parse(fs.readFileSync(file, 'utf8'))
  }
  catch (error) {
    console.error(`stx - could not read the snippets in ${file}:`, error)
    return []
  }

  const items: vscode.CompletionItem[] = []
  for (const [name, snippet] of Object.entries(definitions)) {
    const prefixes = Array.isArray(snippet.prefix) ? snippet.prefix : [snippet.prefix]
    const body = Array.isArray(snippet.body) ? snippet.body.join('\n') : snippet.body

    for (const prefix of prefixes) {
      const item = new vscode.CompletionItem(prefix, vscode.CompletionItemKind.Snippet)
      item.insertText = new vscode.SnippetString(body)
      item.detail = snippet.description ?? name
      item.documentation = new vscode.MarkdownString().appendCodeblock(body, 'stx')
      items.push(item)
    }
  }

  return items
}

export function registerSnippetCompletions(file: string): vscode.Disposable {
  const items = snippetCompletionItems(file)

  return vscode.languages.registerCompletionItemProvider('stx', {
    provideCompletionItems: () => items,
  })
}
