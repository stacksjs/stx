/**
 * STX Story - Story file scanner
 * Discovers .story.stx files in the project
 */

import type { ServerStoryFile, StoryContext, StoryTreeFile } from '../types'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Scan for story files matching the configured patterns
 */
export async function scanStoryFiles(ctx: StoryContext): Promise<ServerStoryFile[]> {
  const { root, config } = ctx
  const storyFiles: ServerStoryFile[] = []

  // Get all matching files
  const files = await findMatchingFiles(root, config.storyMatch, config.storyIgnored)

  for (const relativePath of files) {
    const absolutePath = path.resolve(root, relativePath)
    const storyFile = createStoryFile(relativePath, absolutePath)
    storyFiles.push(storyFile)
  }

  return storyFiles
}

/**
 * Find files matching glob patterns
 */
async function findMatchingFiles(
  root: string,
  patterns: string[],
  ignored: string[],
): Promise<string[]> {
  const results: string[] = []

  // Simple recursive file finder
  // For production, consider using globby or fast-glob
  async function walkDir(dir: string, baseDir: string): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relativePath = path.relative(baseDir, fullPath)

      // Check if ignored
      if (isIgnored(relativePath, ignored)) {
        continue
      }

      if (entry.isDirectory()) {
        await walkDir(fullPath, baseDir)
      }
      else if (entry.isFile()) {
        // Check if matches any pattern
        if (matchesPatterns(relativePath, patterns)) {
          results.push(relativePath)
        }
      }
    }
  }

  await walkDir(root, root)
  return results
}

/**
 * Check if a path matches any of the ignore patterns
 */
function isIgnored(relativePath: string, ignored: string[]): boolean {
  for (const pattern of ignored) {
    if (matchGlob(relativePath, pattern)) {
      return true
    }
  }
  return false
}

/**
 * Non-component file patterns to filter out
 */
const NON_COMPONENT_PATTERNS = [
  '**/layouts/**',
  '**/pages/**',
  '**/partials/**',
  '**/_*.stx', // Files starting with underscore
  '**/layout.stx',
  '**/page.stx',
  '**/error.stx',
  '**/loading.stx',
]

/**
 * Check if a file is a non-component file (layout, page, partial)
 */
export function isNonComponentFile(relativePath: string): boolean {
  for (const pattern of NON_COMPONENT_PATTERNS) {
    if (matchGlob(relativePath, pattern)) {
      return true
    }
  }
  return false
}

/**
 * Check if a path matches any of the patterns
 */
function matchesPatterns(relativePath: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (matchGlob(relativePath, pattern)) {
      return true
    }
  }
  return false
}

/**
 * Simple glob matching
 * Supports: *, **, ?
 */
function matchGlob(str: string, pattern: string): boolean {
  // Normalize path separators
  const normalizedStr = str.replace(/\\/g, '/')
  const normalizedPattern = pattern.replace(/\\/g, '/')

  // Convert glob to regex
  let regexStr = normalizedPattern
    // Escape special regex chars except * and ?
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    // ** matches any path
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    // * matches anything except /
    .replace(/\*/g, '[^/]*')
    // ? matches single char
    .replace(/\?/g, '.')
    // Restore globstar
    .replace(/\{\{GLOBSTAR\}\}/g, '.*')

  // Anchor the pattern
  regexStr = `^${regexStr}$`

  return new RegExp(regexStr).test(normalizedStr)
}

/**
 * Create a ServerStoryFile from a path
 */
function createStoryFile(relativePath: string, absolutePath: string): ServerStoryFile {
  const fileName = path.basename(relativePath, '.story.stx')

  // Generate ID from path (kebab-case)
  const id = relativePath
    .toLowerCase()
    .replace(/\.story\.stx$/, '')
    .replace(/[/\\]/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const treeFile: StoryTreeFile = {
    title: fileName,
    path: relativePath,
  }

  return {
    id,
    path: absolutePath,
    relativePath,
    fileName,
    treeFile,
  }
}

/**
 * Watch for story file changes
 */
export function watchStoryFiles(
  ctx: StoryContext,
  onChange: (event: 'add' | 'change' | 'unlink', file: ServerStoryFile) => void,
): () => void {
  const { root, config } = ctx
  const watchers: fs.FSWatcher[] = []

  // Watch the root directory recursively
  const watcher = fs.watch(root, { recursive: true }, async (eventType, filename) => {
    if (!filename)
      return

    const relativePath = filename.replace(/\\/g, '/')

    // Check if it's a story file
    if (!matchesPatterns(relativePath, config.storyMatch))
      return
    if (isIgnored(relativePath, config.storyIgnored))
      return

    const absolutePath = path.resolve(root, relativePath)

    // Determine event type
    try {
      await fs.promises.access(absolutePath)
      // File exists
      const storyFile = createStoryFile(relativePath, absolutePath)
      onChange(eventType === 'rename' ? 'add' : 'change', storyFile)
    }
    catch {
      // File was deleted
      const storyFile = createStoryFile(relativePath, absolutePath)
      onChange('unlink', storyFile)
    }
  })

  watchers.push(watcher)

  // Return cleanup function
  return () => {
    for (const w of watchers) {
      w.close()
    }
  }
}
