/**
 * Netlify API Client for STX deployments
 *
 * Handles all communication with Netlify's REST API for deploying
 * static sites and edge functions.
 */

const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1'

// ============================================================================
// Types
// ============================================================================

export interface NetlifySite {
  id: string
  name: string
  url: string
  ssl_url: string
  admin_url: string
  created_at: string
  updated_at: string
  custom_domain?: string
  default_domain: string
  deploy_url: string
  published_deploy?: NetlifyDeploy
}

export interface NetlifyDeploy {
  id: string
  site_id: string
  state: 'new' | 'pending_review' | 'uploading' | 'uploaded' | 'preparing' | 'prepared' | 'processing' | 'ready' | 'error' | 'retrying'
  name: string
  url: string
  ssl_url: string
  admin_url: string
  deploy_url: string
  deploy_ssl_url: string
  created_at: string
  updated_at: string
  published_at?: string
  title?: string
  context: string
  branch?: string
  commit_ref?: string
  commit_url?: string
  review_url?: string
  error_message?: string
  required: string[]
  required_functions?: string[]
}

export interface CreateDeployOptions {
  title?: string
  branch?: string
  draft?: boolean
  files: Record<string, string> // path -> sha1 hash
  functions?: Record<string, string>
  async?: boolean
}

export interface DeployFile {
  path: string
  content: ArrayBuffer | Uint8Array
  sha1: string
}

export interface NetlifyClientConfig {
  token: string
  baseUrl?: string
}

export interface NetlifyError extends Error {
  status: number
  code?: string
  details?: unknown
}

// ============================================================================
// Netlify Client
// ============================================================================

export interface NetlifyClient {
  // Site management
  getSite(siteId: string): Promise<NetlifySite>
  listSites(): Promise<NetlifySite[]>
  createSite(name?: string): Promise<NetlifySite>

  // Deployments
  createDeploy(siteId: string, options: CreateDeployOptions): Promise<NetlifyDeploy>
  uploadFile(deployId: string, path: string, content: ArrayBuffer | Uint8Array): Promise<void>
  uploadFiles(deployId: string, files: DeployFile[]): Promise<void>

  // Status
  getDeploy(deployId: string): Promise<NetlifyDeploy>
  waitForDeploy(deployId: string, options?: WaitOptions): Promise<NetlifyDeploy>
  lockDeploy(deployId: string): Promise<NetlifyDeploy>
  unlockDeploy(deployId: string): Promise<NetlifyDeploy>
}

export interface WaitOptions {
  timeout?: number
  pollInterval?: number
  onProgress?: (deploy: NetlifyDeploy) => void
}

/**
 * Create a Netlify API client
 */
