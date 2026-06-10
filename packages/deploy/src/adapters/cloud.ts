import type { AdapterBuildConfig, AdapterBuildResult, AdapterDeployConfig, DeployAdapter, DeployResult } from '../types'
import process from 'node:process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

export type DnsProviderName = 'porkbun' | 'godaddy' | 'route53'

export interface PorkbunDnsConfig {
  provider: 'porkbun'
  /** Porkbun API key. Falls back to PORKBUN_API_KEY env. */
  apiKey?: string
  /** Porkbun secret key. Falls back to PORKBUN_SECRET_KEY env. */
  secretKey?: string
}

export interface GoDaddyDnsConfig {
  provider: 'godaddy'
  /** GoDaddy API key. Falls back to GODADDY_API_KEY env. */
  apiKey?: string
  /** GoDaddy API secret. Falls back to GODADDY_API_SECRET env. */
  secretKey?: string
  /** API environment. Falls back to GODADDY_ENVIRONMENT env. */
  environment?: 'production' | 'ote'
}

export interface Route53DnsConfig {
  provider: 'route53'
  /** Optional Route53 hosted zone ID (auto-detected from domain if omitted). */
  hostedZoneId?: string
}

export type DnsProviderConfig = PorkbunDnsConfig | GoDaddyDnsConfig | Route53DnsConfig

export interface CloudAdapterConfig {
  /** Site name for AWS resource naming */
  siteName: string
  /** AWS region (default: us-east-1) */
  region?: string
  /** Custom domain (e.g., docs.example.com) */
  domain?: string
  /** S3 bucket name (auto-generated if not provided) */
  bucket?: string
  /** CloudFormation stack name */
  stackName?: string
  /** Default root object (default: index.html) */
  defaultRootObject?: string
  /** Error document (default: 404.html) */
  errorDocument?: string
  /** Cache control header for assets */
  cacheControl?: string
  /** Tags for AWS resources */
  tags?: Record<string, string>
  /** ACM certificate ARN — auto-created when omitted. */
  certificateArn?: string
  /**
   * DNS provider for the custom domain. Defaults to Route53.
   * Use `{ provider: 'porkbun' }` to manage DNS via Porkbun.
   * Credentials are read from the config or matching env vars.
   */
  dnsProvider?: DnsProviderConfig
  /** Empty bucket before uploading (clean re-deploy). */
  cleanBucket?: boolean
  /** Receive progress callbacks during full deploy. */
  onProgress?: (stage: string, detail?: string) => void
}

function collectFiles(dir: string, base: string = dir): string[] {
  const files: string[] = []
  if (!existsSync(dir)) return files
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...collectFiles(full, base))
    else files.push(relative(base, full))
  }
  return files
}

function resolveDnsProvider(config?: DnsProviderConfig): { provider: any, useExternal: boolean } {
  if (!config || config.provider === 'route53') {
    return { provider: undefined, useExternal: false }
  }

  if (config.provider === 'porkbun') {
    const apiKey = config.apiKey ?? process.env.PORKBUN_API_KEY
    const secretKey = config.secretKey ?? process.env.PORKBUN_SECRET_KEY ?? process.env.PORKBUN_SECRET_API_KEY
    if (!apiKey || !secretKey) {
      throw new Error(
        'Porkbun API credentials not found. Set PORKBUN_API_KEY and PORKBUN_SECRET_KEY env vars, '
        + 'or pass them via cloudAdapter({ dnsProvider: { provider: "porkbun", apiKey, secretKey } }).',
      )
    }
    return { provider: { provider: 'porkbun', apiKey, secretKey }, useExternal: true }
  }

  if (config.provider === 'godaddy') {
    const apiKey = config.apiKey ?? process.env.GODADDY_API_KEY
    const apiSecret = config.secretKey ?? process.env.GODADDY_API_SECRET
    const environment = config.environment ?? (process.env.GODADDY_ENVIRONMENT as 'production' | 'ote' | undefined)
    if (!apiKey || !apiSecret) {
      throw new Error(
        'GoDaddy API credentials not found. Set GODADDY_API_KEY and GODADDY_API_SECRET env vars, '
        + 'or pass them via cloudAdapter({ dnsProvider: { provider: "godaddy", apiKey, secretKey } }).',
      )
    }
    return { provider: { provider: 'godaddy', apiKey, apiSecret, environment }, useExternal: true }
  }

  throw new Error(`Unknown DNS provider: ${(config as any).provider}. Supported: porkbun, godaddy, route53`)
}

