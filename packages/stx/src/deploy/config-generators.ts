/**
 * Configuration generators for deployment platforms
 *
 * Generates platform-specific configuration files like netlify.toml
 */

import fs from 'node:fs'
import path from 'node:path'

// ============================================================================
// Types
// ============================================================================

export interface NetlifyConfig {
  build: {
    command: string
    publish: string
    functions?: string
    edge_functions?: string
    environment?: Record<string, string>
  }
  functions?: {
    directory?: string
    node_bundler?: 'esbuild' | 'nft'
    external_node_modules?: string[]
  }
  edge_functions?: Array<{
    function: string
    path: string
  }>
  redirects?: Array<{
    from: string
    to: string
    status?: number
    force?: boolean
    conditions?: Record<string, string>
  }>
  headers?: Array<{
    for: string
    values: Record<string, string>
  }>
  plugins?: Array<{
    package: string
    inputs?: Record<string, unknown>
  }>
  context?: Record<string, {
    command?: string
    publish?: string
    environment?: Record<string, string>
  }>
}

export interface ProjectConfig {
  framework?: 'stx' | 'static' | 'spa'
  buildCommand?: string
  outputDir?: string
  functionsDir?: string
  edgeFunctionsDir?: string
  nodeVersion?: string
  isSPA?: boolean
}

// ============================================================================
// Netlify TOML Generator
// ============================================================================

/**
 * Generate netlify.toml content from config
 */
export function generateNetlifyToml(config: NetlifyConfig): string {
  const lines: string[] = []

  // Build section
  lines.push('[build]')
  lines.push(`  command = "${escapeTomlString(config.build.command)}"`)
  lines.push(`  publish = "${escapeTomlString(config.build.publish)}"`)

  if (config.build.functions) {
    lines.push(`  functions = "${escapeTomlString(config.build.functions)}"`)
  }

  if (config.build.edge_functions) {
    lines.push(`  edge_functions = "${escapeTomlString(config.build.edge_functions)}"`)
  }

  if (config.build.environment && Object.keys(config.build.environment).length > 0) {
    lines.push('')
    lines.push('[build.environment]')
    for (const [key, value] of Object.entries(config.build.environment)) {
      lines.push(`  ${key} = "${escapeTomlString(value)}"`)
    }
  }

  // Functions section
  if (config.functions) {
    lines.push('')
    lines.push('[functions]')
    if (config.functions.directory) {
      lines.push(`  directory = "${escapeTomlString(config.functions.directory)}"`)
    }
    if (config.functions.node_bundler) {
      lines.push(`  node_bundler = "${config.functions.node_bundler}"`)
    }
    if (config.functions.external_node_modules && config.functions.external_node_modules.length > 0) {
      lines.push(`  external_node_modules = [${config.functions.external_node_modules.map(m => `"${m}"`).join(', ')}]`)
    }
  }

  // Edge functions
  if (config.edge_functions && config.edge_functions.length > 0) {
    lines.push('')
    for (const ef of config.edge_functions) {
      lines.push('[[edge_functions]]')
      lines.push(`  function = "${escapeTomlString(ef.function)}"`)
      lines.push(`  path = "${escapeTomlString(ef.path)}"`)
    }
  }

  // Redirects
  if (config.redirects && config.redirects.length > 0) {
    lines.push('')
    for (const redirect of config.redirects) {
      lines.push('[[redirects]]')
      lines.push(`  from = "${escapeTomlString(redirect.from)}"`)
      lines.push(`  to = "${escapeTomlString(redirect.to)}"`)
      if (redirect.status !== undefined) {
        lines.push(`  status = ${redirect.status}`)
      }
      if (redirect.force !== undefined) {
        lines.push(`  force = ${redirect.force}`)
      }
      if (redirect.conditions && Object.keys(redirect.conditions).length > 0) {
        lines.push('  [redirects.conditions]')
        for (const [key, value] of Object.entries(redirect.conditions)) {
          lines.push(`    ${key} = "${escapeTomlString(value)}"`)
        }
      }
    }
  }

  // Headers
  if (config.headers && config.headers.length > 0) {
    lines.push('')
    for (const header of config.headers) {
      lines.push('[[headers]]')
      lines.push(`  for = "${escapeTomlString(header.for)}"`)
      lines.push('  [headers.values]')
      for (const [key, value] of Object.entries(header.values)) {
        lines.push(`    ${key} = "${escapeTomlString(value)}"`)
      }
    }
  }

  // Plugins
  if (config.plugins && config.plugins.length > 0) {
    lines.push('')
    for (const plugin of config.plugins) {
      lines.push('[[plugins]]')
      lines.push(`  package = "${escapeTomlString(plugin.package)}"`)
      if (plugin.inputs && Object.keys(plugin.inputs).length > 0) {
        lines.push('  [plugins.inputs]')
        for (const [key, value] of Object.entries(plugin.inputs)) {
          if (typeof value === 'string') {
            lines.push(`    ${key} = "${escapeTomlString(value)}"`)
          } else if (typeof value === 'boolean' || typeof value === 'number') {
            lines.push(`    ${key} = ${value}`)
          }
        }
      }
    }
  }

  // Context-specific configs
  if (config.context && Object.keys(config.context).length > 0) {
    for (const [contextName, contextConfig] of Object.entries(config.context)) {
      lines.push('')
      lines.push(`[context.${contextName}]`)
      if (contextConfig.command) {
        lines.push(`  command = "${escapeTomlString(contextConfig.command)}"`)
      }
      if (contextConfig.publish) {
        lines.push(`  publish = "${escapeTomlString(contextConfig.publish)}"`)
      }
      if (contextConfig.environment && Object.keys(contextConfig.environment).length > 0) {
        lines.push(`  [context.${contextName}.environment]`)
        for (const [key, value] of Object.entries(contextConfig.environment)) {
          lines.push(`    ${key} = "${escapeTomlString(value)}"`)
        }
      }
    }
  }

  return lines.join('\n') + '\n'
}

