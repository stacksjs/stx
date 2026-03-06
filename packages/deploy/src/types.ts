export type RuntimePlatform = 'bun' | 'node' | 'deno' | 'cloudflare' | 'vercel' | 'netlify' | 'unknown'

export interface RuntimeInfo {
  platform: RuntimePlatform
  version?: string
  supportsStreaming: boolean
  supportsCrypto: boolean
  supportsKV: boolean
  supportsCache: boolean
  capabilities: string[]
}

export interface AdapterBuildConfig {
  entry: string | string[]
  outDir: string
  production: boolean
}

export interface AdapterBuildResult {
  outputDir: string
  entrypoint?: string
  files: string[]
}

export interface AdapterDeployConfig {
  outputDir: string
  production: boolean
  token?: string
  siteId?: string
}

export interface DeployResult {
  success: boolean
  url?: string
  deployId?: string
  logs: string[]
  duration: number
}

export interface DeployAdapter {
  name: string
  build(config: AdapterBuildConfig): Promise<AdapterBuildResult>
  deploy?(config: AdapterDeployConfig): Promise<DeployResult>
  generateConfig?(outputDir: string): Promise<void>
}

export interface DeployAppConfig {
  adapter?: DeployAdapter | 'bun' | 'static'
  outputDir?: string
  production?: boolean
}

export interface BunServerConfig {
  port?: number
  hostname?: string
  compression?: boolean
  tls?: { cert: string, key: string }
}

export interface StaticAdapterConfig {
  prerender?: boolean
  fallback?: string
}
