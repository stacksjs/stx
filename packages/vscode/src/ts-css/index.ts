/* eslint-disable no-console */
import * as vscode from 'vscode'
import { registerColorDecorations } from './color-provider'
import { createCssCompletionProvider } from './completion-provider'
import { CssContext, loadCssEngineConfig } from './context'
import { createCssHoverProvider } from './hover-provider'
import { createSortClassesCommand } from './sort-provider'

let cssContext: CssContext | null = null

/**
 * Activate Css utility class features for the extension
 */
export async function activateCss(extensionContext: vscode.ExtensionContext): Promise<void> {
  console.log('[ts-css] Activating utility class features...')

  try {
    // Load Css configuration
    const config = await loadCssEngineConfig(vscode)
    cssContext = new CssContext(config)

    // Wait for context to initialize
    await cssContext.waitReady()

    // Register hover provider
    const hoverProvider = vscode.languages.registerHoverProvider(
      ['stx', 'html', 'typescript', 'typescriptreact', 'javascript', 'javascriptreact', 'vue'],
      createCssHoverProvider(vscode, cssContext),
    )
    extensionContext.subscriptions.push(hoverProvider)

    // Register completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider(
      ['stx', 'html', 'typescript', 'typescriptreact', 'javascript', 'javascriptreact', 'vue'],
      createCssCompletionProvider(vscode, cssContext),
      '"',
      '\'',
      ' ',
    )
    extensionContext.subscriptions.push(completionProvider)

    // Register color decorations
    await registerColorDecorations(vscode, cssContext, extensionContext)

    // Register sort classes command
    const sortCommand = createSortClassesCommand(vscode)
    extensionContext.subscriptions.push(sortCommand)

    // Register reload command
    const reloadCommand = vscode.commands.registerCommand('css.reload', async () => {
      console.log('[ts-css] Reloading configuration...')
      const newConfig = await loadCssEngineConfig(vscode)
      await cssContext?.reload(newConfig)
      vscode.window.showInformationMessage('Css configuration reloaded')
    })
    extensionContext.subscriptions.push(reloadCommand)

    console.log('[ts-css] Successfully activated utility class features')
  }
  catch (error) {
    console.error('[ts-css] Failed to activate:', error)
    vscode.window.showErrorMessage(`Failed to activate Css features: ${error}`)
  }
}

/**
 * Deactivate Css features
 */
export function deactivateCss(): void {
  cssContext = null
  console.log('[ts-css] Deactivated')
}

export { CssContext }
