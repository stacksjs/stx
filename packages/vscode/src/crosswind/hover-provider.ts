import type * as vscode from 'vscode'
import type { CrosswindContext } from './context'
import { getClassAtPosition } from './utils/class-matcher'
import { addRemToPxComment, prettifyCSS } from './utils/css-parser'

/**
 * Create hover provider for Crosswind utility classes
 */
export function createCrosswindHoverProvider(vscodeModule: typeof vscode, context: CrosswindContext): vscode.HoverProvider {
  return {
    async provideHover(document, position, _token) {
      const config = vscodeModule.workspace.getConfiguration('stx.utilityClasses')
      const hoverEnabled = config.get<boolean>('hoverPreview', true)

      if (!hoverEnabled) {
        return null
      }

      const className = getClassAtPosition(document, position)

      if (!className) {
        return null
      }

      const matches = await context.matchesRule(className)
      if (!matches) {
        return null
      }

      try {
        const css = await context.getCSSForClass(className)

        if (!css) {
          return null
        }

        const remToPxRatio = vscodeModule.workspace.getConfiguration('crosswind').get<number>('remToPxRatio', 16)
        const processedCSS = addRemToPxComment(css, remToPxRatio)
        const prettyCSS = prettifyCSS(processedCSS)

        const markdown = new vscodeModule.MarkdownString()
        markdown.supportHtml = true
        markdown.isTrusted = true

        markdown.appendMarkdown(`**Crosswind Utility:** \`${className}\`\n\n`)
        markdown.appendCodeblock(prettyCSS, 'css')

        return new vscodeModule.Hover(markdown)
      }
      catch (error) {
        console.error('[Crosswind Hover] Error:', error)
        return null
      }
    },
  }
}
