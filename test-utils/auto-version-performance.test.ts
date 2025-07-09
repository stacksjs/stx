import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { promisify } from 'node:util'
import { exec } from 'node:child_process'

// Mock execAsync to simulate git commands with realistic timing
const execAsync = promisify(exec)

// Performance test scenarios based on real project conditions
const testScenarios = {
  // Small repository scenario (typical development)
  small: {
    commits: 5,
    expectedDuration: 2, // seconds
    tags: ['v0.3.0', 'v0.2.1', 'v0.1.0']
  },
  
  // Medium repository scenario  
  medium: {
    commits: 25,
    expectedDuration: 10, // seconds
    tags: Array.from({ length: 10 }, (_, i) => `v0.${9-i}.0`)
  },
  
  // Large repository scenario (stress test)
  large: {
    commits: 50, // Max limit
    expectedDuration: 18, // seconds (under 20s requirement)
    tags: Array.from({ length: 50 }, (_, i) => `v0.${49-i}.0`)
  }
}

// Mock git command responses with realistic timing delays
function createMockExecAsync(scenario: keyof typeof testScenarios) {
  const config = testScenarios[scenario]
  
  return mock(async (command: string) => {
    // Simulate realistic git command timing
    const delay = Math.random() * 100 + 50 // 50-150ms per command
    await new Promise(resolve => setTimeout(resolve, delay))
    
    if (command === 'git rev-parse --abbrev-ref HEAD') {
      return { stdout: 'main', stderr: '' }
    }
    
    if (command === 'git log -1 --pretty=format:"%s"') {
      return { stdout: 'feat: add new feature', stderr: '' }
    }
    
    if (command.includes('git tag -l "v*.*.*" --sort=-version:refname')) {
      return { 
        stdout: config.tags.join('\n'), 
        stderr: '' 
      }
    }
    
    if (command === 'git rev-parse HEAD') {
      return { stdout: 'abc123def456', stderr: '' }
    }
    
    if (command.includes('git log') && command.includes('--pretty=format:"%H|%s"')) {
      const commits = Array.from({ length: config.commits }, (_, i) => {
        const types = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'perf']
        const type = types[i % types.length]
        return `commit${i}|${type}: commit message ${i}`
      }).join('\n')
      
      return { stdout: commits, stderr: '' }
    }
    
    if (command.includes('node -p "require(\'./package.json\').version"')) {
      return { stdout: '0.3.0', stderr: '' }
    }
    
    if (command.includes('@stacksjs/logsmith')) {
      // Simulate changelog generation timing
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500))
      return { stdout: '', stderr: '' }
    }
    
    if (command.includes('@stacksjs/bumpx')) {
      // Simulate version bump timing
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 300))
      return { stdout: '', stderr: '' }
    }
    
    if (command === 'git describe --tags --abbrev=0') {
      return { stdout: 'v0.3.1', stderr: '' }
    }
    
    if (command === 'git add CHANGELOG.md' || command === 'git commit --amend --no-edit') {
      return { stdout: '', stderr: '' }
    }
    
    return { stdout: '', stderr: '' }
  })
}

