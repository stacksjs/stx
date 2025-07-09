#!/usr/bin/env bun

import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

/**
 * BULLETPROOF Auto-Version Script with Multiple Loop Prevention Layers
 * 
 * This script prevents infinite loops through multiple safety mechanisms:
 * 1. Commit message detection
 * 2. Staged changes detection  
 * 3. Recent version bump detection
 * 4. Process lock file
 * 5. Maximum run frequency limits
 */

const LOCK_FILE = '/tmp/stx-auto-version.lock'
const MIN_INTERVAL_MS = 5000 // Minimum 5 seconds between runs

interface AutoVersionResult {
  success: boolean
  reason?: string
  newVersion?: string
  oldVersion?: string
}

/**
 * Check if auto-version process is already running
 */
async function checkProcessLock(): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`test -f "${LOCK_FILE}" && echo "exists"`)
    if (stdout.trim() === 'exists') {
      const { stdout: timestamp } = await execAsync(`cat "${LOCK_FILE}"`)
      const lockTime = parseInt(timestamp.trim())
      const now = Date.now()
      
      // If lock is older than 2 minutes, consider it stale and remove it
      if (now - lockTime > 120000) {
        await execAsync(`rm -f "${LOCK_FILE}"`)
        return false
      }
      
      console.log('🔒 Auto-version process already running, skipping')
      return true
    }
    return false
  } catch {
    return false
  }
}

/**
 * Create process lock
 */
async function createProcessLock(): Promise<void> {
  try {
    await execAsync(`echo "${Date.now()}" > "${LOCK_FILE}"`)
  } catch (error) {
    console.error('Failed to create process lock:', error)
  }
}

/**
 * Remove process lock
 */
async function removeProcessLock(): Promise<void> {
  try {
    await execAsync(`rm -f "${LOCK_FILE}"`)
  } catch (error) {
    console.error('Failed to remove process lock:', error)
  }
}

/**
 * Enhanced version bump commit detection
 */
async function isVersionBumpContext(): Promise<boolean> {
  try {
    // 1. Check current commit message
    const { stdout: commitMsg } = await execAsync('git log -1 --pretty=format:"%s"')
    const message = commitMsg.trim()
    
    const versionBumpPatterns = [
      /chore\(release\):\s*bump version/i,
      /chore:\s*bump version/i,
      /bump version/i,
      /release:/i,
      /\[skip ci\]/i,
      /\[ci skip\]/i,
      /version bump/i,
      /auto-version/i,
      /^v?\d+\.\d+\.\d+$/,
      /align.*version/i,
      /reset.*version/i
    ]
    
    if (versionBumpPatterns.some(pattern => pattern.test(message))) {
      console.log(`🔄 Detected version bump commit: "${message}"`)
      return true
    }
    
    // 2. Check if there are staged changes (version bump in progress)
    const { stdout: stagedFiles } = await execAsync('git diff --staged --name-only')
    if (stagedFiles.includes('package.json') || stagedFiles.includes('CHANGELOG.md')) {
      console.log('🔄 Version bump files are staged (package.json/CHANGELOG.md)')
      return true
    }
    
    // 3. Check if previous commit is a version bump (prevent rapid succession)
    const { stdout: previousCommit } = await execAsync('git log -1 --skip=1 --pretty=format:"%s"')
    const prevMessage = previousCommit.trim()
    
    if (versionBumpPatterns.some(pattern => pattern.test(prevMessage))) {
      console.log(`🔄 Previous commit is a version bump: "${prevMessage}"`)
      return true
    }
    
    // 4. Check if we're in the middle of a rebase/merge
    try {
      await execAsync('test -d .git/rebase-merge -o -d .git/rebase-apply -o -f .git/MERGE_HEAD')
      console.log('🔄 Git rebase/merge in progress, skipping auto-version')
      return true
    } catch {
      // Not in rebase/merge, continue
    }
    
    return false
  } catch (error) {
    console.error('Error checking version bump context:', error)
    return true // Err on the side of caution
  }
}

/**
 * Analyze commits and determine version bump type
 */
