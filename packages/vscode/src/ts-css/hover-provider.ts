import type * as vscode from 'vscode'
import type { CssContext } from './context'
import { getClassAtPosition } from './utils/class-matcher'
import { addRemToPxComment, prettifyCSS } from './utils/css-parser'

/** The rem-to-px ratio a hover uses when nothing is configured. */
export const DEFAULT_REM_TO_PX_RATIO = 16

/**
 * The rem-to-px ratio for utility-class hovers.
 *
 * The setting is `stx.utilityClasses.remToPxRatio`. It used to be contributed
 * as `css.remToPxRatio`, in the namespace of VS Code's built-in CSS language
 * features, so a value someone set under the old key is still honoured, but
 * only when the new key is not set anywhere. Reading it needs no contribution:
 * `get` returns any value present in settings.json. No notice: the old key
 * keeps working, so there is nothing the user has to do.
 */
export function remToPxRatio(vscodeModule: Pick<typeof vscode, 'workspace'>): number {
  const settings = vscodeModule.workspace.getConfiguration('stx.utilityClasses')
  const set = settings.inspect<number>('remToPxRatio')
  const configured = set?.workspaceFolderValue ?? set?.workspaceValue ?? set?.globalValue

  if (typeof configured === 'number')
    return configured

  const legacy = vscodeModule.workspace.getConfiguration('css').get<unknown>('remToPxRatio')
  if (typeof legacy === 'number')
    return legacy

  return settings.get<number>('remToPxRatio', DEFAULT_REM_TO_PX_RATIO)
}

/**
 * Create hover provider for Css utility classes
 */
export function createCssHoverProvider(vscodeModule: typeof vscode, context: CssContext): vscode.HoverProvider {
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

        const processedCSS = addRemToPxComment(css, remToPxRatio(vscodeModule))
        const prettyCSS = await prettifyCSS(processedCSS)

        const markdown = new vscodeModule.MarkdownString()
        markdown.supportHtml = true
        markdown.isTrusted = true

        markdown.appendMarkdown(`**Css Utility:** \`${className}\`\n\n`)
        markdown.appendCodeblock(prettyCSS, 'css')

        return new vscodeModule.Hover(markdown)
      }
      catch (error) {
        console.error('[Css Hover] Error:', error)
        return null
      }
    },
  }
}
