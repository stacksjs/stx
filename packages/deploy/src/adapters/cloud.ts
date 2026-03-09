import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import type { AdapterBuildConfig, AdapterBuildResult, AdapterDeployConfig, DeployAdapter, DeployResult } from '../types'

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
  /** Error document (default: index.html for SPA) */
  errorDocument?: string
  /** Cache control header for assets */
  cacheControl?: string
  /** Tags for AWS resources */
  tags?: Record<string, string>
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
        const { deployStaticSite } = await import('ts-cloud')

        logs.push(`Deploying ${config.siteName} to AWS...`)

        const result = await deployStaticSite({
          siteName: config.siteName,
          region: config.region ?? 'us-east-1',
          domain: config.domain,
          bucket: config.bucket,
          stackName: config.stackName,
          defaultRootObject: config.defaultRootObject ?? 'index.html',
          errorDocument: config.errorDocument ?? 'index.html',
          cacheControl: config.cacheControl,
          tags: config.tags,
        })

        logs.push(`Stack: ${result.stackName}`)
        logs.push(`Bucket: ${result.bucket}`)
        if (result.distributionDomain) logs.push(`CDN: ${result.distributionDomain}`)
        if (result.domain) logs.push(`Domain: ${result.domain}`)

        return {
          success: result.success,
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
