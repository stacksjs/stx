import * as vscode from 'vscode'
import { registerColorDecorations } from './color-provider'
import { createCrosswindCompletionProvider } from './completion-provider'
import { CrosswindContext, loadCrosswindConfig } from './context'
import { createCrosswindHoverProvider } from './hover-provider'
import { createSortClassesCommand } from './sort-provider'

let crosswindContext: CrosswindContext | null = null

/**
 * Activate Crosswind utility class features for the extension
 */
export async function activateCrosswind(extensionContext: vscode.ExtensionContext): Promise<void> {
  console.log('[Crosswind] Activating utility class features...')

  try {
    // Load Crosswind configuration
    const config = await loadCrosswindConfig(vscode)
    crosswindContext = new CrosswindContext(config)

    // Wait for context to initialize
    await crosswindContext.waitReady()

    // Register hover provider
    const hoverProvider = vscode.languages.registerHoverProvider(
      ['stx', 'html', 'typescript', 'typescriptreact', 'javascript', 'javascriptreact', 'vue'],
      createCrosswindHoverProvider(vscode, crosswindContext),
    )
    extensionContext.subscriptions.push(hoverProvider)

    // Register completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider(
      ['stx', 'html', 'typescript', 'typescriptreact', 'javascript', 'javascriptreact', 'vue'],
      createCrosswindCompletionProvider(vscode, crosswindContext),
      '"',
      '\'',
      ' ',
    )
    extensionContext.subscriptions.push(completionProvider)

    // Register color decorations
    await registerColorDecorations(vscode, crosswindContext, extensionContext)

    // Register sort classes command
    const sortCommand = createSortClassesCommand(vscode)
    extensionContext.subscriptions.push(sortCommand)

    // Register reload command
    const reloadCommand = vscode.commands.registerCommand('crosswind.reload', async () => {
      console.log('[Crosswind] Reloading configuration...')
      const newConfig = await loadCrosswindConfig(vscode)
      await crosswindContext?.reload(newConfig)
      vscode.window.showInformationMessage('Crosswind configuration reloaded')
    })
    extensionContext.subscriptions.push(reloadCommand)

    console.log('[Crosswind] Successfully activated utility class features')
  }
  catch (error) {
    console.error('[Crosswind] Failed to activate:', error)
    vscode.window.showErrorMessage(`Failed to activate Crosswind features: ${error}`)
  }
}

/**
 * Deactivate Crosswind features
 */
export function deactivateCrosswind(): void {
  crosswindContext = null
  console.log('[Crosswind] Deactivated')
}

export { CrosswindContext }