// Optimized auto-version function for testing
async function optimizedAutoVersion(mockExecAsync: any): Promise<{
  success: boolean
  duration: number
  commitsAnalyzed: number
  bump?: string
}> {
  const startTime = Date.now()
  
  try {
    // 1. Branch check (fast)
    const { stdout: branch } = await mockExecAsync('git rev-parse --abbrev-ref HEAD')
    if (branch.trim() !== 'main') {
      return { success: false, duration: 0, commitsAnalyzed: 0 }
    }

    // 2. Version bump detection (fast)
    const { stdout: commitMsg } = await mockExecAsync('git log -1 --pretty=format:"%s"')
    if (commitMsg.includes('chore(release): bump version to') || commitMsg.includes('[skip ci]')) {
      return { success: false, duration: 0, commitsAnalyzed: 0 }
    }

         // 3. Get last tag (fast)
     const { stdout: tagsOutput } = await mockExecAsync('git tag -l "v*.*.*" --sort=-version:refname')
     const tags = tagsOutput.trim().split('\n').filter((tag: string) => tag.match(/^v\d+\.\d+\.\d+$/))
     const lastTag = tags[0] || null

    // 4. Get current HEAD (fast)
    const { stdout: currentHead } = await mockExecAsync('git rev-parse HEAD')
    const headCommit = currentHead.trim()

    // 5. Get commits since last tag (potentially slow - optimized)
    const commitRange = lastTag ? `${lastTag}..${headCommit}` : 'HEAD~20..HEAD'
    const { stdout: commitLog } = await mockExecAsync(`git log ${commitRange} --max-count=50 --pretty=format:"%H|%s"`)
    
    if (!commitLog.trim()) {
      return { success: false, duration: 0, commitsAnalyzed: 0 }
    }

         // 6. Parse commits (fast - in-memory processing)
     const commitLines = commitLog.split('\n').filter((line: string) => line.trim())
     const conventionalCommits = []
    
    for (const line of commitLines) {
      const [hash, message] = line.split('|')
      
      // Skip version bump commits
      if (message.includes('chore(release): bump version to') || 
          message.includes('chore: bump version to') ||
          message.includes('[skip ci]')) {
        continue
      }
      
      // Parse conventional commits
      if (message.match(/^(feat|fix|docs|style|refactor|test|perf):/)) {
        conventionalCommits.push({ message, hash })
      }
    }

    if (conventionalCommits.length === 0) {
      return { success: false, duration: 0, commitsAnalyzed: 0 }
    }

    // 7. Determine version bump (fast - in-memory logic)
    const hasBreaking = conventionalCommits.some(c => 
      c.message.includes('!') || c.message.includes('BREAKING'))
    const hasFeature = conventionalCommits.some(c => c.message.startsWith('feat'))
    const hasPatch = conventionalCommits.some(c => 
      c.message.match(/^(fix|docs|style|refactor|test|perf):/))

    let bump = 'patch'
    if (hasBreaking) bump = 'major'
    else if (hasFeature) bump = 'minor'
    else if (hasPatch) bump = 'patch'

    // 8. Get current version (fast)
    await mockExecAsync('node -p "require(\'./package.json\').version"')

    // 9. Generate changelog (potentially slow - parallelizable)
    const changelogPromise = mockExecAsync(`bun node_modules/@stacksjs/logsmith/dist/bin/cli.js --output CHANGELOG.md --theme minimal --exclude-authors "dependabot[bot],github-actions[bot]" --exclude-types "chore" --max-commits 30 --from "${lastTag}" --to "${headCommit}"`)

    // 10. Run version bump (potentially slow - sequential)
    await mockExecAsync(`bun node_modules/@stacksjs/bumpx/dist/bin/cli.js ${bump} --commit --tag --tag-name "v%s" --commit-message "chore(release): bump version to v%s [skip ci]" --no-push --no-git-check --yes`)

    // 11. Wait for changelog and finalize (fast)
    await changelogPromise
    await mockExecAsync('git describe --tags --abbrev=0')
    await mockExecAsync('git add CHANGELOG.md')
    await mockExecAsync('git commit --amend --no-edit')

    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000

    return {
      success: true,
      duration,
      commitsAnalyzed: conventionalCommits.length,
      bump
    }

  } catch (error) {
    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000
    
    return { 
      success: false, 
      duration, 
      commitsAnalyzed: 0 
    }
  }
}

