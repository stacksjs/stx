/**
 * STX Deploy Module
 *
 * One-command deployment to Netlify and other platforms.
 */

import fs from 'node:fs'
import path from 'node:path'
import {
  createNetlifyClient,
  collectDeployFiles,
  createFileManifest,
  filterRequiredFiles,
  formatSize,
  getTotalSize,
  type NetlifyClient,
  type NetlifyDeploy,
  type DeployFile,
} from './netlify'
import {
  detectProjectConfig,
  createDefaultNetlifyConfig,
  generateNetlifyToml,
  writeNetlifyConfig,
  hasNetlifyConfig,
} from './config-generators'

// ============================================================================
// Types
// ============================================================================

export interface DeployConfig {
  /** Directory containing built files (default: 'dist') */
  directory?: string
  /** Netlify site ID */
  siteId?: string
  /** Netlify auth token */
  token?: string
  /** Deploy to production (default: draft) */
  production?: boolean
  /** Deploy message/title */
  message?: string
  /** Run build before deploy */
  build?: boolean
  /** Open URL after deploy */
  open?: boolean
  /** Preview without deploying */
  dryRun?: boolean
  /** Functions directory */
  functions?: string
  /** Working directory (project root) */
  cwd?: string
  /** Progress callback */
  onProgress?: (status: DeployProgress) => void
}

export interface DeployProgress {
  stage: 'build' | 'collect' | 'upload' | 'process' | 'done' | 'error'
  message: string
  percent?: number
  details?: unknown
}

export interface DeployResult {
  success: boolean
  /** Deploy preview URL */
  url: string
  /** Production site URL */
  siteUrl?: string
  /** Deploy ID */
  deployId: string
  /** Log messages */
  logs: string[]
  /** Deploy duration in ms */
  duration: number
  /** Number of files uploaded */
  filesUploaded: number
  /** Total size uploaded */
  totalSize: number
}

export interface InitConfig {
  /** Project directory */
  directory?: string
  /** Site ID to save */
  siteId?: string
  /** Create new site */
  createSite?: boolean
  /** Site name for new site */
  siteName?: string
}

// ============================================================================
// Main Deploy Function
// ============================================================================

/**
 * Deploy to Netlify
 */
export async function deploy(config: DeployConfig = {}): Promise<DeployResult> {
  const startTime = Date.now()
  const logs: string[] = []
  const cwd = config.cwd || process.cwd()

  const log = (msg: string) => {
    logs.push(msg)
  }

  const progress = (status: DeployProgress) => {
    if (config.onProgress) {
      config.onProgress(status)
    }
  }

  // Resolve configuration
  const directory = path.resolve(cwd, config.directory || 'dist')
  const token = config.token || process.env.NETLIFY_AUTH_TOKEN
  const siteId = config.siteId || process.env.NETLIFY_SITE_ID

  // Validate token
  if (!token) {
    throw new DeployError(
      'No Netlify auth token found.\n\n' +
      'To deploy to Netlify:\n' +
      '1. Create account at https://app.netlify.com\n' +
      '2. Get token at https://app.netlify.com/user/applications#personal-access-tokens\n' +
      '3. Set NETLIFY_AUTH_TOKEN environment variable\n\n' +
      '   export NETLIFY_AUTH_TOKEN=your_token_here',
      'NO_TOKEN'
    )
  }

  // Validate site ID
  if (!siteId) {
    throw new DeployError(
      'No Netlify site ID found.\n\n' +
      'Either:\n' +
      '1. Set NETLIFY_SITE_ID environment variable\n' +
      '2. Pass --site-id option\n' +
      '3. Run `stx deploy --init` to set up\n\n' +
      'Find your site ID at: https://app.netlify.com/sites/YOUR_SITE/settings/general',
      'NO_SITE_ID'
    )
  }

  // Validate directory exists
  if (!fs.existsSync(directory)) {
    throw new DeployError(
      `Build directory not found: ${directory}\n\n` +
      'Run `stx build` first or specify a different directory with --directory',
      'NO_BUILD_DIR'
    )
  }

  // Check for files
  const hasFiles = fs.readdirSync(directory).length > 0
  if (!hasFiles) {
    throw new DeployError(
      `Build directory is empty: ${directory}\n\n` +
      'Run `stx build` to generate files',
      'EMPTY_BUILD_DIR'
    )
  }

  // Dry run mode
  if (config.dryRun) {
    progress({ stage: 'collect', message: 'Collecting files...' })

    const files = await collectDeployFiles(directory)
    const totalSize = getTotalSize(files)

    log(`Would deploy ${files.length} files (${formatSize(totalSize)})`)
    log(`From: ${directory}`)
    log(`To: Site ${siteId}`)
    log(`Mode: ${config.production ? 'production' : 'draft'}`)

    return {
      success: true,
      url: `https://${siteId}.netlify.app (dry-run)`,
      deployId: 'dry-run',
      logs,
      duration: Date.now() - startTime,
      filesUploaded: files.length,
      totalSize,
    }
  }

  // Create Netlify client
  const client = createNetlifyClient({ token })

  // Verify site exists
  progress({ stage: 'collect', message: 'Verifying site...' })
  try {
    const site = await client.getSite(siteId)
    log(`Deploying to: ${site.name} (${site.url})`)
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      throw new DeployError(
        `Site not found: ${siteId}\n\n` +
        'Check your site ID or create a new site at https://app.netlify.com',
        'SITE_NOT_FOUND'
      )
    }
    throw error
  }

  // Collect files
  progress({ stage: 'collect', message: 'Collecting files...' })
  const files = await collectDeployFiles(directory)
  const totalSize = getTotalSize(files)
  log(`Found ${files.length} files (${formatSize(totalSize)})`)

  if (files.length === 0) {
    throw new DeployError(
      `No files found in ${directory}`,
      'NO_FILES'
    )
  }

  // Create file manifest
  const manifest = createFileManifest(files)

  // Create deploy
  progress({ stage: 'upload', message: 'Creating deploy...', percent: 0 })
  const deployResponse = await client.createDeploy(siteId, {
    title: config.message || `Deploy from stx CLI`,
    draft: !config.production,
    files: manifest,
  })

  log(`Created deploy: ${deployResponse.id}`)

  // Upload required files
  const requiredFiles = filterRequiredFiles(files, deployResponse.required || [])
  log(`Uploading ${requiredFiles.length} files...`)

  if (requiredFiles.length > 0) {
    let uploaded = 0
    const uploadSize = getTotalSize(requiredFiles)

    for (const file of requiredFiles) {
      await client.uploadFile(deployResponse.id, file.path, file.content)
      uploaded++

      const percent = Math.round((uploaded / requiredFiles.length) * 100)
      progress({
        stage: 'upload',
        message: `Uploading: ${file.path}`,
        percent,
        details: { uploaded, total: requiredFiles.length },
      })
    }

    log(`Uploaded ${formatSize(uploadSize)}`)
  } else {
    log('All files already on CDN (no upload needed)')
  }

  // Wait for deploy to process
  progress({ stage: 'process', message: 'Processing deploy...' })
  const finalDeploy = await client.waitForDeploy(deployResponse.id, {
    onProgress: (deploy) => {
      progress({
        stage: 'process',
        message: `Status: ${deploy.state}`,
        details: deploy,
      })
    },
  })

  // Success!
  const duration = Date.now() - startTime
  progress({ stage: 'done', message: 'Deploy complete!' })

  log(`Deploy complete in ${(duration / 1000).toFixed(1)}s`)
  log(`URL: ${finalDeploy.deploy_ssl_url}`)

  if (config.production) {
    log(`Site: ${finalDeploy.ssl_url}`)
  }

  // Open in browser
  if (config.open) {
    const url = config.production ? finalDeploy.ssl_url : finalDeploy.deploy_ssl_url
    openUrl(url)
  }

  return {
    success: true,
    url: finalDeploy.deploy_ssl_url,
    siteUrl: config.production ? finalDeploy.ssl_url : undefined,
    deployId: finalDeploy.id,
    logs,
    duration,
    filesUploaded: requiredFiles.length,
    totalSize: getTotalSize(requiredFiles),
  }
}

