import type * as vscode from 'vscode'
import type { CrosswindContext } from './context'
import { extractColorFromCSS } from './utils/color-extractor'

const COMMON_UTILITIES = [
  // Layout
  'block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'hidden', 'container',
  // Flexbox
  'flex-row', 'flex-col', 'flex-wrap', 'flex-nowrap',
  'justify-start', 'justify-center', 'justify-end', 'justify-between', 'justify-around',
  'items-start', 'items-center', 'items-end', 'items-stretch',
  // Spacing
  'p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12',
  'm-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-8', 'm-10', 'm-12', 'm-auto',
  'px-4', 'py-2', 'mx-auto',
  // Sizing
  'w-full', 'w-1/2', 'w-auto', 'h-full', 'h-screen',
  // Typography
  'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl',
  'font-thin', 'font-normal', 'font-medium', 'font-bold',
  'text-left', 'text-center', 'text-right',
  // Colors
  'bg-white', 'bg-black', 'bg-gray-100', 'bg-gray-200', 'bg-gray-500',
  'text-white', 'text-black', 'text-gray-600', 'text-gray-900',
  'bg-blue-500', 'bg-red-500', 'bg-green-500',
  // Borders
  'border', 'border-0', 'border-2', 'rounded', 'rounded-lg', 'rounded-full',
  // Effects
  'shadow', 'shadow-md', 'shadow-lg', 'opacity-0', 'opacity-50', 'opacity-100',
]

/**
 * Create autocomplete provider for Crosswind utility classes
 */
export function createCrosswindCompletionProvider(vscodeModule: typeof vscode, context: CrosswindContext): vscode.CompletionItemProvider {
  return {
    async provideCompletionItems(document, position) {
      const config = vscodeModule.workspace.getConfiguration('stx.utilityClasses')
      const autocompleteEnabled = config.get<boolean>('autocomplete', true)

      if (!autocompleteEnabled) {
        return null
      }

      const line = document.lineAt(position.line).text
      const beforeCursor = line.substring(0, position.character)
      const classMatch = beforeCursor.match(/class(?:Name)?=["']([^"']*)$/)

      if (!classMatch) {
        return null
      }

      const partialInput = classMatch[1].split(/\s+/).pop() || ''
      const completionItems: any[] = []

      for (const utility of COMMON_UTILITIES) {
        if (!partialInput || utility.startsWith(partialInput)) {
          const item = new vscodeModule.CompletionItem(
            utility,
            vscodeModule.CompletionItemKind.Property,
          )

          item.detail = 'Crosswind Utility'
          item.sortText = `0${utility}`

          try {
            const css = await context.getCSSForClass(utility)
            if (css) {
              const color = extractColorFromCSS(css)
              if (color) {
                item.kind = vscodeModule.CompletionItemKind.Color
                item.documentation = color
              }
              else {
                item.documentation = new vscodeModule.MarkdownString(`\`\`\`css\n${css}\n\`\`\``)
              }
            }
          }
          catch {
            // Ignore errors in preview generation
          }

          completionItems.push(item)
        }
      }

      return new vscodeModule.CompletionList(completionItems, false)
    },
  }
}
