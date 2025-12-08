/**
 * STX Story - Snapshot Management
 * Versioning and diff image generation
 */

import type { StoryContext } from './types'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Snapshot version info
 */
export interface SnapshotVersion {
  /** Version number */
  version: number
  /** Timestamp */
  timestamp: number
  /** Git commit hash (if available) */
  commit?: string
  /** Description */
  description?: string
}

/**
 * Snapshot with version history
 */
export interface VersionedSnapshot {
  /** Current version */
  current: SnapshotVersion
  /** Previous versions */
  history: SnapshotVersion[]
  /** Maximum versions to keep */
  maxVersions: number
}

/**
 * Diff result
 */
export interface DiffResult {
  /** Whether there are differences */
  hasDiff: boolean
  /** Difference percentage (0-100) */
  percentage: number
  /** Diff image path (if generated) */
  diffImagePath?: string
  /** Changed pixels count */
  changedPixels: number
  /** Total pixels */
  totalPixels: number
}

/**
 * Get snapshot directory
 */
export function getSnapshotDir(ctx: StoryContext): string {
  return path.join(ctx.root, '.stx', 'story', 'snapshots')
}

/**
 * Get version file path
 */
function getVersionFilePath(snapshotDir: string, storyId: string): string {
  return path.join(snapshotDir, `${storyId}.versions.json`)
}

/**
 * Load snapshot versions
 */
export async function loadSnapshotVersions(
  ctx: StoryContext,
  storyId: string,
): Promise<VersionedSnapshot | null> {
  const snapshotDir = getSnapshotDir(ctx)
  const versionFile = getVersionFilePath(snapshotDir, storyId)

  try {
    const content = await fs.promises.readFile(versionFile, 'utf-8')
    return JSON.parse(content)
  }
  catch {
    return null
  }
}

/**
 * Save snapshot version
 */
export async function saveSnapshotVersion(
  ctx: StoryContext,
  storyId: string,
  description?: string,
): Promise<SnapshotVersion> {
  const snapshotDir = getSnapshotDir(ctx)
  const versionFile = getVersionFilePath(snapshotDir, storyId)

  // Ensure directory exists
  await fs.promises.mkdir(snapshotDir, { recursive: true })

  // Load existing versions
  let versioned = await loadSnapshotVersions(ctx, storyId)

  if (!versioned) {
    versioned = {
      current: { version: 0, timestamp: 0 },
      history: [],
      maxVersions: 10,
    }
  }

  // Create new version
  const newVersion: SnapshotVersion = {
    version: versioned.current.version + 1,
    timestamp: Date.now(),
    commit: await getGitCommit(ctx.root),
    description,
  }

  // Move current to history
  if (versioned.current.version > 0) {
    versioned.history.unshift(versioned.current)

    // Trim history
    if (versioned.history.length > versioned.maxVersions) {
      versioned.history = versioned.history.slice(0, versioned.maxVersions)
    }
  }

  versioned.current = newVersion

  // Save
  await fs.promises.writeFile(versionFile, JSON.stringify(versioned, null, 2))

  return newVersion
}

/**
 * Get git commit hash
 */
async function getGitCommit(root: string): Promise<string | undefined> {
  try {
    const gitHeadPath = path.join(root, '.git', 'HEAD')
    const head = await fs.promises.readFile(gitHeadPath, 'utf-8')

    if (head.startsWith('ref:')) {
      const refPath = path.join(root, '.git', head.slice(5).trim())
      const commit = await fs.promises.readFile(refPath, 'utf-8')
      return commit.trim().slice(0, 8)
    }

    return head.trim().slice(0, 8)
  }
  catch {
    return undefined
  }
}

/**
 * Restore snapshot to a previous version
 */
export async function restoreSnapshotVersion(
  ctx: StoryContext,
  storyId: string,
  version: number,
): Promise<boolean> {
  const versioned = await loadSnapshotVersions(ctx, storyId)
  if (!versioned)
    return false

  const targetVersion = versioned.history.find(v => v.version === version)
  if (!targetVersion)
    return false

  const snapshotDir = getSnapshotDir(ctx)

  // Copy versioned snapshot to current
  const versionedPath = path.join(snapshotDir, `${storyId}.v${version}.html`)
  const currentPath = path.join(snapshotDir, `${storyId}.html`)

  try {
    await fs.promises.copyFile(versionedPath, currentPath)

    // Update version info
    versioned.current = targetVersion
    const versionFile = getVersionFilePath(snapshotDir, storyId)
    await fs.promises.writeFile(versionFile, JSON.stringify(versioned, null, 2))

    return true
  }
  catch {
    return false
  }
}

