import type * as vscode from 'vscode'
import type { HeadwindContext } from './context'
import { getClassAtPosition } from './utils/class-matcher'
import { addRemToPxComment, prettifyCSS } from './utils/css-parser'

/**
 * Create hover provider for Headwind utility classes
 */
export function createHeadwindHoverProvider(vscodeModule: typeof vscode, context: HeadwindContext): vscode.HoverProvider {
  return {
    async provideHover(document, position, token) {
      const config = vscodeModule.workspace.getConfiguration('stx.utilityClasses')
      const hoverEnabled = config.get<boolean>('hoverPreview', true)

      if (!hoverEnabled) {
        return null
      }

      // Get the class name at the cursor position
      const className = getClassAtPosition(document, position)

      if (!className) {
        return null
      }

      // Check if this is a utility class that Headwind knows about
      const matches = await context.matchesRule(className)
      if (!matches) {
        return null
      }

      try {
        // Generate CSS for this class
        const css = await context.getCSSForClass(className)

        if (!css) {
          return null
        }

        // Add rem to px comments if enabled
        const remToPxRatio = vscodeModule.workspace.getConfiguration('headwind').get<number>('remToPxRatio', 16)
        const processedCSS = addRemToPxComment(css, remToPxRatio)

        // Prettify the CSS
        const prettyCSS = prettifyCSS(processedCSS)

        // Create hover content
        const markdown = new vscodeModule.MarkdownString()
        markdown.supportHtml = true
        markdown.isTrusted = true

        markdown.appendMarkdown(`**Headwind Utility:** \`${className}\`\n\n`)
        markdown.appendCodeblock(prettyCSS, 'css')

        return new vscodeModule.Hover(markdown)
      }
      catch (error) {
        console.error('[Headwind Hover] Error:', error)
        return null
      }
    },
  }
}
