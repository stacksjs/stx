/**
 * Start the TypeScript server for `.stx` files and forward the plugin's
 * settings to it (stacksjs/stx#2028).
 *
 * The plugin claims the `stx` language in `contributes.typescriptServerPlugins`,
 * so VS Code sends `.stx` documents to tsserver - but only once the built-in
 * TypeScript extension is running, and that extension activates on JavaScript
 * and TypeScript files, not on `stx`. A window with only `.stx` files open
 * would never start it, and nothing in them would be checked. So it is
 * activated here, which is what activating it through its API does.
 *
 * Its API is also the only channel to a tsserver plugin's configuration:
 * `configurePlugin` hands an object to the plugin's `onConfigurationChanged`.
 * `stxTypescriptPlugin.enabled` was declared and read by nothing; it is
 * forwarded now, so turning it off really does stop the checking.
 */

/** The name `contributes.typescriptServerPlugins` declares (scripts/ts-plugin-package.ts). */
export const TS_PLUGIN_NAME = '@stacksjs/stx-typescript-plugin'

/** VS Code's built-in TypeScript extension. */
export const TYPESCRIPT_EXTENSION_ID = 'vscode.typescript-language-features'

/** The settings section the plugin reads. */
export const TS_PLUGIN_SETTINGS = 'stxTypescriptPlugin'

/** The part of the `vscode` API this module uses. */
export interface TsPluginHostApi {
  extensions: {
    getExtension: (id: string) => { isActive: boolean, exports: unknown, activate: () => PromiseLike<unknown> } | undefined
  }
  workspace: {
    getConfiguration: (section: string) => { get: <T>(key: string, fallback: T) => T }
    onDidChangeConfiguration: (listener: (event: { affectsConfiguration: (section: string) => boolean }) => void) => { dispose: () => void }
  }
}

interface TypeScriptApi {
  configurePlugin: (pluginId: string, configuration: Record<string, unknown>) => void
}

/** What the plugin receives: see `StxPluginConfig` in typescript-stx-plugin.ts. */
export function tsPluginConfiguration(api: TsPluginHostApi): { enabled: boolean } {
  return { enabled: api.workspace.getConfiguration(TS_PLUGIN_SETTINGS).get('enabled', true) }
}

/**
 * Activate the TypeScript extension and keep the plugin's configuration in
 * step with the settings. Resolves to whether the TypeScript API was reached;
 * a window without it (the extension disabled, say) simply goes unchecked.
 */
export async function configureTypeScriptPlugin(api: TsPluginHostApi, subscriptions: Array<{ dispose: () => void }>): Promise<boolean> {
  const extension = api.extensions.getExtension(TYPESCRIPT_EXTENSION_ID)
  if (!extension)
    return false

  const exports = (extension.isActive ? extension.exports : await extension.activate()) as { getAPI?: (version: number) => TypeScriptApi | undefined } | undefined
  const typescript = exports?.getAPI?.(0)
  if (!typescript)
    return false

  const send = (): void => typescript.configurePlugin(TS_PLUGIN_NAME, tsPluginConfiguration(api))
  send()
  subscriptions.push(api.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration(TS_PLUGIN_SETTINGS))
      send()
  }))
  return true
}
