# @stacksjs/stx-vscode

stx language support for VS Code extensions to embed: the hovers, completions, diagnostics, go to definition, folding, semantic tokens, utility-class previews, grammar, snippets and language configuration behind the [stx extension](https://marketplace.visualstudio.com/items?itemName=Stacks.vscode-stx).

It is built from the extension's own source, `packages/vscode/src`, so the extension and every extension embedding this package run the same code. The Stacks extension (`Stacks.vscode-stacks`) is the embedder it was made for.

## Usage

```ts
import { join } from 'node:path'
import { activateStxLanguage, STX_EXTENSION_ID } from '@stacksjs/stx-vscode'
import * as vscode from 'vscode'

export async function activate(context: vscode.ExtensionContext) {
  await activateStxLanguage(context, {
    // Copy node_modules/@stacksjs/stx-vscode/dist/assets here when you build.
    assetsPath: join(context.extensionPath, 'dist', 'stx'),
    // The stx extension contributes the snippets itself; offer them only without it.
    snippets: !vscode.extensions.getExtension(STX_EXTENSION_ID),
  })

  // The stx extension stands down when it sees this from Stacks.vscode-stacks.
  return { stx: { active: true } }
}
```

The static half has to be in your extension's manifest, because VS Code reads grammars and language configurations only from there. `@stacksjs/stx-vscode/contributes.json` holds the `languages`, `grammars`, `snippets`, `commands` and `configuration` entries, with paths relative to `dist/assets`. Leave `snippets` out of the manifest and pass `snippets: true` instead if your extension can be installed next to the stx extension, or every snippet shows up twice.

`vscode`, `prettier` and `@stacksjs/ts-css` are imported, not bundled: bundle the library into your extension.

## License

MIT
