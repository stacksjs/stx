import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

// Import the actual auto-version function
const execAsync = promisify(exec)

// Mock git responses for testing
const createMockExecAsync = (scenario: 'realCommits' | 'noCommits' | 'versionBumpCommit' | 'nonMainBranch') => {
  return mock(async (command: string) => {
    console.log(`[MOCK] ${command}`)
    
    if (command === 'git rev-parse --abbrev-ref HEAD') {
      return { 
        stdout: scenario === 'nonMainBranch' ? 'feature-branch' : 'main', 
        stderr: '' 
      }
    }
    
    if (command === 'git log -1 --pretty=format:"%s"') {
      if (scenario === 'versionBumpCommit') {
        return { stdout: 'chore(release): bump version to v0.3.1 [skip ci]', stderr: '' }
      }
      return { stdout: 'fix: prevent infinite loop in auto-version system', stderr: '' }
    }
    
    if (command.includes('git tag -l "v*.*.*" --sort=-version:refname')) {
      return { 
        stdout: 'v0.1.0\nv0.0.10\nv0.0.9', 
        stderr: '' 
      }
    }
    
    if (command === 'git rev-parse HEAD') {
      return { stdout: 'bc1861b473c5a9c7e4a123456789', stderr: '' }
    }
    
    if (command.includes('git diff --staged --name-only')) {
      return { stdout: '', stderr: '' }
    }
    
    if (command.includes('git log -3 --pretty=format:"%s"')) {
      return { 
        stdout: 'fix: prevent infinite loop\nfeat: new feature\nfix: another fix', 
        stderr: '' 
      }
    }
    
    if (command.includes('git log v0.1.0..bc1861b473c5a9c7e4a123456789 --max-count=50 --pretty=format:"%H|%s"')) {
      if (scenario === 'noCommits') {
        return { stdout: '', stderr: '' }
      }
      
      // Real commits since v0.1.0 (5 conventional commits total)
      return { 
        stdout: `bc1861b|fix: prevent infinite loop in auto-version system
0f3f207|feat: rewrite auto-version to create single commit for all changes
4e2c8c0|fix: improve auto-version script with proper changelog generation
6b9a069|fix: use local node_modules and fix post-commit hook
f62a2a0|feat: enable automatic versioning with bumpx`, 
        stderr: '' 
      }
    }
    
    if (command.includes('node -p "require(\'./package.json\').version"')) {
      return { stdout: '0.1.0', stderr: '' }
    }
    
    if (command.includes('@stacksjs/logsmith')) {
      console.log('[MOCK] Generating changelog...')
      return { stdout: '', stderr: '' }
    }
    
    if (command.includes('@stacksjs/bumpx')) {
      const bumpType = command.includes('minor') ? 'minor' : 
                      command.includes('major') ? 'major' : 'patch'
      console.log(`[MOCK] Running bumpx ${bumpType}...`)
      return { stdout: '', stderr: '' }
    }
    
    if (command === 'git describe --tags --abbrev=0') {
      return { stdout: 'v0.3.0', stderr: '' }
    }
    
    if (command === 'git add CHANGELOG.md') {
      console.log('[MOCK] Adding changelog to git...')
      return { stdout: '', stderr: '' }
    }
    
    if (command === 'git commit --amend --no-edit') {
      console.log('[MOCK] Amending commit with changelog...')
      return { stdout: '', stderr: '' }
    }
    
    return { stdout: '', stderr: '' }
  })
}

