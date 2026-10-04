/**
 * The embedding API of `@stacksjs/stx-vscode`.
 *
 * Written by hand rather than generated: the implementation (packages/vscode/src)
 * is typed against `@types/vscode`, and generating from it would make every
 * consumer install those types to read four functions.
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