/**
 * Escape special characters in TOML strings
 */
function escapeTomlString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

// ============================================================================
// Project Detection
// ============================================================================

/**
 * Detect project configuration from filesystem
 */
export async function detectProjectConfig(directory: string): Promise<ProjectConfig> {
  const config: ProjectConfig = {
    framework: 'stx',
    buildCommand: 'bun run build',
    outputDir: 'dist',
  }

  // Check for package.json
  const packageJsonPath = path.join(directory, 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(await Bun.file(packageJsonPath).text())

      // Check for build script
      if (packageJson.scripts?.build) {
        config.buildCommand = 'bun run build'
      }

      // Check for stx dependency
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      }

      if (deps['@stacksjs/stx'] || deps.stx) {
        config.framework = 'stx'
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Check for stx.config.ts
  const stxConfigPath = path.join(directory, 'stx.config.ts')
  const stxConfigAltPath = path.join(directory, '.config', 'stx.config.ts')

  if (fs.existsSync(stxConfigPath) || fs.existsSync(stxConfigAltPath)) {
    config.framework = 'stx'
  }

  // Check for output directories
  const possibleOutputDirs = ['dist', 'build', 'out', 'public', '.output']
  for (const dir of possibleOutputDirs) {
    const fullPath = path.join(directory, dir)
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      config.outputDir = dir
      break
    }
  }

  // Check for functions directory
  const possibleFunctionsDirs = ['functions', 'netlify/functions', 'api']
  for (const dir of possibleFunctionsDirs) {
    const fullPath = path.join(directory, dir)
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      config.functionsDir = dir
      break
    }
  }

  // Check for edge functions
  const edgeFunctionsDir = path.join(directory, 'netlify', 'edge-functions')
  if (fs.existsSync(edgeFunctionsDir)) {
    config.edgeFunctionsDir = 'netlify/edge-functions'
  }

  // Check if it's a SPA (has index.html but no other HTML files in root)
  const distPath = path.join(directory, config.outputDir || 'dist')
  if (fs.existsSync(distPath)) {
    const hasIndexHtml = fs.existsSync(path.join(distPath, 'index.html'))
    const htmlFiles = fs.readdirSync(distPath).filter(f => f.endsWith('.html'))
    config.isSPA = hasIndexHtml && htmlFiles.length === 1
  }

  return config
}

/**
 * Generate default Netlify config for an stx project
 */
export function createDefaultNetlifyConfig(projectConfig: ProjectConfig = {}): NetlifyConfig {
  const config: NetlifyConfig = {
    build: {
      command: projectConfig.buildCommand || 'bun run build',
      publish: projectConfig.outputDir || 'dist',
    },
  }

  // Add functions directory if detected
  if (projectConfig.functionsDir) {
    config.build.functions = projectConfig.functionsDir
    config.functions = {
      directory: projectConfig.functionsDir,
      node_bundler: 'esbuild',
    }
  }

  // Add edge functions if detected
  if (projectConfig.edgeFunctionsDir) {
    config.build.edge_functions = projectConfig.edgeFunctionsDir
  }

  // Default security headers
  config.headers = [
    {
      for: '/*',
      values: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    },
    {
      for: '/assets/*',
      values: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  ]

  // SPA fallback redirect
  if (projectConfig.isSPA !== false) {
    config.redirects = [
      {
        from: '/*',
        to: '/index.html',
        status: 200,
      },
    ]
  }

  // Production context with NODE_ENV
  config.context = {
    production: {
      environment: {
        NODE_ENV: 'production',
      },
    },
    'deploy-preview': {
      environment: {
        NODE_ENV: 'development',
      },
    },
  }

  return config
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Write netlify.toml to a directory
 */
export async function writeNetlifyConfig(
  directory: string,
  config?: NetlifyConfig
): Promise<string> {
  const projectConfig = await detectProjectConfig(directory)
  const netlifyConfig = config || createDefaultNetlifyConfig(projectConfig)
  const content = generateNetlifyToml(netlifyConfig)
  const filePath = path.join(directory, 'netlify.toml')

  await Bun.write(filePath, content)

  return filePath
}

/**
 * Check if netlify.toml exists
 */
export function hasNetlifyConfig(directory: string): boolean {
  return fs.existsSync(path.join(directory, 'netlify.toml'))
}

/**
 * Read existing netlify.toml (basic parsing)
 */
export async function readNetlifyConfig(directory: string): Promise<string | null> {
  const filePath = path.join(directory, 'netlify.toml')
  if (!fs.existsSync(filePath)) {
    return null
  }
  return Bun.file(filePath).text()
}
