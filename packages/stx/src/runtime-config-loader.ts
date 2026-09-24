import fs from 'node:fs'
import path from 'node:path'
import { currentRuntimeConfig, resolveRuntimeConfig, type RuntimeConfigDefaults } from './runtime-config-server'

/** Also supports hosts that extract server scripts before processDirectives. */
export async function prepareRuntimeConfig(context: Record<string, any>, filePath: string, defaults?: RuntimeConfigDefaults): Promise<void> {
  if (context.__stx_runtime_config) return
  const active = currentRuntimeConfig()
  if (active || defaults) {
    context.__stx_runtime_config = active ?? resolveRuntimeConfig(defaults)
    return
  }
  let dir = path.dirname(path.resolve(filePath))
  while (true) {
    if (['stx.config.ts', 'stx.config.js', '.config/stx.config.ts', '.config/stx.config.js'].some(name => fs.existsSync(path.join(dir, name)))) {
      const { loadStxConfig } = await import('./config')
      const config = await loadStxConfig(dir)
      if (config.runtimeConfig) context.__stx_runtime_config = resolveRuntimeConfig(config.runtimeConfig)
      return
    }
    const parent = path.dirname(dir)
    if (parent === dir) return
    dir = parent
  }
}

/** Emit literal types only; client declarations never reference private keys. */
export async function generateRuntimeConfigTypes(root: string, defaults: RuntimeConfigDefaults): Promise<void> {
  function type(value: any): string {
    if (value === null) return 'null'
    if (Array.isArray(value)) return `Array<${value.length ? [...new Set(value.map(type))].join(' | ') : 'unknown'}>`
    if (typeof value === 'object') return `{ ${Object.entries(value).map(([k, v]) => `readonly ${JSON.stringify(k)}: ${type(v)}`).join('; ')} }`
    return typeof value
  }
  await Bun.write(path.join(root, '.stx/runtime-config.d.ts'), `import '@stacksjs/stx/runtime-config'\ndeclare module '@stacksjs/stx/runtime-config' { interface PublicRuntimeConfig ${type(defaults.public ?? {})} }\n`)
  await Bun.write(path.join(root, '.stx/runtime-config-server.d.ts'), `import '@stacksjs/stx/runtime-config-server'\ndeclare module '@stacksjs/stx/runtime-config-server' { interface PrivateRuntimeConfig ${type(defaults.private ?? {})} }\n`)
}