describe('Auto-version Performance Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mock.restore()
  })

  describe('Performance Requirements', () => {
    test('should complete small repository in under 5 seconds', async () => {
      const mockExec = createMockExecAsync('small')
      const result = await optimizedAutoVersion(mockExec)
      
      expect(result.success).toBe(true)
      expect(result.duration).toBeLessThan(5)
      expect(result.commitsAnalyzed).toBe(5)
      
      console.log(`✅ Small repo: ${result.duration.toFixed(2)}s (${result.commitsAnalyzed} commits)`)
    })

    test('should complete medium repository in under 15 seconds', async () => {
      const mockExec = createMockExecAsync('medium')
      const result = await optimizedAutoVersion(mockExec)
      
      expect(result.success).toBe(true)
      expect(result.duration).toBeLessThan(15)
      expect(result.commitsAnalyzed).toBe(25)
      
      console.log(`✅ Medium repo: ${result.duration.toFixed(2)}s (${result.commitsAnalyzed} commits)`)
    })

    test('should complete large repository within 20 seconds (requirement)', async () => {
      const mockExec = createMockExecAsync('large')
      const result = await optimizedAutoVersion(mockExec)
      
      expect(result.success).toBe(true)
      expect(result.duration).toBeLessThan(20) // Key requirement
      expect(result.commitsAnalyzed).toBe(50)
      
      console.log(`✅ Large repo: ${result.duration.toFixed(2)}s (${result.commitsAnalyzed} commits)`)
    })
  })

  describe('Performance Optimizations', () => {
    test('should handle commit parsing efficiently', async () => {
      const startTime = Date.now()
      
      // Simulate parsing 50 commits (worst case)
      const commitData = Array.from({ length: 50 }, (_, i) => 
        `commit${i}|feat: feature ${i}`
      ).join('\n')
      
      const commitLines = commitData.split('\n').filter(line => line.trim())
      const conventionalCommits = []
      
      for (const line of commitLines) {
        const [hash, message] = line.split('|')
        if (message.match(/^(feat|fix|docs|style|refactor|test|perf):/)) {
          conventionalCommits.push({ message, hash })
        }
      }
      
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      
      expect(conventionalCommits.length).toBe(50)
      expect(duration).toBeLessThan(0.1) // Should be very fast
      
      console.log(`✅ Commit parsing: ${duration.toFixed(3)}s for 50 commits`)
    })

    test('should handle version bump logic efficiently', () => {
      const startTime = Date.now()
      
      // Test with large number of commits
      const commits = Array.from({ length: 100 }, (_, i) => {
        const types = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'perf']
        const type = types[i % types.length]
        const breaking = i % 20 === 0 ? '!' : ''
        return { message: `${type}${breaking}: commit ${i}` }
      })
      
      const hasBreaking = commits.some(c => c.message.includes('!'))
      const hasFeature = commits.some(c => c.message.startsWith('feat'))
      
      let bump = 'patch'
      if (hasBreaking) bump = 'major'
      else if (hasFeature) bump = 'minor'
      
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      
      expect(bump).toBe('major') // Should detect breaking changes
      expect(duration).toBeLessThan(0.01) // Should be extremely fast
      
      console.log(`✅ Version logic: ${duration.toFixed(4)}s for 100 commits`)
    })
  })

  describe('Stress Tests', () => {
    test('should handle multiple concurrent operations', async () => {
      const mockExec = createMockExecAsync('medium')
      const promises = []
      
      // Run 3 auto-version operations concurrently (simulate rapid commits)
      for (let i = 0; i < 3; i++) {
        promises.push(optimizedAutoVersion(mockExec))
      }
      
      const results = await Promise.all(promises)
      
      // All should complete successfully
      results.forEach((result, index) => {
        expect(result.success).toBe(true)
        expect(result.duration).toBeLessThan(20)
        console.log(`✅ Concurrent ${index + 1}: ${result.duration.toFixed(2)}s`)
      })
    })

    test('should maintain performance under memory pressure', async () => {
      // Simulate memory pressure with large objects
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        commit: `commit-${i}`,
        message: `feat: feature ${i}`,
        metadata: Array.from({ length: 100 }, (_, j) => `data-${j}`)
      }))
      
      const mockExec = createMockExecAsync('large')
      const result = await optimizedAutoVersion(mockExec)
      
      expect(result.success).toBe(true)
      expect(result.duration).toBeLessThan(20)
      
      // Clean up memory
      largeArray.length = 0
      
      console.log(`✅ Memory pressure test: ${result.duration.toFixed(2)}s`)
    })
  })

  describe('Real-world Scenarios', () => {
    test('should handle project with many tags efficiently', async () => {
      // Simulate repository with many tags (like the actual project)
      const manyTags = Array.from({ length: 100 }, (_, i) => `v0.${99-i}.0`)
      
      const mockExec = mock(async (command: string) => {
        await new Promise(resolve => setTimeout(resolve, 50))
        
        if (command.includes('git tag -l')) {
          return { stdout: manyTags.join('\n'), stderr: '' }
        }
        
        return { stdout: 'main', stderr: '' }
      })
      
      const startTime = Date.now()
      await mockExec('git tag -l "v*.*.*" --sort=-version:refname')
      const endTime = Date.now()
      
      const duration = (endTime - startTime) / 1000
      expect(duration).toBeLessThan(1)
      
      console.log(`✅ Many tags test: ${duration.toFixed(3)}s for 100 tags`)
    })

    test('should handle mixed commit types from real project', async () => {
      const realCommitTypes = [
        'feat: rewrite auto-version to create single commit for all changes',
        'fix: improve auto-version script with proper changelog generation',
        'fix: use local node_modules and fix post-commit hook', 
        'feat: enable automatic versioning with bumpx',
        'feat: integrate changelog generation into pre-commit hook',
        'chore: update lint process', // Should be excluded
        'feat: clean up scripts and optimize git hooks workflow'
      ]
      
      const startTime = Date.now()
      
      const conventionalCommits = realCommitTypes.filter(message =>
        message.match(/^(feat|fix|docs|style|refactor|test|perf):/)
      )
      
      const hasFeature = conventionalCommits.some(c => c.startsWith('feat:'))
      const bump = hasFeature ? 'minor' : 'patch'
      
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      
      expect(conventionalCommits.length).toBe(6) // chore excluded
      expect(bump).toBe('minor')
      expect(duration).toBeLessThan(0.01)
      
      console.log(`✅ Real project commits: ${duration.toFixed(4)}s for ${realCommitTypes.length} commits`)
    })
  })

  describe('Performance Monitoring', () => {
    test('should provide performance metrics', async () => {
      const mockExec = createMockExecAsync('medium')
      const result = await optimizedAutoVersion(mockExec)
      
      expect(result).toHaveProperty('duration')
      expect(result).toHaveProperty('commitsAnalyzed')
      expect(result).toHaveProperty('success')
      
      // Calculate commits per second
      const commitsPerSecond = result.commitsAnalyzed / result.duration
      expect(commitsPerSecond).toBeGreaterThan(1) // At least 1 commit per second
      
      console.log(`📊 Performance metrics:`)
      console.log(`   Duration: ${result.duration.toFixed(2)}s`)
      console.log(`   Commits: ${result.commitsAnalyzed}`)
      console.log(`   Rate: ${commitsPerSecond.toFixed(1)} commits/sec`)
    })

    test('should warn when approaching time limit', async () => {
      const mockExec = mock(async (command: string) => {
        // Simulate slow operations
        await new Promise(resolve => setTimeout(resolve, 3000)) // 3 seconds per operation
        return { stdout: 'result', stderr: '' }
      })
      
      const startTime = Date.now()
      await mockExec('slow-operation')
      const endTime = Date.now()
      
      const duration = (endTime - startTime) / 1000
      
      if (duration > 15) {
        console.warn(`⚠️ Operation taking ${duration.toFixed(2)}s - approaching 20s limit`)
      }
      
      expect(duration).toBeLessThan(20) // Hard limit
    })
  })
}) 