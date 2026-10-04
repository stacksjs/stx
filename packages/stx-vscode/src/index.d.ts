/**
 * The embedding API of `@stacksjs/stx-vscode`.
 *
 * Written by hand rather than generated: the implementation (packages/vscode/src)
 * is typed against `@types/vscode`, and generating from it would make every
 * consumer install those types to read a handful of functions.
 */

/** The marketplace ID of the standalone stx extension. */
export declare const STX_EXTENSION_ID: 'Stacks.vscode-stx'

/** The marketplace ID of the Stacks framework extension, which embeds this package. */
export declare const STACKS_EXTENSION_ID: 'Stacks.vscode-stacks'

/** The part of `vscode.ExtensionContext` stx support uses. */
export interface StxExtensionContext {
  subscriptions: Array<{ dispose: () => unknown }>
}

export interface StxLanguageOptions {
  /**
   * The directory holding the `snippets/`, `syntaxes/` and `languages/`
   * assets: this package's `dist/assets`, copied into the embedding extension.
   */
  assetsPath: string
  /**
   * Offer the stx snippets as completions. Leave it off when the snippets are
   * in your manifest, or when the stx extension is installed and contributes
   * them already.
   */
  snippets?: boolean
}

/**
 * Register all of stx's runtime language support: hovers, completions,
 * diagnostics, go to definition, document links, folding, semantic tokens,
 * code actions, utility-class previews, and the `stx.sortClasses` and
 * `stx.reloadUtilityClasses` commands. Everything is added to `context.subscriptions`.
 *
 * Call it at most once per window. The stx extension stands down only for
 * `Stacks.vscode-stacks`, and only once that extension's `activate` resolves
 * to `{ stx: { active: true } }`, so return that from `activate` after this
 * resolves. Any other embedding extension would register everything twice
 * next to the stx extension.
 */
export declare function activateStxLanguage(context: StxExtensionContext, options: StxLanguageOptions): Promise<void>

export declare function deactivateStxLanguage(): void

/** The name the TypeScript server plugin is contributed and configured under. */
export declare const TS_PLUGIN_NAME: '@stacksjs/stx-typescript-plugin'

/** The settings section the plugin reads (`stxTypescriptPlugin.enabled`). */
export declare const TS_PLUGIN_SETTINGS: 'stxTypescriptPlugin'

/** VS Code's built-in TypeScript extension. */
export declare const TYPESCRIPT_EXTENSION_ID: 'vscode.typescript-language-features'

/** The part of the `vscode` API `configureTypeScriptPlugin` uses. */
export interface TsPluginHostApi {
  extensions: {
    getExtension: (id: string) => { isActive: boolean, exports: unknown, activate: () => PromiseLike<unknown> } | undefined
  }
  workspace: {
    getConfiguration: (section: string) => { get: <T>(key: string, fallback: T) => T }
    onDidChangeConfiguration: (listener: (event: { affectsConfiguration: (section: string) => boolean }) => void) => { dispose: () => void }
  }
}

/**
 * Start VS Code's TypeScript extension, which does not activate on `stx` by
 * itself, and forward `stxTypescriptPlugin.enabled` to the plugin now and on
 * every change. Resolves to whether the TypeScript API was reached.
 *
 * Pass the `vscode` module as `api`. Call it from any extension that
 * contributes the plugin (`typescriptServerPlugins` in `contributes.json`);
 * with the stx extension installed too, both contribute and configure it and
 * the plugin decorates each project once.
 */
export declare function configureTypeScriptPlugin(api: TsPluginHostApi, subscriptions: Array<{ dispose: () => void }>): Promise<boolean>
