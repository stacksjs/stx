import fs from 'node:fs'
import path from 'node:path'

export const TEST_DIR: string = import.meta.dir
export const OUTPUT_DIR: string = path.join(TEST_DIR, 'out')
export const TEMP_DIR: string = path.join(TEST_DIR, 'temp')
export const PARTIALS_DIR: string = path.join(TEMP_DIR, 'partials')

/**
 * Setup and cleanup for tests
 */
export async function setupTestDirs(): Promise<void> {
  await fs.promises.mkdir(OUTPUT_DIR, { recursive: true })
  await fs.promises.mkdir(TEMP_DIR, { recursive: true })
  await fs.promises.mkdir(PARTIALS_DIR, { recursive: true })
}

/**
 * Clean up test directories
 */
export async function cleanupTestDirs(): Promise<void> {
  try {
    await Bun.$`rm -rf ${OUTPUT_DIR} ${TEMP_DIR}`.quiet()
  }
  catch (error) {
    console.error('Error cleaning up test directories:', error)
  }
}

/**
 * Helper function to read built HTML file
 */
export async function getHtmlOutput(result: any): Promise<string> {
  if (!result.success) {
    throw new Error(`Build failed: ${JSON.stringify(result.logs)}`)
  }

  const htmlOutput = result.outputs.find((o: any) => o.path.endsWith('.html'))

  if (!htmlOutput) {
    throw new Error('No HTML output found in build result')
  }

  return await Bun.file(htmlOutput.path).text()
}

/**
 * Create a test file with the given content
 */
export async function createTestFile(filename: string, content: string): Promise<string> {
  const testFile = path.join(TEMP_DIR, filename)
  await Bun.write(testFile, content)
  return testFile
}

/**
 * Create a partial file
 */
export async function createPartialFile(filename: string, content: string): Promise<string> {
  const partialFile = path.join(PARTIALS_DIR, filename)
  await Bun.write(partialFile, content)
  return partialFile
}