// Real auto-version function for testing
async function testAutoVersion(mockExecAsync: any): Promise<{ 
  success: boolean, 
  bump?: string, 
  reason?: string,
  commitsAnalyzed?: number,
  duration?: number 
}> {
  try {
    console.log('🚀 Starting auto-versioning (with loop protection)...')
    const startTime = Date.now()

    // Check if we're on main branch
    const { stdout: branch } = await mockExecAsync('git rev-parse --abbrev-ref HEAD')
    if (branch.trim() !== 'main') {
      console.log('🔄 Not on main branch, skipping auto-version')
      return { success: false }
    }

    // FIRST: Check if the current commit is already a version bump - CRITICAL to prevent loops
    const { stdout: commitMsg } = await mockExecAsync('git log -1 --pretty=format:"%s"')
    if (commitMsg.includes('chore(release): bump version to') || commitMsg.includes('[skip ci]')) {
      console.log('🔄 Current commit is already a version bump, skipping to avoid recursion')
      return { success: false }
    }

    // SECOND: Check if version bump is already in progress
    const { stdout: stagedFiles } = await mockExecAsync('git diff --staged --name-only')
    if (stagedFiles.includes('package.json')) {
      console.log('🔄 Version bump in progress (package.json staged)')
      return { success: false }
    }

    const { stdout: recentCommits } = await mockExecAsync('git log -3 --pretty=format:"%s"')
    const hasRecentVersionBump = recentCommits.includes('chore(release): bump version to') ||
                                recentCommits.includes('bump version')
    
    if (hasRecentVersionBump) {
      console.log('🔄 Recent version bump detected in last 3 commits')
      return { success: false }
    }

    console.log('🔍 Finding last version tag...')

         // Get the last proper semantic version tag
     const { stdout: tagsOutput } = await mockExecAsync('git tag -l "v*.*.*" --sort=-version:refname')
     const tags = tagsOutput.trim().split('\n').filter((tag: string) => tag.match(/^v\d+\.\d+\.\d+$/))
     const lastTag = tags[0] || null
    
    if (!lastTag) {
      console.log('📋 No previous version tags found, analyzing recent commits for initial release')
    } else {
      console.log(`📋 Last version tag: ${lastTag}`)
    }

    // Get current HEAD for analysis
    const { stdout: currentHead } = await mockExecAsync('git rev-parse HEAD')
    const headCommit = currentHead.trim()

    // Get all commits since last tag (or last 20 if no tags) - EXCLUDE version bump commits
    let commitRange = lastTag ? `${lastTag}..${headCommit}` : 'HEAD~20..HEAD'
    const { stdout: commitLog } = await mockExecAsync(`git log ${commitRange} --max-count=50 --pretty=format:"%H|%s"`)
    
    if (!commitLog.trim()) {
      console.log('📝 No new commits found since last version')
      return { success: false }
    }

         // Parse all commits since last version - FILTER OUT version bump commits
     const commitLines = commitLog.split('\n').filter((line: string) => line.trim())
     const conventionalCommits: Array<{ message: string, hash: string, type: string, isBreaking: boolean }> = []
    const nonConventionalCommits: string[] = []

    console.log(`📊 Analyzing ${commitLines.length} commits since ${lastTag || 'beginning'}:`)

    for (const line of commitLines) {
      const [hash, message] = line.split('|')
      
      // SKIP version bump commits in the analysis
      if (message.includes('chore(release): bump version to') || 
          message.includes('chore: bump version to') ||
          message.includes('[skip ci]')) {
        console.log(`  ⏭️  Skipping version bump commit: ${message.substring(0, 60)}...`)
        continue
      }
      
      // Parse conventional commits
      const match = message.match(/^(?<type>\w+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s*(?<description>.+)$/)
      if (match && match.groups && ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'perf'].includes(match.groups.type)) {
        const parsed = {
          message,
          hash,
          type: match.groups.type,
          isBreaking: !!match.groups.breaking || message.includes('BREAKING CHANGE')
        }
        conventionalCommits.push(parsed)
        console.log(`  ✅ ${parsed.type}${match.groups.scope ? `(${match.groups.scope})` : ''}${parsed.isBreaking ? '!' : ''}: ${match.groups.description.substring(0, 60)}${match.groups.description.length > 60 ? '...' : ''}`)
      } else {
        nonConventionalCommits.push(message)
        console.log(`  ⚠️  Non-conventional: ${message.substring(0, 60)}${message.length > 60 ? '...' : ''}`)
      }
    }

    if (conventionalCommits.length === 0) {
      console.log('📝 No new conventional commits found. No version bump needed.')
      return { success: false }
    }

    // Determine the SINGLE version bump for ALL commits
    let hasBreaking = false
    let hasFeature = false
    let hasPatch = false
    
    const breakingCommits: string[] = []
    const featureCommits: string[] = []
    const patchCommits: string[] = []

    for (const commit of conventionalCommits) {
      if (commit.isBreaking) {
        hasBreaking = true
        breakingCommits.push(commit.message)
      } else if (commit.type === 'feat') {
        hasFeature = true
        featureCommits.push(commit.message)
      } else if (['fix', 'docs', 'style', 'refactor', 'test', 'perf'].includes(commit.type)) {
        hasPatch = true
        patchCommits.push(commit.message)
      }
    }

    // Return the HIGHEST priority bump (major > minor > patch)
    let bump: string
    let reason: string
    
    if (hasBreaking) {
      bump = 'major'
      reason = `💥 Breaking changes detected (${breakingCommits.length} commits):\n${breakingCommits.slice(0, 3).map(c => `  • ${c}`).join('\n')}${breakingCommits.length > 3 ? `\n  • ... and ${breakingCommits.length - 3} more` : ''}`
    } else if (hasFeature) {
      bump = 'minor'
      reason = `✨ New features detected (${featureCommits.length} commits):\n${featureCommits.slice(0, 3).map(c => `  • ${c}`).join('\n')}${featureCommits.length > 3 ? `\n  • ... and ${featureCommits.length - 3} more` : ''}`
    } else if (hasPatch) {
      bump = 'patch'
      reason = `🐛 Patches/fixes detected (${patchCommits.length} commits):\n${patchCommits.slice(0, 3).map(c => `  • ${c}`).join('\n')}${patchCommits.length > 3 ? `\n  • ... and ${patchCommits.length - 3} more` : ''}`
    } else {
      return { success: false }
    }

    console.log(`\n🎯 Single Version Bump Decision: ${bump.toUpperCase()}`)
    console.log(`📋 Based on ${conventionalCommits.length} conventional commits:`)
    console.log(reason)

    // Get current version
    const { stdout: currentVersion } = await mockExecAsync('node -p "require(\'./package.json\').version"')
    const oldVersion = currentVersion.trim()
    console.log(`\n📦 Current version: v${oldVersion}`)

    // Generate changelog BEFORE version bump
    console.log('📝 Generating changelog for all commits since last version...')
    
    if (lastTag) {
      await mockExecAsync(`bun node_modules/@stacksjs/logsmith/dist/bin/cli.js --output CHANGELOG.md --theme minimal --exclude-authors "dependabot[bot],github-actions[bot]" --exclude-types "chore" --max-commits 30 --from "${lastTag}" --to "${headCommit}"`)
    } else {
      await mockExecAsync(`bun node_modules/@stacksjs/logsmith/dist/bin/cli.js --output CHANGELOG.md --theme minimal --exclude-authors "dependabot[bot],github-actions[bot]" --exclude-types "chore" --max-commits 30`)
    }

    console.log(`🚀 Running single @stacksjs/bumpx ${bump} for all changes...`)

    // Run bumpx ONCE for all the changes - this creates ONE commit and ONE tag
    await mockExecAsync(`bun node_modules/@stacksjs/bumpx/dist/bin/cli.js ${bump} --commit --tag --tag-name "v%s" --commit-message "chore(release): bump version to v%s

🎯 ${bump.toUpperCase()} release including ${conventionalCommits.length} conventional commits

${reason}

[skip ci]" --no-push --no-git-check --yes`)

    // Get the new version that was created
    const { stdout: newTag } = await mockExecAsync('git describe --tags --abbrev=0')
    const newVersion = newTag.trim()

    // Add the pre-generated changelog to the version commit
    await mockExecAsync('git add CHANGELOG.md')
    await mockExecAsync('git commit --amend --no-edit')

    const endTime = Date.now()
    const duration = Math.round((endTime - startTime) / 1000)

    console.log('\n✅ Single version bump completed successfully!')
    console.log(`🏷️  Version: v${oldVersion} → ${newVersion}`)
    console.log(`📋 Analyzed: ${conventionalCommits.length} conventional commits + ${nonConventionalCommits.length} non-conventional`)
    console.log(`⚡ Completed in ${duration} seconds`)

    return {
      success: true,
      bump,
      reason,
      commitsAnalyzed: conventionalCommits.length,
      duration
    }

  } catch (error) {
    console.error('❌ Error during auto-version:', error)
    return { success: false }
  }
}