export function createNetlifyClient(config: NetlifyClientConfig): NetlifyClient {
  const { token, baseUrl = NETLIFY_API_BASE } = config

  async function request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown
      contentType?: string
      rawBody?: ArrayBuffer | Uint8Array
    } = {}
  ): Promise<T> {
    const url = `${baseUrl}${path}`
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'stx-deploy/1.0',
    }

    let body: BodyInit | undefined

    if (options.rawBody) {
      headers['Content-Type'] = options.contentType || 'application/octet-stream'
      body = options.rawBody
    } else if (options.body) {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(options.body)
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
    })

    if (!response.ok) {
      const error = new Error(`Netlify API error: ${response.status} ${response.statusText}`) as NetlifyError
      error.status = response.status

      try {
        const data = await response.json() as { message?: string; code?: string }
        error.message = data.message || error.message
        error.code = data.code
        error.details = data
      } catch {
        // Ignore JSON parse errors
      }

      throw error
    }

    // Handle empty responses
    const text = await response.text()
    if (!text) {
      return {} as T
    }

    return JSON.parse(text) as T
  }

  return {
    // ========================================================================
    // Site Management
    // ========================================================================

    async getSite(siteId: string): Promise<NetlifySite> {
      return request<NetlifySite>('GET', `/sites/${siteId}`)
    },

    async listSites(): Promise<NetlifySite[]> {
      return request<NetlifySite[]>('GET', '/sites')
    },

    async createSite(name?: string): Promise<NetlifySite> {
      const body: Record<string, unknown> = {}
      if (name) {
        body.name = name
      }
      return request<NetlifySite>('POST', '/sites', { body })
    },

    // ========================================================================
    // Deployments
    // ========================================================================

    async createDeploy(siteId: string, options: CreateDeployOptions): Promise<NetlifyDeploy> {
      const body: Record<string, unknown> = {
        files: options.files,
        draft: options.draft ?? true,
        async: options.async ?? true,
      }

      if (options.title) {
        body.title = options.title
      }

      if (options.branch) {
        body.branch = options.branch
      }

      if (options.functions) {
        body.functions = options.functions
      }

      return request<NetlifyDeploy>('POST', `/sites/${siteId}/deploys`, { body })
    },

    async uploadFile(deployId: string, path: string, content: ArrayBuffer | Uint8Array): Promise<void> {
      // Normalize path - remove leading slash
      const normalizedPath = path.startsWith('/') ? path.slice(1) : path

      await request<void>('PUT', `/deploys/${deployId}/files/${normalizedPath}`, {
        rawBody: content,
        contentType: 'application/octet-stream',
      })
    },

    async uploadFiles(deployId: string, files: DeployFile[]): Promise<void> {
      // Upload files with concurrency limit
      const CONCURRENCY = 5
      const queue = [...files]

      const uploadNext = async (): Promise<void> => {
        while (queue.length > 0) {
          const file = queue.shift()
          if (file) {
            await this.uploadFile(deployId, file.path, file.content)
          }
        }
      }

      // Run concurrent uploads
      const workers = Array.from({ length: Math.min(CONCURRENCY, files.length) }, () => uploadNext())
      await Promise.all(workers)
    },

    // ========================================================================
    // Status & Locking
    // ========================================================================

    async getDeploy(deployId: string): Promise<NetlifyDeploy> {
      return request<NetlifyDeploy>('GET', `/deploys/${deployId}`)
    },

    async waitForDeploy(deployId: string, options: WaitOptions = {}): Promise<NetlifyDeploy> {
      const {
        timeout = 300000, // 5 minutes
        pollInterval = 2000, // 2 seconds
        onProgress,
      } = options

      const startTime = Date.now()

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const deploy = await this.getDeploy(deployId)

        if (onProgress) {
          onProgress(deploy)
        }

        // Check terminal states
        if (deploy.state === 'ready') {
          return deploy
        }

        if (deploy.state === 'error') {
          const error = new Error(`Deploy failed: ${deploy.error_message || 'Unknown error'}`) as NetlifyError
          error.status = 500
          error.details = deploy
          throw error
        }

        // Check timeout
        if (Date.now() - startTime > timeout) {
          const error = new Error(`Deploy timed out after ${timeout}ms`) as NetlifyError
          error.status = 408
          error.details = deploy
          throw error
        }

        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, pollInterval))
      }
    },

    async lockDeploy(deployId: string): Promise<NetlifyDeploy> {
      return request<NetlifyDeploy>('POST', `/deploys/${deployId}/lock`)
    },

    async unlockDeploy(deployId: string): Promise<NetlifyDeploy> {
      return request<NetlifyDeploy>('POST', `/deploys/${deployId}/unlock`)
    },
  }
}

// ============================================================================
// File Utilities
// ============================================================================

/**
 * Calculate SHA1 hash of file content
 */
export async function calculateSha1(content: ArrayBuffer | Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-1', content)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Collect files from a directory for deployment
 */
export async function collectDeployFiles(
  directory: string,
  options: { ignore?: string[] } = {}
): Promise<DeployFile[]> {
  const { ignore = ['node_modules', '.git', '.env*', '*.map'] } = options
  const files: DeployFile[] = []

  const glob = new Bun.Glob('**/*')

  for await (const relativePath of glob.scan({
    cwd: directory,
    onlyFiles: true,
    dot: false,
  })) {
    // Check ignore patterns
    const shouldIgnore = ignore.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`)
        return regex.test(relativePath)
      }
      return relativePath.includes(pattern)
    })

    if (shouldIgnore) {
      continue
    }

    const fullPath = `${directory}/${relativePath}`
    const file = Bun.file(fullPath)
    const content = await file.arrayBuffer()
    const sha1 = await calculateSha1(content)

    files.push({
      path: relativePath,
      content: new Uint8Array(content),
      sha1,
    })
  }

  return files
}

/**
 * Create file manifest (path -> sha1 hash mapping)
 */
export function createFileManifest(files: DeployFile[]): Record<string, string> {
  const manifest: Record<string, string> = {}
  for (const file of files) {
    // Netlify expects paths with leading slash
    manifest[`/${file.path}`] = file.sha1
  }
  return manifest
}

/**
 * Filter files that need uploading (not already on Netlify)
 */
export function filterRequiredFiles(files: DeployFile[], required: string[]): DeployFile[] {
  const requiredSet = new Set(required.map(p => p.startsWith('/') ? p.slice(1) : p))
  return files.filter(f => requiredSet.has(f.path))
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format file size for display
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

/**
 * Get total size of files
 */
export function getTotalSize(files: DeployFile[]): number {
  return files.reduce((sum, f) => sum + f.content.byteLength, 0)
}
