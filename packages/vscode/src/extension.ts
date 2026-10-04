import * as path from 'node:path'
import * as vscode from 'vscode'
import { STACKS_EXTENSION_ID } from './ids'
import { activateStxLanguage, deactivateStxLanguage } from './language'
import { stacksProvidesStx } from './stand-down'
import { configureTypeScriptPlugin } from './ts-plugin-config'

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  // Before standing down: this extension contributes the TypeScript plugin
  // whether or not it serves stx, so it forwards the setting either way. The
  // Stacks extension contributes and configures the same plugin; the plugin
  // decorates a project once however many contributions load it.
  configureTypeScriptPlugin(vscode, context.subscriptions).catch((error) => {
    console.error('stx Extension - could not configure the TypeScript plugin:', error)
  })

  if (await stacksProvidesStx(vscode)) {
    // eslint-disable-next-line no-console
    console.log(`stx Extension - ${STACKS_EXTENSION_ID} provides stx support in this window; not registering it twice`)
    return
  }

  await activateStxLanguage(context, {
    assetsPath: path.join(context.extensionPath, 'src'),
    // Contributed through this extension's manifest instead.
    snippets: false,
  })
}

export function deactivate(): void {
  deactivateStxLanguage()
}