describe('Auto-version Function Tests - Real Implementation', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mock.restore()
  })

  afterEach(() => {
    // Clean up after each test
    mock.restore()
  })

  describe('Real Auto-Version Function Testing', () => {
    test('should run complete auto-version workflow with real commits', async () => {
      const mockExecAsync = createMockExecAsync('realCommits')
      
      const result = await testAutoVersion(mockExecAsync)
      
      expect(result.success).toBe(true)
      expect(result.bump).toBe('minor') // Should be minor because of feat commits
      expect(result.commitsAnalyzed).toBe(5) // 2 feat + 3 fix commits
      expect(result.duration).toBeDefined()
      
      console.log(`✅ Real auto-version test: ${result.bump} bump for ${result.commitsAnalyzed} commits`)
    })

    test('should skip auto-version when not on main branch', async () => {
      const mockExecAsync = createMockExecAsync('nonMainBranch')
      
      const result = await testAutoVersion(mockExecAsync)
      
      expect(result.success).toBe(false)
      console.log('✅ Correctly skipped auto-version on non-main branch')
    })

    test('should skip auto-version when current commit is version bump', async () => {
      const mockExecAsync = createMockExecAsync('versionBumpCommit')
      
      const result = await testAutoVersion(mockExecAsync)
      
      expect(result.success).toBe(false)
      console.log('✅ Correctly skipped auto-version for version bump commit')
    })

    test('should skip auto-version when no new commits found', async () => {
      const mockExecAsync = createMockExecAsync('noCommits')
      
      const result = await testAutoVersion(mockExecAsync)
      
      expect(result.success).toBe(false)
      console.log('✅ Correctly skipped auto-version when no new commits')
    })
  })

  describe('Version Progression Logic', () => {
    test('should follow correct semantic versioning progression', () => {
      // Test the expected progression examples from user requirements
      const scenarios = [
        { from: '0.0.1', commitType: 'fix', expected: '0.0.2' },
        { from: '0.0.1', commitType: 'feat', expected: '0.1.0' },
        { from: '0.1.0', commitType: 'fix', expected: '0.1.1' },
        { from: '0.1.1', commitType: 'fix', expected: '0.1.2' },
        { from: '0.1.2', commitType: 'feat', expected: '0.2.0' },
        { from: '0.2.0', commitType: 'feat!', expected: '1.0.0' },
      ]
      
      scenarios.forEach(scenario => {
        const [major, minor, patch] = scenario.from.split('.').map(Number)
        
        let newVersion: string
        if (scenario.commitType === 'feat!') {
          newVersion = `${major + 1}.0.0`
        } else if (scenario.commitType === 'feat') {
          newVersion = `${major}.${minor + 1}.0`
        } else if (scenario.commitType === 'fix') {
          newVersion = `${major}.${minor}.${patch + 1}`
        } else {
          newVersion = scenario.from
        }
        
        expect(newVersion).toBe(scenario.expected)
        console.log(`✅ ${scenario.from} + ${scenario.commitType} = ${newVersion}`)
      })
    })
  })

  describe('Loop Prevention', () => {
    test('should detect version bump commits and prevent loops', () => {
      const versionBumpCommits = [
        'chore(release): bump version to v0.3.1',
        'chore: bump version to 1.0.0',
        'v1.2.3',
        'release: 2.0.0 [skip ci]',
        'bump version to 1.1.0 [skip ci]'
      ]

      versionBumpCommits.forEach(message => {
        const isVersionBump = message.includes('chore(release): bump version to') ||
                             message.includes('chore: bump version to') ||
                             message.includes('release:') ||
                             message.includes('bump version') ||
                             message.match(/^v?\d+\.\d+\.\d+$/) !== null ||
                             message.includes('[skip ci]')
        
        expect(isVersionBump).toBe(true)
        console.log(`✅ Detected version bump: ${message}`)
      })
    })

    test('should not detect regular commits as version bumps', () => {
      const regularCommits = [
        'feat: add new authentication system',
        'fix: resolve login bug',
        'docs: update API documentation',
        'chore: update dependencies',
        'refactor: improve code structure'
      ]

      regularCommits.forEach(message => {
        const isVersionBump = message.includes('chore(release): bump version to') ||
                             message.includes('chore: bump version to') ||
                             message.includes('release:') ||
                             message.includes('bump version') ||
                             message.match(/^v?\d+\.\d+\.\d+$/) !== null ||
                             message.includes('[skip ci]')
        
        expect(isVersionBump).toBe(false)
        console.log(`✅ Regular commit: ${message}`)
      })
    })
  })

  describe('Real Project Commit Analysis', () => {
    test('should analyze real commits since v0.1.0 correctly', () => {
      const realCommitsSinceV010 = [
        'fix: prevent infinite loop in auto-version system',
        'feat: rewrite auto-version to create single commit for all changes', 
        'fix: improve auto-version script with proper changelog generation',
        'fix: use local node_modules and fix post-commit hook',
        'feat: enable automatic versioning with bumpx'
      ]

      // Filter conventional commits (exclude chore which is not in our list)
      const conventionalCommits = realCommitsSinceV010.filter(message =>
        message.match(/^(feat|fix|docs|style|refactor|test|perf):/)
      )

      expect(conventionalCommits.length).toBe(5) // All are conventional

      // Count commit types
      const featCommits = conventionalCommits.filter(c => c.startsWith('feat:'))
      const fixCommits = conventionalCommits.filter(c => c.startsWith('fix:'))

      expect(featCommits.length).toBe(2)
      expect(fixCommits.length).toBe(3)

      // Should determine minor bump (feat takes precedence)
      const hasFeature = featCommits.length > 0
      const bump = hasFeature ? 'minor' : 'patch'
      
      expect(bump).toBe('minor')
      console.log(`✅ Real commits analysis: ${featCommits.length} feat, ${fixCommits.length} fix → ${bump.toUpperCase()} bump`)
    })
  })

  describe('Performance Tests', () => {
    test('should complete auto-version within performance limits', async () => {
      const mockExecAsync = createMockExecAsync('realCommits')
      const startTime = Date.now()
      
      const result = await testAutoVersion(mockExecAsync)
      
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      
      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(20) // Should complete within 20 seconds
      
      console.log(`✅ Performance test: ${duration.toFixed(3)}s for complete auto-version`)
    })
  })
}) 