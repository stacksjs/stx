import * as path from 'node:path'
import * as vscode from 'vscode'
import { STACKS_EXTENSION_ID } from './ids'
import { activateStxLanguage, deactivateStxLanguage } from './language'
import { stacksProvidesStx } from './stand-down'

export async function activate(context: vscode.ExtensionContext): Promise<void> {
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
