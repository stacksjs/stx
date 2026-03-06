import type { AIConfig, AIProvider } from './types'

let globalConfig: AIConfig | undefined

export function configureAI(config: Partial<AIConfig>): void {
  globalConfig = {
    default: config.default ?? Object.keys(config.providers ?? {})[0] ?? '',
    providers: config.providers ?? {},
  }
}

export function useAI(provider?: string): AIProvider {
  if (!globalConfig) {
    throw new Error('AI not configured. Call configureAI() first.')
  }

  const name = provider ?? globalConfig.default

  if (!name) {
    throw new Error('No provider specified and no default provider configured.')
  }

  const p = globalConfig.providers[name]

  if (!p) {
    throw new Error(`AI provider "${name}" not found. Available providers: ${Object.keys(globalConfig.providers).join(', ')}`)
  }

  return p
}

export function resetAI(): void {
  globalConfig = undefined
}
