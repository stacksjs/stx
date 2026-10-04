/** The marketplace ID of the standalone stx extension, published from this repository. */
export const STX_EXTENSION_ID = 'Stacks.vscode-stx'

/**
 * The marketplace ID of the Stacks framework extension, published from
 * stacksjs/stacks (storage/framework/defaults/ide/vscode). It embeds stx
 * support through `@stacksjs/stx-vscode`, and while it serves stx the stx
 * extension stands down rather than registering everything twice
 * (stacksjs/stx#2020).
 */
export const STACKS_EXTENSION_ID = 'Stacks.vscode-stacks'
