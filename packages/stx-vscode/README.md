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

## Type checking `.stx` files

The TypeScript server plugin ships too, as a complete package in `dist/typescript-plugin/` (`@stacksjs/stx-typescript-plugin/...` is exported as `@stacksjs/stx-vscode/typescript-plugin/*`). To type-check `.stx` files in the editor:

1. Declare `typescriptServerPlugins` from `contributes.json` in your manifest.
2. Put the package where tsserver looks for it: tsserver loads a plugin only by package name, from `<your extension>/node_modules/@stacksjs/stx-typescript-plugin`. If you package with `vsce --no-dependencies`, which leaves `node_modules` out, ship the directory elsewhere in the VSIX and add a two-file forwarder package under `node_modules` after `vsce` writes it, as the Stacks extension does.
3. Call `configureTypeScriptPlugin(vscode, context.subscriptions)` in `activate`. It starts VS Code's TypeScript extension, which does not activate on `stx` by itself, and forwards `stxTypescriptPlugin.enabled` to the plugin.

The stx extension contributes the same plugin under the same name. With both extensions installed, tsserver loads it once per contribution, and the plugin decorates each project only the first time.

## License

MIT
