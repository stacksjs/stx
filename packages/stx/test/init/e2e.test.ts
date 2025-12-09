import { afterAll, afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Set up test directories and paths
const TEST_DIR = path.join(__dirname, 'e2e-test-output')
const CLI_PATH = path.resolve(__dirname, '../../bin/cli.ts')

// Helper function to run the CLI command directly
async function runCommand(args: string[]): Promise<{ stdout: string, stderr: string, exitCode: number }> {
  return new Promise((resolve) => {
    // Use bun to run the CLI script directly
    const cli = spawn('bun', [CLI_PATH, ...args], {
      cwd: TEST_DIR,
      env: { ...process.env },
    })

    let stdout = ''
    let stderr = ''

    cli.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    cli.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    cli.on('close', (exitCode) => {
      resolve({
        stdout,
        stderr,
        exitCode: exitCode || 0,
      })
    })
  })
}

describe('stx CLI end-to-end tests', () => {
  // Set up and clean up test directories
  beforeEach(() => {
    // Create test directory if it doesn't exist
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true })
    }

    // Create a test template in the test directory
    const testTemplate = `<!DOCTYPE html>
<html>
<head>
  <title>E2E Test Template</title>
  <script>
    export const title = "E2E Template Test";
  </script>
</head>
<body>
  <h1>{{ title }}</h1>
</body>
</html>`

    fs.writeFileSync(path.join(TEST_DIR, 'e2e-template.stx'), testTemplate)
  })

  afterEach(() => {
    // Clean up test files after each test
    if (fs.existsSync(TEST_DIR)) {
      // Remove all files in the test directory except the template
      const files = fs.readdirSync(TEST_DIR)
      for (const file of files) {
        if (file !== 'e2e-template.stx') {
          const filePath = path.join(TEST_DIR, file)
          if (fs.statSync(filePath).isDirectory()) {
            // Remove directory recursively
            fs.rmSync(filePath, { recursive: true, force: true })
          }
          else {
            fs.unlinkSync(filePath)
          }
        }
      }
    }
  })

  test('should create a file with stx init command', async () => {
    // Run the init command to create a file
    const { stdout, exitCode } = await runCommand(['init', 'e2e-file.stx'])

    // Check that the command succeeded
    expect(exitCode).toBe(0)
    expect(stdout).toContain('Successfully created file: e2e-file.stx')

    // Check that the file was created
    const fileExists = fs.existsSync(path.join(TEST_DIR, 'e2e-file.stx'))
    expect(fileExists).toBe(true)

    // Check the content of the file
    const content = fs.readFileSync(path.join(TEST_DIR, 'e2e-file.stx'), 'utf-8')
    expect(content).toContain('<!DOCTYPE html>')
    // Template may or may not use export keyword (export is optional in stx)
    expect(content).toContain('const title = "My stx Page"')
  })

  test('should use a template with stx init command', async () => {
    // Run the init command with template option
    const { stdout, exitCode } = await runCommand(['init', 'e2e-template-file.stx', '--template', 'e2e-template.stx'])

    // Check that the command succeeded
    expect(exitCode).toBe(0)
    expect(stdout).toContain('Successfully created file: e2e-template-file.stx')

    // Check that the file was created
    const fileExists = fs.existsSync(path.join(TEST_DIR, 'e2e-template-file.stx'))
    expect(fileExists).toBe(true)

    // Check the content of the file
    const content = fs.readFileSync(path.join(TEST_DIR, 'e2e-template-file.stx'), 'utf-8')
    expect(content).toContain('E2E Test Template')
    expect(content).toContain('export const title = "E2E Template Test"')
  })

  // Clean up test directory after all tests
  afterAll(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true })
    }
  })
})
