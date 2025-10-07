import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-cli')
const CLI_PATH = path.join(TEST_DIR, '../../bin/cli.ts')

// Helper to run CLI commands
async function runCLI(args: string[], _options: { expectError?: boolean } = {}): Promise<{
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

    // Timeout after 10 seconds
    setTimeout(() => {
      child.kill()
      resolve({ stdout, stderr, exitCode: 1 })
    }, 10000)
  })
}

describe('CLI Validation', () => {
  beforeAll(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })
  })

  afterAll(async () => {
    await Bun.$`rm -rf ${TEMP_DIR}`.quiet()
  })

  describe('Port Validation', () => {
    it('should reject invalid port numbers', async () => {
      const result = await runCLI(['dev', 'test.stx', '--port', '999999'], { expectError: true })

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Port must be between 1 and 65535')
      expect(result.stderr).toContain('Common development ports: 3000, 8080, 8000')
    })

    it('should reject non-numeric ports', async () => {
      const result = await runCLI(['dev', 'test.stx', '--port', 'invalid'], { expectError: true })

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Port must be a valid number')
    })

    it('should reject ports below 1', async () => {
      const result = await runCLI(['dev', 'test.stx', '--port', '0'], { expectError: true })

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Port must be between 1 and 65535')
    })

    it('should accept valid ports', async () => {
      // This should not error on validation (though it may fail later due to missing file)
      const result = await runCLI(['dev', 'test.stx', '--port', '3000'], { expectError: true })

      // Should not fail on port validation
      expect(result.stderr).not.toContain('Port must be between 1 and 65535')
    })
  })

  describe('File Validation', () => {
    it('should reject non-existent files', async () => {
      const result = await runCLI(['dev', 'nonexistent.stx'], { expectError: true })

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('File does not exist: nonexistent.stx')
      expect(result.stderr).toContain('Check the file path and try again')
    })

    it('should suggest similar files when file not found', async () => {
      // Create some stx files
      await Bun.write(path.join(TEMP_DIR, 'template.stx'), '<h1>Test</h1>')
      await Bun.write(path.join(TEMP_DIR, 'component.stx'), '<div>Component</div>')

      const result = await runCLI(['dev', 'templete.stx'], { expectError: true }) // Misspelled

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('File does not exist: templete.stx')
      expect(result.stderr).toContain('Similar files')
    })

    it('should reject directories when expecting files', async () => {
      await fs.promises.mkdir(path.join(TEMP_DIR, 'directory'), { recursive: true })

      const result = await runCLI(['dev', 'directory'], { expectError: true })

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Expected file but got directory')
    })
  })

  describe('Timeout Validation', () => {
    it('should reject invalid timeout values', async () => {
      const result = await runCLI(['test', '--timeout', 'invalid'], { expectError: true })

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Timeout must be a valid number')
    })

    it('should reject timeouts that are too short', async () => {
      const result = await runCLI(['test', '--timeout', '50'], { expectError: true })

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Timeout too short (minimum 100ms)')
    })

    it('should reject timeouts that are too long', async () => {
      const result = await runCLI(['test', '--timeout', '400000'], { expectError: true })

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Timeout too long (maximum 5 minutes)')
    })

    it('should accept valid timeout values', async () => {
      const result = await runCLI(['test', '--timeout', '5000'], { expectError: true })

      // Should not fail on timeout validation
      expect(result.stderr).not.toContain('Timeout must be a valid number')
      expect(result.stderr).not.toContain('Timeout too short')
      expect(result.stderr).not.toContain('Timeout too long')
    })
  })

  describe('Help and Usage', () => {
    it('should show help when requested', async () => {
      const result = await runCLI(['--help'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Usage:')
      expect(result.stdout).toContain('Commands:')
      expect(result.stdout).toContain('format')
      expect(result.stdout).toContain('analyze')
      expect(result.stdout).toContain('debug')
      expect(result.stdout).toContain('watch')
      expect(result.stdout).toContain('status')
      expect(result.stdout).toContain('perf')
    })

    it('should show command-specific help', async () => {
      const result = await runCLI(['format', '--help'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Format stx files automatically')
      expect(result.stdout).toContain('--check')
      expect(result.stdout).toContain('--diff')
      expect(result.stdout).toContain('--ignore')
    })

    it('should show analyze command help', async () => {
      const result = await runCLI(['analyze', '--help'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Analyze stx templates')
      expect(result.stdout).toContain('--detailed')
      expect(result.stdout).toContain('--only-issues')
      expect(result.stdout).toContain('--threshold')
    })
  })
})