export function cloudAdapter(config: CloudAdapterConfig): DeployAdapter {
  return {
    name: 'cloud',

    async build(buildConfig: AdapterBuildConfig): Promise<AdapterBuildResult> {
      const outDir = buildConfig.outDir
      mkdirSync(outDir, { recursive: true })

      const files = collectFiles(outDir)
      return {
        outputDir: outDir,
        files,
      }
    },

    async deploy(deployConfig: AdapterDeployConfig): Promise<DeployResult> {
      const startTime = Date.now()
      const logs: string[] = []

      try {
        const tsCloud: any = await import('@stacksjs/ts-cloud')

        const { provider: dnsProvider, useExternal } = resolveDnsProvider(config.dnsProvider)
        const sourceDir = deployConfig.outputDir

        logs.push(`Deploying ${config.siteName} to AWS${useExternal ? ` with ${config.dnsProvider!.provider} DNS` : ''}...`)

        const baseConfig: any = {
          siteName: config.siteName,
          region: config.region ?? 'us-east-1',
          domain: config.domain,
          bucket: config.bucket,
          stackName: config.stackName,
          certificateArn: config.certificateArn,
          defaultRootObject: config.defaultRootObject ?? 'index.html',
          errorDocument: config.errorDocument ?? '404.html',
          cacheControl: config.cacheControl,
          tags: config.tags,
          sourceDir,
          cleanBucket: config.cleanBucket,
          onProgress: (stage: string, detail?: string) => {
            const line = detail ? `[${stage}] ${detail}` : `[${stage}]`
            logs.push(line)
            config.onProgress?.(stage, detail)
          },
        }

        let result: any
        if (useExternal && config.domain) {
          if (typeof tsCloud.deployStaticSiteWithExternalDnsFull !== 'function') {
            throw new TypeError('External DNS deployment requires @stacksjs/ts-cloud >= 0.2.3 with deployStaticSiteWithExternalDnsFull export')
          }
          result = await tsCloud.deployStaticSiteWithExternalDnsFull({
            ...baseConfig,
            dnsProvider,
          })
        }
        else if (typeof tsCloud.deployStaticSiteFull === 'function') {
          // Route53 / built-in flow with file upload + cache invalidation
          if (config.dnsProvider && (config.dnsProvider as Route53DnsConfig).provider === 'route53') {
            baseConfig.hostedZoneId = (config.dnsProvider as Route53DnsConfig).hostedZoneId
          }
          result = await tsCloud.deployStaticSiteFull(baseConfig)
        }
        else {
          // Fallback: infrastructure-only deploy when full helper unavailable
          result = await tsCloud.deployStaticSite(baseConfig)
        }

        if (result.stackName) logs.push(`Stack: ${result.stackName}`)
        if (result.bucket) logs.push(`Bucket: ${result.bucket}`)
        if (result.distributionDomain) logs.push(`CDN: ${result.distributionDomain}`)
        if (result.domain) logs.push(`Domain: ${result.domain}`)
        if (typeof result.filesUploaded === 'number') logs.push(`Files uploaded: ${result.filesUploaded}`)
        if (typeof result.filesSkipped === 'number') logs.push(`Files unchanged: ${result.filesSkipped}`)
        if (result.message) logs.push(result.message)

        return {
          success: !!result.success,
          url: result.domain ? `https://${result.domain}` : result.distributionDomain ? `https://${result.distributionDomain}` : undefined,
          deployId: result.stackId,
          logs,
          duration: Date.now() - startTime,
        }
      }
      catch (err: any) {
        logs.push(`Deploy failed: ${err.message}`)
        return {
          success: false,
          logs,
          duration: Date.now() - startTime,
        }
      }
    },
  }
}
