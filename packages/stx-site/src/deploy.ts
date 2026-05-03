import { existsSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { deployStaticSiteWithExternalDnsFull } from '@stacksjs/ts-cloud'
import type { DeployOptions, DeployResult } from './types'

/**
 * Deploy a built stx site to AWS (S3 + CloudFront + ACM) with DNS managed
 * by Porkbun. Defaults to non-SPA error handling so /favicon.ico /robots.txt
 * /sitemap.xml don't masquerade as the homepage.
 */
export async function deploySite(options: DeployOptions): Promise<DeployResult> {
  const start = Date.now()
  const outDir = options.outDir ?? 'dist'

  if (!existsSync(join(outDir, 'index.html')))
    return fail(start, `${outDir}/ has no index.html — run buildSite first.`)

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
    return fail(start, 'Missing AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in env.')

  const dnsConfig = resolveDnsProvider(options.dnsProvider)
  if ('error' in dnsConfig)
    return fail(start, dnsConfig.error)

  const result = await deployStaticSiteWithExternalDnsFull({
    siteName: options.siteName,
    region: options.region ?? 'us-east-1',
    domain: options.domain,
    stackName: options.stackName,
    defaultRootObject: 'index.html',
    errorDocument: '404.html',
    cacheControl: options.cacheControl ?? 'max-age=3600, public',
    sourceDir: outDir,
    cleanBucket: options.cleanBucket ?? false,
    singlePageApp: options.singlePageApp ?? false,
    dnsProvider: dnsConfig,
    tags: {
      Project: options.siteName,
      Environment: 'production',
      ManagedBy: 'stx-site',
      ...options.tags,
    },
    onProgress(stage, detail) {
      console.log(`[${stage}] ${detail ?? ''}`)
    },
  })

  return {
    success: !!result.success,
    domain: result.domain,
    url: result.domain ? `https://${result.domain}` : result.distributionDomain ? `https://${result.distributionDomain}` : undefined,
    bucket: result.bucket,
    distributionDomain: result.distributionDomain,
    filesUploaded: result.filesUploaded,
    filesSkipped: result.filesSkipped,
    message: result.message,
    durationMs: Date.now() - start,
  }
}

function resolveDnsProvider(input?: DeployOptions['dnsProvider']): { provider: 'porkbun', apiKey: string, secretKey: string } | { error: string } {
  const config = typeof input === 'string' || input == null
    ? { provider: 'porkbun' as const }
    : input

  if (config.provider !== 'porkbun')
    return { error: `Unsupported DNS provider: ${(config as any).provider}` }

  const apiKey = config.apiKey ?? process.env.PORKBUN_API_KEY
  const secretKey = config.secretKey ?? process.env.PORKBUN_SECRET_KEY ?? process.env.PORKBUN_SECRET_API_KEY

  if (!apiKey || !secretKey)
    return { error: 'Missing PORKBUN_API_KEY / PORKBUN_SECRET_KEY in env.' }

  return { provider: 'porkbun', apiKey, secretKey }
}

function fail(start: number, message: string): DeployResult {
  console.error(message)
  return {
    success: false,
    message,
    durationMs: Date.now() - start,
  }
}