// ============================================================================
// Init Command
// ============================================================================

/**
 * Initialize Netlify configuration for a project
 */
export async function initNetlify(config: InitConfig = {}): Promise<{
  configPath: string
  siteId?: string
}> {
  const directory = config.directory || process.cwd()

  // Generate netlify.toml if it doesn't exist
  let configPath: string

  if (hasNetlifyConfig(directory)) {
    configPath = path.join(directory, 'netlify.toml')
  } else {
    const projectConfig = await detectProjectConfig(directory)
    configPath = await writeNetlifyConfig(directory, createDefaultNetlifyConfig(projectConfig))
  }

  // Save site ID to .env.local if provided
  if (config.siteId) {
    const envPath = path.join(directory, '.env.local')
    let envContent = ''

    if (fs.existsSync(envPath)) {
      envContent = await Bun.file(envPath).text()
      // Remove existing NETLIFY_SITE_ID
      envContent = envContent
        .split('\n')
        .filter(line => !line.startsWith('NETLIFY_SITE_ID='))
        .join('\n')
      if (envContent && !envContent.endsWith('\n')) {
        envContent += '\n'
      }
    }

    envContent += `NETLIFY_SITE_ID=${config.siteId}\n`
    await Bun.write(envPath, envContent)
  }

  return {
    configPath,
    siteId: config.siteId,
  }
}

// ============================================================================
// Error Handling
// ============================================================================

export class DeployError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'DeployError'
    this.code = code
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Open URL in default browser
 */
function openUrl(url: string): void {
  const platform = process.platform
  const command = platform === 'darwin'
    ? 'open'
    : platform === 'win32'
      ? 'start'
      : 'xdg-open'

  Bun.spawn([command, url], {
    stdio: ['ignore', 'ignore', 'ignore'],
  })
}

// ============================================================================
// Re-exports
// ============================================================================

export {
  createNetlifyClient,
  collectDeployFiles,
  createFileManifest,
  filterRequiredFiles,
  formatSize,
  getTotalSize,
  calculateSha1,
} from './netlify'

export {
  generateNetlifyToml,
  detectProjectConfig,
  createDefaultNetlifyConfig,
  writeNetlifyConfig,
  hasNetlifyConfig,
} from './config-generators'

export type {
  NetlifyClient,
  NetlifySite,
  NetlifyDeploy,
  DeployFile,
  NetlifyConfig,
  ProjectConfig,
} from './netlify'

export type {
  NetlifyConfig as NetlifyTomlConfig,
} from './config-generators'
