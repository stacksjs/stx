import type { UnocssPluginContext, UserConfig, UserConfigDefaults } from '@unocss/core'
import type { ExtensionContext, StatusBarItem } from 'vscode'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { createNanoEvents, notNull } from '@unocss/core'
import presetUno from '@unocss/preset-uno'
import { registerAnnotations } from './annotation'
import { registerAutoComplete } from './autocomplete'
import { registerDocumentCacheCleaner } from './getMatched'
import { createContext } from './integration/context'
import { isCssId } from './integration/utils'
import { log } from './log'
import { registerSelectionStyle } from './selectionStyle'
import { registerUsageProvider } from './usageProvider'
import { isSubdir } from './utils'

const frameworkConfigRE = /^(?:unocss|uno)\.config/
const unoConfigRE = /\buno(?:css)?\.config\./
const excludeFileRE = /[\\/](?:node_modules|dist|\.temp|\.cache)[\\/]/

export class ContextLoader {
  public ready: Promise<void>
  public contextsMap: Map<string, UnocssPluginContext<UserConfig<any>> | null> = new Map<string, UnocssPluginContext<UserConfig<any>> | null>()
  public configSources: string[] = []

  private fileContextCache = new Map<string, UnocssPluginContext<UserConfig<any>> | null>()
  private configExistsCache = new Map<string, boolean>()
  private defaultUnocssConfig: UserConfigDefaults = {
    presets: [presetUno()],
  }

  public events = createNanoEvents<{
    reload: () => void
    unload: (context: UnocssPluginContext<UserConfig<any>>) => void
    contextLoaded: (context: UnocssPluginContext<UserConfig<any>>) => void
    contextReload: (context: UnocssPluginContext<UserConfig<any>>) => void
    contextUnload: (context: UnocssPluginContext<UserConfig<any>>) => void
  }>()

  constructor(
    public cwd: string,
    public ext: ExtensionContext,
    public status: StatusBarItem,
  ) {
    this.ready = this.reload()
  }

  isTarget(id: string): boolean {
    return Array.from(this.contextsMap.keys()).some(cwd => isSubdir(cwd, id))
  }

  get contexts(): UnocssPluginContext<UserConfig<any>>[] {
    return Array.from(new Set(this.contextsMap.values())).filter(notNull)
  }

  async reload(): Promise<void> {
    this.ready = this._reload()
    await this.ready
    this.events.emit('reload')
  }

  private async _reload() {
    const dirs = Array.from(this.contextsMap.keys())
    await Promise.allSettled(Array.from(dirs).map(dir => this.unloadContext(dir)))

    this.fileContextCache.clear()
    this.configExistsCache.clear()

    for (const dir of dirs)
      await this.loadContextInDirectory(dir)
    if (!dirs.length)
      await this.loadContextInDirectory(this.cwd)
  }

  async unload(configDir: string): Promise<void> {
    const context = this.contextsMap.get(configDir)
    if (!context)
      return

    this.contextsMap.delete(configDir)

    for (const [path, ctx] of this.fileContextCache) {
      if (ctx === context)
        this.fileContextCache.delete(path)
    }
    this.events.emit('unload', context)
  }

  async unloadContext(configDir: string): Promise<void> {
    const context = this.contextsMap.get(configDir)
    if (!context)
      return

    this.contextsMap.delete(configDir)

    for (const [path, ctx] of this.fileContextCache) {
      if (ctx === context)
        this.fileContextCache.delete(path)
    }

    this.events.emit('contextUnload', context)
    this.events.emit('reload')
  }

  async configExists(dir: string): Promise<boolean> {
    if (!this.configExistsCache.has(dir)) {
      const files = await readdir(dir)
      this.configExistsCache.set(dir, files.some(f => frameworkConfigRE.test(f)))
    }
    return this.configExistsCache.get(dir)!
  }

  async loadContextInDirectory(dir: string): Promise<UnocssPluginContext<UserConfig<any>> | null> {
    const cached = this.contextsMap.get(dir)
    if (cached !== undefined)
      return cached

    const load = async () => {
      log.appendLine('\n-----------')
      log.appendLine(`🛠 Resolving config for ${dir}`)

      const context = createContext(
        dir,
        this.defaultUnocssConfig,
        [],
        (result) => {
          result.config.details = true
        },
      )

      context.updateRoot(dir)
      let sources = []
      try {
        sources = (await context.ready).sources
      }
      catch (e: any) {
        log.appendLine(`⚠️ Error on loading config. Config directory: ${dir}`)
        log.appendLine(String(e.stack ?? e))
        console.error(e)
        return null
      }

      this.configSources = sources

      if (!sources.length)
        return null

      const baseDir = path.dirname(sources[0])
      if (baseDir !== dir) {
        // exists on upper level, skip
        this.contextsMap.set(dir, null)
        return null
      }

      context.onReload(() => {
        for (const [path, ctx] of this.fileContextCache) {
          if (ctx === context || !ctx)
            this.fileContextCache.delete(path)
        }
        this.configExistsCache.clear()
        this.events.emit('contextReload', context)
      })

      for (const [path, ctx] of this.fileContextCache) {
        if (!ctx)
          this.fileContextCache.delete(path)
      }

      this.events.emit('contextLoaded', context)

      const uno = await context.uno

      log.appendLine(`🛠 New configuration loaded from\n${sources.map(s => `  - ${s}`).join('\n')}`)
      log.appendLine(`ℹ️ ${uno.config.presets.length} presets, ${uno.config.rulesSize} rules, ${uno.config.shortcuts.length} shortcuts, ${uno.config.variants.length} variants, ${uno.config.transformers?.length || 0} transformers loaded`)

      if (!sources.some(i => unoConfigRE.test(i))) {
        log.appendLine('💡 To have the best IDE experience, it\'s recommended to move UnoCSS configurations into a standalone `uno.config.ts` file at the root of your project.')
        log.appendLine('👉 Learn more at https://unocss.dev/guide/config-file')
      }

      return context
    }

    const context = await load()
    if (!this.contextsMap.has(dir))
      this.contextsMap.set(dir, context)
    this.fileContextCache.clear()
    this.events.emit('reload')

    log.appendLine(`🗂️ Enabled context: ${Array.from(this.contextsMap.entries()).filter(i => i[1]).map(i => i[0]).join(', ') || '[none]'}`)

    if (context)
      this.registerEditorSupport()

    return context
  }

  async resolveClosestContext(code: string, file: string): Promise<UnocssPluginContext<UserConfig<any>> | undefined | null> {
    if (!this.contextsMap.size)
      return undefined

    if (excludeFileRE.test(file))
      return undefined

    if (this.fileContextCache.has(file))
      return this.fileContextCache.get(file)

    const entries = Array.from(this.contextsMap.entries()).sort((a, b) => b[0].length - a[0].length)
    for (const [configDir, context] of entries) {
      if (!context)
        continue

      if (!isSubdir(configDir, file))
        continue

      if (!context.filter(code, file) && !isCssId(file))
        continue

      this.fileContextCache.set(file, context)
      return context
    }

    for (const [configDir, context] of entries) {
      if (!context)
        continue

      if (isSubdir(configDir, file)) {
        this.fileContextCache.set(file, context)
        return context
      }
    }
  }

  private _isRegistered = false
  registerEditorSupport(): void {
    if (this._isRegistered)
      return
    registerAutoComplete(this)
    registerAnnotations(this)
    registerSelectionStyle(this)
    registerDocumentCacheCleaner(this)
    registerUsageProvider(this)
    this._isRegistered = true
  }
}
