import * as vscode from 'vscode'
import { registerColorDecorations } from './color-provider'
import { createHeadwindCompletionProvider } from './completion-provider'
import { HeadwindContext, loadHeadwindConfig } from './context'
import { createHeadwindHoverProvider } from './hover-provider'
import { createSortClassesCommand } from './sort-provider'

let headwindContext: HeadwindContext | null = null

/**
 * Activate Headwind features for the extension
 */
export async function activateHeadwind(extensionContext: vscode.ExtensionContext): Promise<void> {
  console.log('[Headwind] Activating utility class features...')

  try {
    // Load Headwind configuration
    const config = await loadHeadwindConfig(vscode)
    headwindContext = new HeadwindContext(config)

    // Wait for context to initialize
    await headwindContext.waitReady()

    // Register hover provider
    const hoverProvider = vscode.languages.registerHoverProvider(
      ['stx', 'html', 'typescript', 'typescriptreact', 'javascript', 'javascriptreact', 'vue'],
      createHeadwindHoverProvider(vscode, headwindContext),
    )
    extensionContext.subscriptions.push(hoverProvider)

    // Register completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider(
      ['stx', 'html', 'typescript', 'typescriptreact', 'javascript', 'javascriptreact', 'vue'],
      createHeadwindCompletionProvider(vscode, headwindContext),
      '"',
      '\'',
      ' ', // Trigger characters
    )
    extensionContext.subscriptions.push(completionProvider)

    // Register color decorations
    await registerColorDecorations(vscode, headwindContext, extensionContext)

    // Register sort classes command
    const sortCommand = createSortClassesCommand(vscode)
    extensionContext.subscriptions.push(sortCommand)

    // Register reload command
    const reloadCommand = vscode.commands.registerCommand('headwind.reload', async () => {
      console.log('[Headwind] Reloading configuration...')
      const newConfig = await loadHeadwindConfig(vscode)
      await headwindContext?.reload(newConfig)
      vscode.window.showInformationMessage('Headwind configuration reloaded')
    })
    extensionContext.subscriptions.push(reloadCommand)

    console.log('[Headwind] Successfully activated utility class features')
  }
  catch (error) {
    console.error('[Headwind] Failed to activate:', error)
    vscode.window.showErrorMessage(`Failed to activate Headwind features: ${error}`)
  }
}

/**
 * Deactivate Headwind features
 */
export function deactivateHeadwind(): void {
  headwindContext = null
  console.log('[Headwind] Deactivated')
}

export { HeadwindContext }