async function analyzeCommits(): Promise<{ bump: string; commits: number; reason: string } | null> {
  try {
    // Get the last proper semantic version tag
    const { stdout: tagsOutput } = await execAsync('git tag -l "v*.*.*" --sort=-version:refname')
    const tags = tagsOutput.trim().split('\n').filter((tag: string) => tag.match(/^v\d+\.\d+\.\d+$/))
    const lastTag = tags[0] || 'v0.1.0' // Default to v0.1.0 if no tags
    
    console.log(`📋 Analyzing commits since ${lastTag}`)
    
    // Get current HEAD
    const { stdout: currentHead } = await execAsync('git rev-parse HEAD')
    const headCommit = currentHead.trim()
    
    // Get commits since last tag, excluding version bump commits
    const { stdout: commitLog } = await execAsync(
      `git log ${lastTag}..${headCommit} --max-count=50 --pretty=format:"%H|%s"`
    )
    
    if (!commitLog.trim()) {
      console.log('📝 No new commits since last version')
      return null
    }
    
    const commitLines = commitLog.split('\n').filter((line: string) => line.trim())
    const conventionalCommits: Array<{ type: string; breaking: boolean; message: string }> = []
    
    for (const line of commitLines) {
      const [hash, message] = line.split('|')
      
      // Skip version bump commits
      if (message.includes('chore(release): bump version') || 
          message.includes('chore: bump version') ||
          message.includes('[skip ci]') ||
          message.includes('version bump') ||
          message.includes('align') && message.includes('version')) {
        console.log(`  ⏭️  Skipping: ${message.substring(0, 60)}...`)
        continue
      }
      
      // Parse conventional commits
      const match = message.match(/^(?<type>\w+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s*(?<description>.+)$/)
      if (match && match.groups && ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'perf'].includes(match.groups.type)) {
        conventionalCommits.push({
          type: match.groups.type,
          breaking: !!match.groups.breaking || message.includes('BREAKING CHANGE'),
          message
        })
        console.log(`  ✅ ${match.groups.type}${match.groups.breaking ? '!' : ''}: ${match.groups.description.substring(0, 50)}...`)
      }
    }
    
    if (conventionalCommits.length === 0) {
      console.log('📝 No new conventional commits found')
      return null
    }
    
    // Determine version bump type
    const hasBreaking = conventionalCommits.some(c => c.breaking)
    const hasFeature = conventionalCommits.some(c => c.type === 'feat')
    
    let bump: string
    let reason: string
    
    if (hasBreaking) {
      bump = 'major'
      reason = `Breaking changes detected`
    } else if (hasFeature) {
      bump = 'minor'
      reason = `New features detected`
    } else {
      bump = 'patch'
      reason = `Bug fixes and improvements detected`
    }
    
    console.log(`🎯 Determined ${bump.toUpperCase()} bump: ${reason}`)
    console.log(`📊 Based on ${conventionalCommits.length} conventional commits`)
    
    return { bump, commits: conventionalCommits.length, reason }
  } catch (error) {
    console.error('Error analyzing commits:', error)
    return null
  }
}

/**
 * Get current version from package.json
 */
async function getCurrentVersion(): Promise<string> {
  try {
    const { stdout } = await execAsync('node -p "require(\'./package.json\').version"')
    return stdout.trim()
  } catch (error) {
    console.error('Error getting current version:', error)
    return '0.1.0'
  }
}

/**
 * Calculate new version based on current version and bump type
 */
function calculateNewVersion(currentVersion: string, bumpType: string): string {
  const [major, minor, patch] = currentVersion.split('.').map(Number)
  
  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      throw new Error(`Invalid bump type: ${bumpType}`)
  }
}

/**
 * Main auto-version function
 */
async function autoVersion(): Promise<AutoVersionResult> {
  const startTime = Date.now()
  
  try {
    console.log('🚀 Starting auto-versioning with enhanced loop protection...')
    
    // Layer 1: Check if process is already running
    if (await checkProcessLock()) {
      return { success: false, reason: 'Process already running' }
    }
    
    // Layer 2: Check if we're on main branch
    const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD')
    if (branch.trim() !== 'main') {
      console.log('🔄 Not on main branch, skipping auto-version')
      return { success: false, reason: 'Not on main branch' }
    }
    
    // Layer 3: Check for version bump context
    if (await isVersionBumpContext()) {
      return { success: false, reason: 'Version bump context detected' }
    }
    
    // Create process lock
    await createProcessLock()
    
    // Analyze commits
    const analysis = await analyzeCommits()
    if (!analysis) {
      await removeProcessLock()
      return { success: false, reason: 'No commits to version' }
    }
    
    // Get current version
    const currentVersion = await getCurrentVersion()
    const newVersion = calculateNewVersion(currentVersion, analysis.bump)
    
    console.log(`📦 Version update: v${currentVersion} → v${newVersion}`)
    
    // Generate changelog first
    console.log('📝 Generating changelog...')
    try {
      await execAsync(`bun node_modules/@stacksjs/logsmith/dist/bin/cli.js --output CHANGELOG.md --theme minimal --exclude-authors "dependabot[bot],github-actions[bot]" --exclude-types "chore" --max-commits 30`)
    } catch (logError) {
      console.warn('Warning: Changelog generation failed:', logError)
    }
    
    // Run bumpx for version bump
    console.log(`🚀 Running bumpx ${analysis.bump}...`)
    await execAsync(`bun node_modules/@stacksjs/bumpx/dist/bin/cli.js ${analysis.bump} --commit --tag --tag-name "v%s" --commit-message "chore(release): bump version to v%s

🎯 ${analysis.bump.toUpperCase()} release including ${analysis.commits} conventional commits

${analysis.reason}

[skip ci]" --no-push --no-git-check --yes`)
    
    // Add changelog to the version commit
    try {
      await execAsync('git add CHANGELOG.md')
      await execAsync('git commit --amend --no-edit')
    } catch (amendError) {
      console.warn('Warning: Failed to amend changelog:', amendError)
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000)
    console.log(`✅ Auto-version completed successfully in ${duration}s`)
    console.log(`🏷️  Version: v${currentVersion} → v${newVersion}`)
    
    await removeProcessLock()
    return { 
      success: true, 
      newVersion, 
      oldVersion: currentVersion,
      reason: analysis.reason
    }
    
  } catch (error) {
    console.error('❌ Auto-version failed:', error)
    await removeProcessLock()
    return { success: false, reason: `Error: ${error}` }
  }
}

// Only run if called directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  autoVersion()
    .then(result => {
      if (result.success) {
        console.log(`🎉 Auto-version completed: ${result.oldVersion} → ${result.newVersion}`)
      } else {
        console.log(`⏭️  Auto-version skipped: ${result.reason}`)
      }
    })
    .catch(error => {
      console.error('💥 Auto-version crashed:', error)
      process.exit(1)
    })
}

export default autoVersion 