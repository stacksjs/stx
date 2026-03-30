/**
 * Template Compiler
 *
 * Pre-compiles .stx templates at build time by running the full processDirectives
 * pipeline with a recording context. Dynamic expressions that can't be evaluated
 * at build time are replaced with placeholder tokens.
 *
 * @module template-compiler
 */

import path from 'node:path'
import { processDirectives } from './process'
import { defaultConfig, loadStxConfig } from './config'
import { extractVariables } from './variable-extractor'
import { createPlaceholder, resetPlaceholders, getPlaceholderRegistry, type PlaceholderMap } from './placeholder'
import { stripDocumentWrapper } from './app-shell'
import { createHash } from 'node:crypto'

/**
 * A pre-compiled template ready for serve-time hydration.
 */
export interface CompiledTemplate {
  /** The route this template serves */
  route: string
  /** Source file path */
  sourceFile: string
  /** Pre-rendered HTML (with placeholders for dynamic content) */
  html: string
  /** SPA fragment (main content only, no document wrapper) */
  fragment: string
  /** Map of placeholder tokens to their original expressions */
  placeholders: PlaceholderMap
  /** Whether this page has server scripts that need request-time execution */
  hasServerScripts: boolean
  /** Raw server script content (for serve-time execution) */
  serverScriptContent: string[]
  /** All file dependencies (for cache invalidation) */
  dependencies: string[]
  /** Content hash of the source file */
  contentHash: string
}

/**
 * Create a recording context proxy that tracks which variables were accessed
 * but had no value. These become placeholder candidates.
 */
function createRecordingContext(baseContext: Record<string, any> = {}): {
  context: Record<string, any>
  accessedKeys: Set<string>
} {
  const accessedKeys = new Set<string>()

  const context = new Proxy(baseContext, {
    get(target, prop: string) {
      if (prop in target) {
        return target[prop]
      }
      // Record the access — this key was requested but doesn't exist
      if (typeof prop === 'string' && !prop.startsWith('__')) {
        accessedKeys.add(prop)
      }
      return undefined
    },
    has(target, prop: string) {
      if (prop in target) return true
      if (typeof prop === 'string' && !prop.startsWith('__')) {
        accessedKeys.add(prop)
      }
      return false
    },
  })

  return { context, accessedKeys }
}

/**
 * Compile a single .stx template file.
 *
 * Runs the full processDirectives pipeline in build mode ('compile'),
 * producing pre-rendered HTML with placeholder tokens for dynamic content.
 *
 * @param filePath - Absolute path to the .stx file
 * @param route - The URL route this page serves (e.g. '/jobs')
 * @param options - Additional compilation options
 */
export async function compileTemplate(
  filePath: string,
  route: string,
  options: {
    componentsDir?: string
    partialsDir?: string
    layoutsDir?: string
    debug?: boolean
  } = {},
): Promise<CompiledTemplate> {
  const absolutePath = path.resolve(filePath)
  const content = await Bun.file(absolutePath).text()
  const contentHash = createHash('sha256').update(content).digest('hex').slice(0, 16)

  // Reset placeholder counter for deterministic output
  resetPlaceholders()

  // Load project config
  let projectConfig: Record<string, any> = {}
  try {
    projectConfig = await loadStxConfig()
  }
  catch {
    // No config file — use defaults
  }

  // Extract server scripts for serve-time execution
  const serverScriptContent: string[] = []
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
  let scriptMatch: RegExpExecArray | null
  while ((scriptMatch = scriptRegex.exec(content)) !== null) {
    const attrs = scriptMatch[1]
    if (/\bserver\b/.test(attrs)) {
      serverScriptContent.push(scriptMatch[2])
    }
  }

  // Create a recording context — server scripts are NOT executed at build time
  // (they may depend on request data like session, DB queries, etc.)
  const { context } = createRecordingContext({
    __filename: absolutePath,
    __dirname: path.dirname(absolutePath),
  })

  // Track dependencies
  const dependencies = new Set<string>()

  // Build the options for processDirectives
  const opts = {
    ...defaultConfig,
    ...projectConfig,
    ...options,
    buildMode: 'compile' as const,
    strict: false,
  }

  // Run the full pipeline in compile mode
  const html = await processDirectives(content, context, absolutePath, opts, dependencies)

  // Extract the SPA fragment (content inside <main> or the body without document wrapper)
  const fragment = stripDocumentWrapper(html)

  // Build placeholder map from the registry (populated during processDirectives)
  // The registry stores each token → expression mapping when createPlaceholder() is called
  const placeholders = getPlaceholderRegistry()

  return {
    route,
    sourceFile: filePath,
    html,
    fragment,
    placeholders,
    hasServerScripts: serverScriptContent.length > 0,
    serverScriptContent,
    dependencies: Array.from(dependencies),
    contentHash,
  }
}
