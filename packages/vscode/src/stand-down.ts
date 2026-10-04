import { STACKS_EXTENSION_ID } from './ids'

/** The part of the `vscode` API `stacksProvidesStx` reads. */
export interface ExtensionsApi {
  extensions: {
    getExtension: (id: string) => { isActive: boolean, exports: unknown, activate: () => PromiseLike<unknown> } | undefined
  }
}

/**
 * Whether the Stacks extension is serving stx in this window.
 *
 * The Stacks extension embeds the same stx support (through
 * `@stacksjs/stx-vscode`). Registering it a second time would mean every hover,
 * completion and diagnostic twice, and two registrations of the `stx-ts`
 * scheme and the stx commands, which VS Code rejects. So this extension stands
 * down whenever the Stacks extension is installed, enabled, and confirms -
 * through the `stx.active` flag on the API its `activate` returns - that it
 * started stx support. Activating it here is harmless (it activates on `.stx`
 * files anyway) and avoids a race with its own activation. If it is missing,
 * disabled, older than the flag, or fails to start, this extension serves stx
 * itself.
 */
export async function stacksProvidesStx(api: ExtensionsApi): Promise<boolean> {
  const stacks = api.extensions.getExtension(STACKS_EXTENSION_ID)
  if (!stacks)
    return false

  try {
    const exports = (stacks.isActive ? stacks.exports : await stacks.activate()) as { stx?: { active?: boolean } } | undefined
    return exports?.stx?.active === true
  }
  catch (error) {
    console.error('stx Extension - the Stacks extension failed to activate; providing stx support here:', error)
    return false
  }
}
