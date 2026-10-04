import { describe, expect, test } from 'bun:test'
import { configureTypeScriptPlugin, TS_PLUGIN_NAME, TS_PLUGIN_SETTINGS, TYPESCRIPT_EXTENSION_ID } from '../src/ts-plugin-config'
import { TS_PLUGIN_PACKAGE } from '../scripts/ts-plugin-package'

// The TypeScript extension activates on JavaScript and TypeScript, not on stx,
// and its API is the only way to configure a tsserver plugin. So the stx
// extension activates it and forwards `stxTypescriptPlugin.enabled`, which used
// to be declared and read by nothing (stacksjs/stx#2028).

function fakeVscode(options: { installed?: boolean, active?: boolean, enabled?: boolean } = {}) {
  const sent: Array<[string, Record<string, unknown>]> = []
  const listeners: Array<(event: { affectsConfiguration: (section: string) => boolean }) => void> = []
  let enabled = options.enabled ?? true
  let activations = 0
  const typescript = { getAPI: (version: number) => (version === 0 ? { configurePlugin: (id: string, config: Record<string, unknown>) => sent.push([id, config]) } : undefined) }

  return {
    sent,
    get activations() { return activations },
    setEnabled(value: boolean) {
      enabled = value
      for (const listener of listeners)
        listener({ affectsConfiguration: section => section === TS_PLUGIN_SETTINGS })
    },
    api: {
      extensions: {
        getExtension: (id: string) => (id === TYPESCRIPT_EXTENSION_ID && options.installed !== false
          ? { isActive: options.active ?? false, exports: options.active ? typescript : undefined, activate: async () => { activations++; return typescript } }
          : undefined),
      },
      workspace: {
        getConfiguration: (section: string) => ({ get: <T>(key: string, fallback: T): T => (section === TS_PLUGIN_SETTINGS && key === 'enabled' ? enabled as T : fallback) }),
        onDidChangeConfiguration: (listener: (event: { affectsConfiguration: (section: string) => boolean }) => void) => {
          listeners.push(listener)
          return { dispose: () => {} }
        },
      },
    },
  }
}

describe('configureTypeScriptPlugin', () => {
  test('activates the TypeScript extension, which does not activate on stx by itself', async () => {
    const vscode = fakeVscode()
    expect(await configureTypeScriptPlugin(vscode.api, [])).toBe(true)
    expect(vscode.activations).toBe(1)
  })

  test('sends the setting to the plugin by the name the manifest contributes', async () => {
    const vscode = fakeVscode({ active: true, enabled: false })
    await configureTypeScriptPlugin(vscode.api, [])
    expect(TS_PLUGIN_NAME).toBe(TS_PLUGIN_PACKAGE)
    expect(vscode.sent).toEqual([[TS_PLUGIN_NAME, { enabled: false }]])
    expect(vscode.activations).toBe(0)
  })

  test('sends it again when it changes', async () => {
    const vscode = fakeVscode({ active: true })
    const subscriptions: Array<{ dispose: () => void }> = []
    await configureTypeScriptPlugin(vscode.api, subscriptions)
    vscode.setEnabled(false)
    expect(vscode.sent.map(([, config]) => config.enabled)).toEqual([true, false])
    expect(subscriptions).toHaveLength(1)
  })

  test('does nothing without the TypeScript extension', async () => {
    expect(await configureTypeScriptPlugin(fakeVscode({ installed: false }).api, [])).toBe(false)
  })
})
