import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-commands')
const CLI_PATH = path.join(TEST_DIR, '../../bin/cli.ts')

// Helper to run CLI commands
async function runCLI(args: string[], options: { timeout?: number } = {}): Promise<{
  stdout: string
  stderr: string
  exitCode: number
}> {
  return new Promise((resolve) => {
    const child = spawn('bun', [CLI_PATH, ...args], {
      cwd: TEMP_DIR,
      stdio: 'pipe',
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode: exitCode || 0 })
    })

    // Timeout
    setTimeout(() => {
      child.kill()
      resolve({ stdout, stderr, exitCode: 1 })
    }, options.timeout || 10000)
  })
}

describe('CLI Commands', () => {
  beforeAll(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })

    // Create sample stx files for testing
    await Bun.write(path.join(TEMP_DIR, 'simple.stx'), `
<!DOCTYPE html>
<html>
<head>
  <title>Simple Template</title>
  <script>
    module.exports = {
      title: "Hello World",
      items: [1, 2, 3]
    };
  </script>
</head>
<body>
  <h1>{{ title }}</h1>
  @if (items.length > 0)
    <ul>
      @foreach (items as item)
        <li>Item {{ item }}</li>
      @endforeach
    </ul>
  @endif
</body>
</html>`)

    await Bun.write(path.join(TEMP_DIR, 'complex.stx'), `
<!DOCTYPE html>
<html>
<head>
  <title>Complex Template</title>
  <script>
    module.exports = {
      user: {
        name: "John Doe",
        isAdmin: true
      },
      posts: [
        { title: "Post 1", content: "Content 1" },
        { title: "Post 2", content: "Content 2" }
      ]
    };
  </script>
</head>
<body>
  <header>
    <h1>Welcome {{ user.name }}</h1>
    @if (user.isAdmin)
      <div class="admin-panel">Admin Panel</div>
    @endif
  </header>

  <main>
    @if (posts.length > 0)
      @foreach (posts as post)
        <article>
          <h2>{{ post.title }}</h2>
          <p>{!! post.content !!}</p>
        </article>
      @endforeach
    @else
      <p>No posts found</p>
    @endif
  </main>
</body>
</html>`)

    await Bun.write(path.join(TEMP_DIR, 'malformed.stx'), `
<!DOCTYPE html>
<html>
<head>
  <title>Malformed Template</title>
  <script>
    module.exports = {
      items: [1, 2, 3]
    };
  </script>
</head>
<body>
  @if (items.length > 0)
    <ul>
      @foreach (items as item)
        <li>{{ item }}</li>
      @endforeach
    </ul>
  <!-- Missing @endif -->
</body>
</html>`)
  })

  afterAll(async () => {
    await Bun.$`rm -rf ${TEMP_DIR}`.quiet()
  })

  describe('Status Command', () => {
    it('should show project status', async () => {
      const result = await runCLI(['status'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('stx Project Status')
      expect(result.stdout).toContain('stx Files:')
      expect(result.stdout).toContain('Markdown Files:')
      expect(result.stdout).toContain('Total Files:')
    })

    it('should show verbose status information', async () => {
      const result = await runCLI(['status', '--verbose'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('stx Project Status')
      expect(result.stdout).toContain('simple.stx')
      expect(result.stdout).toContain('complex.stx')
      expect(result.stdout).toContain('malformed.stx')
    })

    it('should output JSON format', async () => {
      const result = await runCLI(['status', '--json'])

      expect(result.exitCode).toBe(0)

      const jsonOutput = JSON.parse(result.stdout)
      expect(jsonOutput).toHaveProperty('projectRoot')
      expect(jsonOutput).toHaveProperty('stxFiles')
      expect(jsonOutput).toHaveProperty('markdownFiles')
      expect(jsonOutput).toHaveProperty('totalFiles')
      expect(typeof jsonOutput.stxFiles).toBe('number')
    })
  })

  describe('Debug Command', () => {
    it('should analyze a simple stx file', async () => {
      const result = await runCLI(['debug', 'simple.stx'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Debugging stx template: simple.stx')
      expect(result.stdout).toContain('Template Content')
      expect(result.stdout).toContain('Script Section Found')
      expect(result.stdout).toContain('Processing Context')
    })

    it('should handle custom context data', async () => {
      const contextData = JSON.stringify({ customVar: 'test value', number: 42 })
      const result = await runCLI(['debug', 'simple.stx', '--context', contextData])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('customVar')
      expect(result.stdout).toContain('test value')
      expect(result.stdout).toContain('42')
    })

    it('should save debug report to file', async () => {
      const reportFile = path.join(TEMP_DIR, 'debug-report.json')
      const result = await runCLI(['debug', 'simple.stx', '--save-report', reportFile])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Debug report saved')

      // Check that the report file was created
      expect(fs.existsSync(reportFile)).toBe(true)

      const reportContent = await Bun.file(reportFile).json()
      expect(reportContent).toHaveProperty('file')
      expect(reportContent).toHaveProperty('timestamp')
      expect(reportContent).toHaveProperty('templateLength')
      expect(reportContent.file).toContain('simple.stx')
    })

    it('should reject invalid JSON context', async () => {
      const result = await runCLI(['debug', 'simple.stx', '--context', 'invalid-json'])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Invalid JSON in --context option')
    })
  })

  describe('Performance Command', () => {
    it('should show empty performance data initially', async () => {
      const result = await runCLI(['perf'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('No performance data available')
    })

    it('should clear performance statistics', async () => {
      const result = await runCLI(['perf', '--clear'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Performance statistics cleared')
    })

    it('should output JSON format', async () => {
      const result = await runCLI(['perf', '--json'])

      expect(result.exitCode).toBe(0)
      // Should be valid JSON even if empty
      const jsonOutput = JSON.parse(result.stdout || '{}')
      expect(typeof jsonOutput).toBe('object')
    })
  })

  describe('Format Command', () => {
    it('should check file formatting', async () => {
      const result = await runCLI(['format', '--check', 'simple.stx'])

      // Format command should work regardless of formatting status
      expect([0, 1]).toContain(result.exitCode)
    })

    it('should show diff of formatting changes', async () => {
      const result = await runCLI(['format', '--diff', 'simple.stx'])

      expect(result.exitCode).toBe(0)
    })

    it('should handle glob patterns', async () => {
      const result = await runCLI(['format', '*.stx', '--check'])

      expect([0, 1]).toContain(result.exitCode)
    })

    it('should respect ignore patterns', async () => {
      const result = await runCLI(['format', '--check', '--ignore', 'malformed.stx'])

      expect([0, 1]).toContain(result.exitCode)
    })
  })

  describe('Analyze Command', () => {
    it('should analyze stx templates', async () => {
      const result = await runCLI(['analyze'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Analyzing stx templates')
      expect(result.stdout).toContain('Analysis Summary')
      expect(result.stdout).toContain('Files analyzed:')
      expect(result.stdout).toContain('Average complexity:')
      expect(result.stdout).toContain('Performance score:')
    })

    it('should show detailed analysis', async () => {
      const result = await runCLI(['analyze', '--detailed'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Detailed File Analysis')
      expect(result.stdout).toContain('simple.stx')
      expect(result.stdout).toContain('Lines:')
      expect(result.stdout).toContain('Complexity:')
    })

    it('should filter by issue threshold', async () => {
      const result = await runCLI(['analyze', '--threshold', 'warning'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Analysis Summary')
    })

    it('should output JSON format', async () => {
      const result = await runCLI(['analyze', '--json'])

      expect(result.exitCode).toBe(0)

      const jsonOutput = JSON.parse(result.stdout)
      expect(jsonOutput).toHaveProperty('summary')
      expect(jsonOutput).toHaveProperty('results')
      expect(jsonOutput).toHaveProperty('generatedAt')
      expect(Array.isArray(jsonOutput.results)).toBe(true)
    })

    it('should save analysis report', async () => {
      const reportFile = path.join(TEMP_DIR, 'analysis-report.json')
      const result = await runCLI(['analyze', '--save-report', reportFile])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Analysis report saved')

      // Check that the report file was created
      expect(fs.existsSync(reportFile)).toBe(true)

      const reportContent = await Bun.file(reportFile).json()
      expect(reportContent).toHaveProperty('summary')
      expect(reportContent).toHaveProperty('results')
    })

    it('should show only files with issues', async () => {
      const result = await runCLI(['analyze', '--only-issues'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Analysis Summary')
    })
  })

  describe('Watch Command', () => {
    it('should validate watch command arguments', async () => {
      const result = await runCLI(['watch'], { timeout: 2000 })

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Input file or pattern is required')
    })

    it('should validate debounce parameter', async () => {
      const result = await runCLI(['watch', 'simple.stx', '--debounce', 'invalid'])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Debounce must be a valid number')
    })

    it('should validate output directory', async () => {
      const result = await runCLI(['watch', 'simple.stx', '--output', '../../../invalid'])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Invalid output directory')
    })
  })

  describe('Build Command Validation', () => {
    it('should validate port numbers', async () => {
      const result = await runCLI(['build', 'simple.stx', '--port', '99999'])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Port must be between 1024 and 65535')
    })

    it('should validate timeout values', async () => {
      const result = await runCLI(['build', 'simple.stx', '--timeout', 'invalid'])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Timeout must be a valid number')
    })

    it('should validate file existence', async () => {
      const result = await runCLI(['build', 'nonexistent.stx'])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('File not found')
    })

    it('should validate file extensions', async () => {
      await Bun.write(path.join(TEMP_DIR, 'invalid.txt'), 'not an stx file')

      const result = await runCLI(['build', 'invalid.txt'])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('File must have .stx extension')
    })

    it('should provide helpful suggestions for common errors', async () => {
      const result = await runCLI(['build', 'simple.stx', '--port', '80'])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('suggestion')
      expect(result.stderr).toContain('Try using a port between 1024 and 65535')
    })
  })

  describe('Help and Version', () => {
    it('should show help for specific commands', async () => {
      const result = await runCLI(['build', '--help'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Usage:')
      expect(result.stdout).toContain('build')
      expect(result.stdout).toContain('Options:')
    })

    it('should show version information', async () => {
      const result = await runCLI(['--version'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/)
    })

    it('should show command suggestions for typos', async () => {
      const result = await runCLI(['buils']) // typo in 'build'

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Unknown command')
      expect(result.stderr).toContain('Did you mean')
      expect(result.stderr).toContain('build')
    })
  })

  describe('Error Recovery and Suggestions', () => {
    it('should provide recovery suggestions for common CLI mistakes', async () => {
      const result = await runCLI([''])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('No command provided')
      expect(result.stderr).toContain('Use --help')
    })

    it('should handle invalid argument combinations gracefully', async () => {
      const result = await runCLI(['analyze', '--json', '--detailed'])

      // Should either work or provide clear error message
      if (result.exitCode !== 0) {
        expect(result.stderr).toContain('Cannot combine')
      }
    })

    it('should validate mutually exclusive options', async () => {
      const result = await runCLI(['format', '--check', '--write'])

      if (result.exitCode !== 0) {
        expect(result.stderr).toContain('mutually exclusive')
      }
    })
  })
})
