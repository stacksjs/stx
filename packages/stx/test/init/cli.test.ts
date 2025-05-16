import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

// Get the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Set up test directories
const TEST_DIR = path.join(__dirname, 'cli-test-output')
const CLI_PATH = path.resolve(__dirname, '../../bin/cli.ts')

// Helper function to run the CLI command
function runCli(args: string[]): Promise<{ stdout: string, stderr: string, exitCode: number }> {
  return new Promise((resolve) => {
    // Use bun to run the CLI
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

describe('STX CLI init command', () => {
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
  <title>CLI Test Template</title>
  <script>
    export const title = "CLI Template Test";
  </script>
</head>
<body>
  <h1>{{ title }}</h1>
</body>
</html>`

    fs.writeFileSync(path.join(TEST_DIR, 'cli-template.stx'), testTemplate)
  })

  afterEach(() => {
    // Clean up test files after each test
    if (fs.existsSync(TEST_DIR)) {
      // Remove all files and directories except the test template
      const templatePath = path.join(TEST_DIR, 'cli-template.stx');

      // Save the template content
      let templateContent = '';
      if (fs.existsSync(templatePath)) {
        templateContent = fs.readFileSync(templatePath, 'utf-8');
      }

      // Remove everything
      fs.rmSync(TEST_DIR, { recursive: true, force: true });

      // Recreate the directory
      fs.mkdirSync(TEST_DIR, { recursive: true });

      // Restore the template
      if (templateContent) {
        fs.writeFileSync(templatePath, templateContent);
      }
    }
  })

  test('init command should create a file with default name', async () => {
    // Run the init command without any arguments
    const { stdout, exitCode } = await runCli(['init'])

    // Check that the command succeeded
    expect(exitCode).toBe(0)
    expect(stdout).toContain('Successfully created file: index.stx')

    // Check that the file was created
    const fileExists = fs.existsSync(path.join(TEST_DIR, 'index.stx'))
    expect(fileExists).toBe(true)

    // Check the content of the file
    const content = fs.readFileSync(path.join(TEST_DIR, 'index.stx'), 'utf-8')
    expect(content).toContain('<!DOCTYPE html>')
    expect(content).toContain('export const title = "My STX Page"')
  })

  test('init command should create a file with custom name', async () => {
    // Custom file name
    const fileName = 'custom-cli.stx'

    // Run the init command with a custom file name
    const { stdout, exitCode } = await runCli(['init', fileName])

    // Check that the command succeeded
    expect(exitCode).toBe(0)
    expect(stdout).toContain(`Successfully created file: ${fileName}`)

    // Check that the file was created
    const fileExists = fs.existsSync(path.join(TEST_DIR, fileName))
    expect(fileExists).toBe(true)

    // Check the content of the file
    const content = fs.readFileSync(path.join(TEST_DIR, fileName), 'utf-8')
    expect(content).toContain('<!DOCTYPE html>')
    expect(content).toContain('export const title = "My STX Page"')
  })

  test('new alias should work the same as init', async () => {
    // Custom file name for the new command
    const fileName = 'new-alias.stx'

    // Run the new command (alias for init)
    const { stdout, exitCode } = await runCli(['new', fileName])

    // Check that the command succeeded
    expect(exitCode).toBe(0)
    expect(stdout).toContain(`Successfully created file: ${fileName}`)

    // Check that the file was created
    const fileExists = fs.existsSync(path.join(TEST_DIR, fileName))
    expect(fileExists).toBe(true)
  })

  test('init command should not overwrite existing file without force option', async () => {
    // Create a test file first
    const fileName = 'existing-cli.stx'
    const originalContent = 'Original CLI test content'
    fs.writeFileSync(path.join(TEST_DIR, fileName), originalContent)

    // Run the init command with the same file name
    const { stderr, exitCode } = await runCli(['init', fileName])

    // Check that the command failed
    expect(exitCode).toBe(1)
    expect(stderr).toContain('Error creating file')

    // Check that the original file content is preserved
    const content = fs.readFileSync(path.join(TEST_DIR, fileName), 'utf-8')
    expect(content).toBe(originalContent)
  })

  test('init command should overwrite existing file with force option', async () => {
    // Create a test file first
    const fileName = 'force-cli.stx'
    const originalContent = 'Original CLI force test content'
    fs.writeFileSync(path.join(TEST_DIR, fileName), originalContent)

    // Run the init command with force option
    const { stdout, exitCode } = await runCli(['init', fileName, '--force'])

    // Check that the command succeeded
    expect(exitCode).toBe(0)
    expect(stdout).toContain(`Successfully created file: ${fileName}`)

    // Check that the file content was overwritten
    const content = fs.readFileSync(path.join(TEST_DIR, fileName), 'utf-8')
    expect(content).not.toBe(originalContent)
    expect(content).toContain('<!DOCTYPE html>')
  })

  test('init command should use custom template when specified', async () => {
    // Custom file name
    const fileName = 'template-cli.stx'

    // Run the init command with template option
    const { stdout, exitCode } = await runCli(['init', fileName, '--template', 'cli-template.stx'])

    // Check that the command succeeded
    expect(exitCode).toBe(0)
    expect(stdout).toContain(`Successfully created file: ${fileName}`)

    // Check that the file was created
    const fileExists = fs.existsSync(path.join(TEST_DIR, fileName))
    expect(fileExists).toBe(true)

    // Check the content of the file matches the template
    const content = fs.readFileSync(path.join(TEST_DIR, fileName), 'utf-8')
    expect(content).toContain('CLI Test Template')
    expect(content).toContain('export const title = "CLI Template Test"')
  })

  test('init command should create nested directories if needed', async () => {
    // File with nested path
    const fileName = 'nested/dir/structure/cli-nested.stx'

    // Run the init command with nested path
    const { stdout, exitCode } = await runCli(['init', fileName])

    // Check that the command succeeded
    expect(exitCode).toBe(0)
    expect(stdout).toContain(`Successfully created file: ${fileName}`)

    // Check that the nested directories were created
    const dirExists = fs.existsSync(path.join(TEST_DIR, 'nested/dir/structure'))
    expect(dirExists).toBe(true)

    // Check that the file was created
    const fileExists = fs.existsSync(path.join(TEST_DIR, fileName))
    expect(fileExists).toBe(true)
  })

  test('init command should fail with non-existent template', async () => {
    // Custom file name
    const fileName = 'non-existent-template.stx'

    // Run the init command with non-existent template
    const { stderr, exitCode } = await runCli(['init', fileName, '--template', 'does-not-exist.stx'])

    // Check that the command failed
    expect(exitCode).toBe(1)
    expect(stderr).toContain('Error creating file')

    // Check that the file was not created
    const fileExists = fs.existsSync(path.join(TEST_DIR, fileName))
    expect(fileExists).toBe(false)
  })
})