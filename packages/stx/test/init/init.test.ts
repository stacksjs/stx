import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initFile } from '../../src/init'

// Get the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Set up test directories
const TEST_DIR = path.join(__dirname, 'test-output')
const TEMPLATE_DIR = path.join(__dirname, 'templates')

describe('initFile function', () => {
  // Set up and clean up test directories
  beforeEach(() => {
    // Create test directories if they don't exist
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true })
    }

    if (!fs.existsSync(TEMPLATE_DIR)) {
      fs.mkdirSync(TEMPLATE_DIR, { recursive: true })
    }

    // Create a test template
    const testTemplate = `<!DOCTYPE html>
<html>
<head>
  <title>Test Template</title>
  <script>
    export const testVar = "This is a test template";
  </script>
</head>
<body>
  <h1>{{ testVar }}</h1>
</body>
</html>`

    fs.writeFileSync(path.join(TEMPLATE_DIR, 'test-template.stx'), testTemplate)
  })

  afterEach(() => {
    // Clean up test files after each test
    if (fs.existsSync(TEST_DIR)) {
      // Remove all files and directories in the test directory
      fs.rmSync(TEST_DIR, { recursive: true, force: true })

      // Recreate the empty test directory
      fs.mkdirSync(TEST_DIR, { recursive: true })
    }
  })

  test('should create a file with default name and template', async () => {
    // Change current working directory temporarily
    const originalCwd = process.cwd()
    process.chdir(TEST_DIR)

    try {
      // Run the initFile function with default parameters
      const result = await initFile()

      // Check that the function returned success
      expect(result).toBe(true)

      // Check that the file was created
      const fileExists = fs.existsSync('index.stx')
      expect(fileExists).toBe(true)

      // Check the content of the file
      const content = fs.readFileSync('index.stx', 'utf-8')
      expect(content).toContain('<!DOCTYPE html>')
      expect(content).toContain('export const title = "My STX Page"')
    }
    finally {
      // Restore the original working directory
      process.chdir(originalCwd)
    }
  })

  test('should create a file with custom name', async () => {
    // Change current working directory temporarily
    const originalCwd = process.cwd()
    process.chdir(TEST_DIR)

    try {
      // Custom file name
      const fileName = 'custom-page.stx'

      // Run the initFile function with custom file name
      const result = await initFile(fileName)

      // Check that the function returned success
      expect(result).toBe(true)

      // Check that the file was created
      const fileExists = fs.existsSync(fileName)
      expect(fileExists).toBe(true)

      // Check the content of the file
      const content = fs.readFileSync(fileName, 'utf-8')
      expect(content).toContain('<!DOCTYPE html>')
      expect(content).toContain('export const title = "My STX Page"')
    }
    finally {
      // Restore the original working directory
      process.chdir(originalCwd)
    }
  })

  test('should create nested directories if they don\'t exist', async () => {
    // Change current working directory temporarily
    const originalCwd = process.cwd()
    process.chdir(TEST_DIR)

    try {
      // File with nested path
      const fileName = 'components/buttons/primary.stx'

      // Run the initFile function with nested path
      const result = await initFile(fileName)

      // Check that the function returned success
      expect(result).toBe(true)

      // Check that the nested directories were created
      const dirExists = fs.existsSync('components/buttons')
      expect(dirExists).toBe(true)

      // Check that the file was created
      const fileExists = fs.existsSync(fileName)
      expect(fileExists).toBe(true)
    }
    finally {
      // Restore the original working directory
      process.chdir(originalCwd)
    }
  })

  test('should not overwrite existing file without force option', async () => {
    // Change current working directory temporarily
    const originalCwd = process.cwd()
    process.chdir(TEST_DIR)

    try {
      // Create a test file first
      const fileName = 'existing.stx'
      const originalContent = 'Original content'
      fs.writeFileSync(fileName, originalContent)

      // Try to create a file with the same name
      const result = await initFile(fileName)

      // Check that the function returned failure
      expect(result).toBe(false)

      // Check that the original file content is preserved
      const content = fs.readFileSync(fileName, 'utf-8')
      expect(content).toBe(originalContent)
    }
    finally {
      // Restore the original working directory
      process.chdir(originalCwd)
    }
  })

  test('should overwrite existing file with force option', async () => {
    // Change current working directory temporarily
    const originalCwd = process.cwd()
    process.chdir(TEST_DIR)

    try {
      // Create a test file first
      const fileName = 'force-test.stx'
      const originalContent = 'Original content'
      fs.writeFileSync(fileName, originalContent)

      // Try to create a file with the same name and force option
      const result = await initFile(fileName, { force: true })

      // Check that the function returned success
      expect(result).toBe(true)

      // Check that the file content was overwritten
      const content = fs.readFileSync(fileName, 'utf-8')
      expect(content).not.toBe(originalContent)
      expect(content).toContain('<!DOCTYPE html>')
    }
    finally {
      // Restore the original working directory
      process.chdir(originalCwd)
    }
  })

  test('should use custom template when specified', async () => {
    // Change current working directory temporarily
    const originalCwd = process.cwd()
    process.chdir(TEST_DIR)

    try {
      // Custom file name
      const fileName = 'custom-template.stx'

      // Template path relative to the current working directory
      const templatePath = path.relative(TEST_DIR, path.join(TEMPLATE_DIR, 'test-template.stx'))

      // Run the initFile function with custom template
      const result = await initFile(fileName, { template: templatePath })

      // Check that the function returned success
      expect(result).toBe(true)

      // Check that the file was created
      const fileExists = fs.existsSync(fileName)
      expect(fileExists).toBe(true)

      // Check the content of the file matches the template
      const content = fs.readFileSync(fileName, 'utf-8')
      expect(content).toContain('Test Template')
      expect(content).toContain('export const testVar = "This is a test template"')
    }
    finally {
      // Restore the original working directory
      process.chdir(originalCwd)
    }
  })

  test('should fail when template does not exist', async () => {
    // Change current working directory temporarily
    const originalCwd = process.cwd()
    process.chdir(TEST_DIR)

    try {
      // Custom file name
      const fileName = 'missing-template.stx'

      // Non-existent template
      const templatePath = 'non-existent-template.stx'

      // Run the initFile function with non-existent template
      const result = await initFile(fileName, { template: templatePath })

      // Check that the function returned failure
      expect(result).toBe(false)

      // Check that the file was not created
      const fileExists = fs.existsSync(fileName)
      expect(fileExists).toBe(false)
    }
    finally {
      // Restore the original working directory
      process.chdir(originalCwd)
    }
  })

  test('should copy template file content exactly', async () => {
    // Change current working directory temporarily
    const originalCwd = process.cwd()
    process.chdir(TEST_DIR)

    try {
      // Create a complex template file
      const complexTemplate = `<!DOCTYPE html>
<html>
<head>
  <title>Complex Template</title>
  <script>
    export const items = [1, 2, 3, 4, 5];
    export function double(x) {
      return x * 2;
    }
  </script>
  <style>
    body { font-family: sans-serif; }
    .item { margin: 10px; padding: 5px; border: 1px solid #ccc; }
  </style>
</head>
<body>
  <div class="container">
    @foreach(items as item)
      <div class="item">
        Original: {{ item }}
        Doubled: {{ double(item) }}
      </div>
    @endforeach
  </div>
</body>
</html>`

      const complexTemplatePath = path.join(TEMPLATE_DIR, 'complex-template.stx')
      fs.writeFileSync(complexTemplatePath, complexTemplate)

      // Custom file name
      const fileName = 'complex-output.stx'

      // Template path relative to the current working directory
      const templatePath = path.relative(TEST_DIR, complexTemplatePath)

      // Run the initFile function with custom template
      const result = await initFile(fileName, { template: templatePath })

      // Check that the function returned success
      expect(result).toBe(true)

      // Check that the file was created
      const fileExists = fs.existsSync(fileName)
      expect(fileExists).toBe(true)

      // Check the content of the file exactly matches the template
      const content = fs.readFileSync(fileName, 'utf-8')
      expect(content).toBe(complexTemplate)
    }
    finally {
      // Restore the original working directory
      process.chdir(originalCwd)
    }
  })
})

// Test for the CLI implementation
describe('CLI integration tests', () => {
  // These tests would typically use a tool like execa to run the CLI
  // For demonstration purposes, we'll just test the core functionality

  test('CLI init command creates expected files', async () => {
    // This is a placeholder for CLI integration testing
    // In a real implementation, you would use something like execa to run the CLI
    // and then verify the output

    // Example of what this might look like:
    // const { stdout } = await execa('bun', ['run', 'stx', 'init', 'cli-test.stx'])
    // expect(stdout).toContain('Successfully created file')
    // expect(fs.existsSync('cli-test.stx')).toBe(true)

    // For now, just demonstrate the functionality by calling the function directly
    const testFilePath = path.join(TEST_DIR, 'cli-test.stx')
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath)
    }

    const result = await initFile(testFilePath)
    expect(result).toBe(true)
    expect(fs.existsSync(testFilePath)).toBe(true)
  })
})
