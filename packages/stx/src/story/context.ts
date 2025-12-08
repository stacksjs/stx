/**
 * STX Story - Context management
 */

import type { ServerStoryFile, ServerTree, StoryConfig, StoryContext } from './types'
import path from 'node:path'
import process from 'node:process'
import { resolveStoryConfig } from './config'

/**
 * Options for creating a story context
 */
export interface CreateContextOptions {
  /** Mode: 'dev' or 'build' */
  mode: 'dev' | 'build'
  /** Root directory (defaults to cwd) */
  root?: string
  /** Story configuration override */
  config?: StoryConfig
}

/**
 * Create a story context
 */
export async function createContext(options: CreateContextOptions): Promise<StoryContext> {
  const root = options.root ?? process.cwd()

  // Load config from stx.config.ts
  let storyConfig: StoryConfig | undefined

  try {
    // Try to import the stx config
    const configPath = path.join(root, 'stx.config.ts')
    const configModule = await import(configPath)
    const config = configModule.default || configModule

    // Extract story config section
    storyConfig = config.story
  }
  catch {
    // Config file doesn't exist or failed to load, use defaults
  }

  // Merge with any provided config override
  const mergedConfig = {
    ...storyConfig,
    ...options.config,
  }

  const resolvedConfig = resolveStoryConfig(mergedConfig)

  return {
    root,
    config: resolvedConfig,
    storyFiles: [],
    tree: undefined,
    mode: options.mode,
  }
}

/**
 * Update context with discovered story files
 */
export function updateContextStoryFiles(
  ctx: StoryContext,
  storyFiles: ServerStoryFile[],
): void {
  ctx.storyFiles = storyFiles
}

/**
 * Update context with built tree
 */
export function updateContextTree(
  ctx: StoryContext,
  tree: ServerTree,
): void {
  ctx.tree = tree
}