/**
 * Generate diff between two HTML snapshots
 * Returns a simple text-based diff (for actual image diff, you'd need canvas/image processing)
 */
export function generateTextDiff(
  oldHtml: string,
  newHtml: string,
): DiffResult {
  const oldLines = oldHtml.split('\n')
  const newLines = newHtml.split('\n')

  let changedLines = 0
  const maxLines = Math.max(oldLines.length, newLines.length)

  for (let i = 0; i < maxLines; i++) {
    if (oldLines[i] !== newLines[i]) {
      changedLines++
    }
  }

  const percentage = maxLines > 0 ? (changedLines / maxLines) * 100 : 0

  return {
    hasDiff: changedLines > 0,
    percentage,
    changedPixels: changedLines,
    totalPixels: maxLines,
  }
}

/**
 * Generate visual diff HTML
 */
export function generateDiffHTML(
  oldHtml: string,
  newHtml: string,
): string {
  const oldLines = oldHtml.split('\n')
  const newLines = newHtml.split('\n')

  const diffLines: string[] = []
  const maxLines = Math.max(oldLines.length, newLines.length)

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i] || ''
    const newLine = newLines[i] || ''

    if (oldLine === newLine) {
      diffLines.push(`<div class="diff-line diff-same">${escapeHtml(oldLine)}</div>`)
    }
    else if (!oldLine) {
      diffLines.push(`<div class="diff-line diff-added">+ ${escapeHtml(newLine)}</div>`)
    }
    else if (!newLine) {
      diffLines.push(`<div class="diff-line diff-removed">- ${escapeHtml(oldLine)}</div>`)
    }
    else {
      diffLines.push(`<div class="diff-line diff-removed">- ${escapeHtml(oldLine)}</div>`)
      diffLines.push(`<div class="diff-line diff-added">+ ${escapeHtml(newLine)}</div>`)
    }
  }

  return `
    <div class="stx-diff-view">
      <div class="diff-content">
        ${diffLines.join('\n')}
      </div>
    </div>
  `
}

/**
 * Get diff styles
 */
export function getDiffStyles(): string {
  return `
    .stx-diff-view {
      font-family: var(--code-font-family);
      font-size: 12px;
      line-height: 1.5;
      overflow: auto;
    }
    .diff-content {
      padding: 12px;
    }
    .diff-line {
      padding: 2px 8px;
      white-space: pre;
    }
    .diff-same {
      color: var(--text);
    }
    .diff-added {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
    }
    .diff-removed {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
  `
}

/**
 * Escape HTML
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * List all snapshot versions for a story
 */
export async function listSnapshotVersions(
  ctx: StoryContext,
  storyId: string,
): Promise<SnapshotVersion[]> {
  const versioned = await loadSnapshotVersions(ctx, storyId)
  if (!versioned)
    return []

  return [versioned.current, ...versioned.history]
}

/**
 * Delete old snapshot versions
 */
export async function pruneSnapshotVersions(
  ctx: StoryContext,
  storyId: string,
  keepCount: number = 5,
): Promise<number> {
  const versioned = await loadSnapshotVersions(ctx, storyId)
  if (!versioned)
    return 0

  const toDelete = versioned.history.slice(keepCount)
  const snapshotDir = getSnapshotDir(ctx)

  let deleted = 0
  for (const version of toDelete) {
    const versionPath = path.join(snapshotDir, `${storyId}.v${version.version}.html`)
    try {
      await fs.promises.unlink(versionPath)
      deleted++
    }
    catch {
      // File doesn't exist
    }
  }

  versioned.history = versioned.history.slice(0, keepCount)
  const versionFile = getVersionFilePath(snapshotDir, storyId)
  await fs.promises.writeFile(versionFile, JSON.stringify(versioned, null, 2))

  return deleted
}
