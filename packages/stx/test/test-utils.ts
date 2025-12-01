/**
 * Test Utilities Module
 *
 * Provides utilities for testing stx templates, including:
 * - Template processing helpers
 * - Assertion functions
 * - Edge case test generators
 * - Snapshot testing support
 * - Common test fixtures
 *
 * @module test-utils
 */

import type { BuildConfig } from 'bun'
import type { StxOptions } from '../src/types'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { processDirectives } from '../src/process'

export function buildWithStx(config: Omit<BuildConfig, 'stx'> & { stx?: StxOptions }): Promise<any> {
  return Bun.build(config as any)
}

// =============================================================================
// Test Utilities for stx
// =============================================================================

/**
 * Process a template string with the stx engine
 * Convenience wrapper for testing
 */
export async function processTemplate(
  template: string,
  context: Record<string, any> = {},
  options: StxOptions = {},
): Promise<string> {
  return processDirectives(template, context, 'test.stx', options)
}

/**
 * Assert that a template produces the expected output
 */
export async function assertTemplate(
  template: string,
  expected: string,
  context: Record<string, any> = {},
  options: StxOptions = {},
): Promise<void> {
  const result = await processTemplate(template, context, options)
  if (result.trim() !== expected.trim()) {
    throw new Error(
      `Template mismatch:\n`
      + `Expected: ${JSON.stringify(expected.trim())}\n`
      + `Got: ${JSON.stringify(result.trim())}`,
    )
  }
}

/**
 * Assert that a template throws an error
 */
export async function assertTemplateThrows(
  template: string,
  errorPattern?: RegExp | string,
  context: Record<string, any> = {},
  options: StxOptions = {},
): Promise<void> {
  try {
    await processTemplate(template, context, options)
    throw new Error('Expected template to throw, but it did not')
  }
  catch (error: any) {
    if (error.message === 'Expected template to throw, but it did not') {
      throw error
    }
    if (errorPattern) {
      const matches = typeof errorPattern === 'string'
        ? error.message.includes(errorPattern)
        : errorPattern.test(error.message)
      if (!matches) {
        throw new Error(
          `Error message did not match pattern:\n`
          + `Pattern: ${errorPattern}\n`
          + `Got: ${error.message}`,
        )
      }
    }
  }
}

// =============================================================================
// Edge Case Test Generators
// =============================================================================

/**
 * Generate a deeply nested directive structure for testing
 * @param depth - How deep to nest
 * @param directive - The directive to nest (default: 'if')
 */
export function generateNestedDirectives(depth: number, directive: string = 'if'): string {
  let template = ''
  const condition = 'true'

  // Opening tags
  for (let i = 0; i < depth; i++) {
    template += `@${directive}(${condition})\n`
    template += `Level ${i + 1}\n`
  }

  // Content at deepest level
  template += 'Deepest content\n'

  // Closing tags
  for (let i = depth - 1; i >= 0; i--) {
    template += `@end${directive}\n`
  }

  return template
}

/**
 * Generate a template with Unicode content for testing
 */
export function generateUnicodeTemplate(): string {
  return `
<script>
  const greeting = '你好世界'
  const emoji = '🎉🚀✨'
  const arabic = 'مرحبا بالعالم'
  const japanese = 'こんにちは世界'
  const special = '€£¥₹'
</script>

<div>
  <p>Chinese: {{ greeting }}</p>
  <p>Emoji: {{ emoji }}</p>
  <p>Arabic: {{ arabic }}</p>
  <p>Japanese: {{ japanese }}</p>
  <p>Currency: {{ special }}</p>
</div>
`
}

/**
 * Generate a large template for stress testing
 * @param itemCount - Number of items to generate
 */
export function generateLargeTemplate(itemCount: number): string {
  const items = Array.from({ length: itemCount }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    value: Math.random() * 100,
  }))

  return `
<script>
  const items = ${JSON.stringify(items)}
</script>

<ul>
  @foreach(items as item)
    <li id="item-{{ item.id }}">
      <span class="name">{{ item.name }}</span>
      <span class="value">{{ item.value | number:2 }}</span>
    </li>
  @endforeach
</ul>
`
}

/**
 * Generate a template with all directive types for comprehensive testing
 */
export function generateComprehensiveTemplate(): string {
  return `
<script>
  const title = 'Test Page'
  const items = ['a', 'b', 'c']
  const count = 5
  const showExtra = true
  const user = { name: 'John', role: 'admin' }
</script>

<!DOCTYPE html>
<html lang="en">
<head>
  <title>{{ title }}</title>
</head>
<body>
  @if(showExtra)
    <header>Extra Header</header>
  @else
    <header>Normal Header</header>
  @endif

  <main>
    @unless(items.length === 0)
      <ul>
        @foreach(items as item)
          <li>{{ item | uppercase }}</li>
        @endforeach
      </ul>
    @endunless

    @for(let i = 0; i < count; i++)
      <span>{{ i }}</span>
    @endfor

    @switch(user.role)
      @case('admin')
        <p>Admin access</p>
        @break
      @case('user')
        <p>User access</p>
        @break
      @default
        <p>Guest access</p>
    @endswitch
  </main>
</body>
</html>
`
}

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Common context objects for testing
 */
export const testContexts = {
  empty: {},

  basic: {
    name: 'World',
    count: 42,
    active: true,
  },

  withArray: {
    items: ['apple', 'banana', 'cherry'],
    numbers: [1, 2, 3, 4, 5],
  },

  withNested: {
    user: {
      name: 'John',
      email: 'john@example.com',
      profile: {
        age: 30,
        city: 'NYC',
      },
    },
  },

  withAuth: {
    auth: {
      check: true,
      user: { id: 1, name: 'Admin', role: 'admin' },
    },
    userCan: {
      'edit-posts': true,
      'delete-posts': false,
    },
  },

  withTranslations: {
    __translations: {
      greeting: 'Hello',
      welcome: 'Welcome, :name!',
      nested: {
        key: 'Nested Value',
      },
    },
  },
}

/**
 * Common template patterns for testing
 */
export const testTemplates = {
  simpleExpression: '{{ name }}',
  escapedExpression: '{!! raw !!}',
  withFilter: '{{ name | uppercase }}',
  conditional: '@if(active)Active@else Inactive@endif',
  loop: '@foreach(items as item){{ item }}@endforeach',
  nested: '@if(a)@if(b)Both@endif@endif',
}

// =============================================================================
// Snapshot Testing
// =============================================================================

/**
 * Default directory for storing snapshots
 */
const DEFAULT_SNAPSHOT_DIR = '__snapshots__'

/**
 * Options for snapshot testing
 */
export interface SnapshotOptions {
  /** Directory to store snapshots (default: __snapshots__) */
  snapshotDir?: string
  /** Whether to update snapshots instead of comparing (default: false) */
  update?: boolean
  /** Custom serializer for the output */
  serializer?: (value: string) => string
  /** Normalize whitespace before comparing (default: false) */
  normalizeWhitespace?: boolean
}

/**
 * Result of a snapshot comparison
 */
export interface SnapshotResult {
  /** Whether the snapshot matched */
  passed: boolean
  /** Whether a new snapshot was created */
  created: boolean
  /** Whether the snapshot was updated */
  updated: boolean
  /** Path to the snapshot file */
  snapshotPath: string
  /** Error message if comparison failed */
  error?: string
  /** Expected content (from snapshot) */
  expected?: string
  /** Actual content (from template) */
  actual?: string
}

/**
 * Normalize a snapshot name to a valid filename.
 * Replaces special characters with underscores.
 */
function normalizeSnapshotName(name: string): string {
  return name
    .replace(/[^\w-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * Normalize whitespace in content for comparison.
 * Collapses multiple spaces/newlines into single space.
 */
function normalizeWhitespace(content: string): string {
  return content
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim()
}

/**
 * Get the snapshot directory path.
 * Creates the directory if it doesn't exist.
 */
function getSnapshotDir(testFilePath: string, options: SnapshotOptions = {}): string {
  const testDir = path.dirname(testFilePath)
  const snapshotDir = path.join(testDir, options.snapshotDir || DEFAULT_SNAPSHOT_DIR)

  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true })
  }

  return snapshotDir
}

/**
 * Get the full path for a snapshot file.
 */
function getSnapshotPath(
  testFilePath: string,
  snapshotName: string,
  options: SnapshotOptions = {},
): string {
  const snapshotDir = getSnapshotDir(testFilePath, options)
  const normalizedName = normalizeSnapshotName(snapshotName)
  return path.join(snapshotDir, `${normalizedName}.snap.html`)
}

/**
 * Read a snapshot file.
 * Returns null if the file doesn't exist.
 */
function readSnapshot(snapshotPath: string): string | null {
  try {
    return fs.readFileSync(snapshotPath, 'utf-8')
  }
  catch {
    return null
  }
}

/**
 * Write a snapshot file.
 */
function writeSnapshot(snapshotPath: string, content: string): void {
  fs.writeFileSync(snapshotPath, content, 'utf-8')
}

/**
 * Match rendered template output against a stored snapshot.
 *
 * This function compares the rendered template output against a previously
 * stored snapshot. If no snapshot exists, it creates one. If the snapshot
 * exists and doesn't match, it fails (unless update mode is enabled).
 *
 * @param template - The template string to process
 * @param snapshotName - Unique name for this snapshot
 * @param context - Template context with variables
 * @param options - Processing and snapshot options
 * @returns Snapshot comparison result
 *
 * @example
 * ```typescript
 * import { expect, test } from 'bun:test'
 * import { matchSnapshot } from './test-utils'
 *
 * test('renders user card correctly', async () => {
 *   const result = await matchSnapshot(
 *     '<div class="card">{{ user.name }}</div>',
 *     'user-card',
 *     { user: { name: 'John' } },
 *     { normalizeWhitespace: true }
 *   )
 *   expect(result.passed).toBe(true)
 * })
 * ```
 */
export async function matchSnapshot(
  template: string,
  snapshotName: string,
  context: Record<string, any> = {},
  options: SnapshotOptions & { stxOptions?: StxOptions, testFilePath?: string } = {},
): Promise<SnapshotResult> {
  // Process the template
  const output = await processDirectives(
    template,
    context,
    'snapshot-test.stx',
    options.stxOptions || {},
  )

  // Apply custom serializer if provided
  const actualContent = options.serializer ? options.serializer(output) : output

  // Determine test file path (for snapshot location)
  // Use provided path or default to current working directory
  // eslint-disable-next-line node/prefer-global/process
  const testFilePath = options.testFilePath || path.join(process.cwd(), 'test', 'snapshot.test.ts')
  const snapshotPath = getSnapshotPath(testFilePath, snapshotName, options)

  // Read existing snapshot
  const existingSnapshot = readSnapshot(snapshotPath)

  // Compare function
  const compare = (expected: string, actual: string): boolean => {
    if (options.normalizeWhitespace) {
      return normalizeWhitespace(expected) === normalizeWhitespace(actual)
    }
    return expected === actual
  }

  // No existing snapshot - create new one
  if (existingSnapshot === null) {
    writeSnapshot(snapshotPath, actualContent)
    return {
      passed: true,
      created: true,
      updated: false,
      snapshotPath,
      actual: actualContent,
    }
  }

  // Compare with existing snapshot
  const matches = compare(existingSnapshot, actualContent)

  if (matches) {
    return {
      passed: true,
      created: false,
      updated: false,
      snapshotPath,
      expected: existingSnapshot,
      actual: actualContent,
    }
  }

  // Mismatch - update if requested, otherwise fail
  if (options.update) {
    writeSnapshot(snapshotPath, actualContent)
    return {
      passed: true,
      created: false,
      updated: true,
      snapshotPath,
      expected: existingSnapshot,
      actual: actualContent,
    }
  }

  // Failed comparison
  return {
    passed: false,
    created: false,
    updated: false,
    snapshotPath,
    error: generateDiffMessage(existingSnapshot, actualContent, snapshotPath),
    expected: existingSnapshot,
    actual: actualContent,
  }
}

/**
 * Generate a diff message for snapshot mismatch.
 */
function generateDiffMessage(expected: string, actual: string, snapshotPath: string): string {
  const expectedLines = expected.split('\n')
  const actualLines = actual.split('\n')

  let diff = `Snapshot mismatch at ${snapshotPath}\n\n`

  // Find first differing line
  let firstDiffLine = 0
  for (let i = 0; i < Math.max(expectedLines.length, actualLines.length); i++) {
    if (expectedLines[i] !== actualLines[i]) {
      firstDiffLine = i + 1
      break
    }
  }

  diff += `First difference at line ${firstDiffLine}:\n`
  diff += `  Expected: ${JSON.stringify(expectedLines[firstDiffLine - 1] || '(no line)')}\n`
  diff += `  Actual:   ${JSON.stringify(actualLines[firstDiffLine - 1] || '(no line)')}\n\n`

  // Show context around the diff
  const contextLines = 3
  const startLine = Math.max(0, firstDiffLine - contextLines - 1)
  const endLine = Math.min(actualLines.length, firstDiffLine + contextLines)

  diff += 'Context:\n'
  for (let i = startLine; i < endLine; i++) {
    const lineNum = (i + 1).toString().padStart(4)
    const marker = i === firstDiffLine - 1 ? '>>>' : '   '
    diff += `${marker} ${lineNum} | ${actualLines[i] || ''}\n`
  }

  diff += '\nRun with { update: true } to update the snapshot.'

  return diff
}

/**
 * Assert that template output matches a snapshot.
 *
 * This is a convenience wrapper around matchSnapshot that throws on mismatch.
 *
 * @param template - The template string to process
 * @param snapshotName - Unique name for this snapshot
 * @param context - Template context with variables
 * @param options - Processing and snapshot options
 * @throws Error if snapshot doesn't match
 *
 * @example
 * ```typescript
 * import { test } from 'bun:test'
 * import { assertSnapshot } from './test-utils'
 *
 * test('renders correctly', async () => {
 *   await assertSnapshot(
 *     '@foreach(items as item)<li>{{ item }}</li>@endforeach',
 *     'item-list',
 *     { items: ['a', 'b', 'c'] }
 *   )
 * })
 * ```
 */
export async function assertSnapshot(
  template: string,
  snapshotName: string,
  context: Record<string, any> = {},
  options: SnapshotOptions & { stxOptions?: StxOptions, testFilePath?: string } = {},
): Promise<void> {
  const result = await matchSnapshot(template, snapshotName, context, options)

  if (!result.passed) {
    throw new Error(result.error || 'Snapshot mismatch')
  }

  if (result.created) {
    console.log(`📸 Created new snapshot: ${result.snapshotPath}`)
  }

  if (result.updated) {
    console.log(`📸 Updated snapshot: ${result.snapshotPath}`)
  }
}

/**
 * Create a snapshot manager for a test file.
 *
 * This provides a convenient API for managing multiple snapshots within
 * a single test file, automatically tracking the test file path.
 *
 * @param testFilePath - Path to the test file (typically import.meta.path)
 * @param defaultOptions - Default options for all snapshots
 * @returns Snapshot manager object
 *
 * @example
 * ```typescript
 * import { test, expect } from 'bun:test'
 * import { createSnapshotManager } from './test-utils'
 *
 * const snapshots = createSnapshotManager(import.meta.path, {
 *   normalizeWhitespace: true
 * })
 *
 * test('user profile renders correctly', async () => {
 *   await snapshots.assert(
 *     '<div class="profile">{{ user.name }}</div>',
 *     'user-profile',
 *     { user: { name: 'John' } }
 *   )
 * })
 *
 * test('product list renders correctly', async () => {
 *   const result = await snapshots.match(
 *     '@foreach(products as p)<li>{{ p.name }}</li>@endforeach',
 *     'product-list',
 *     { products: [{ name: 'Widget' }] }
 *   )
 *   expect(result.passed).toBe(true)
 * })
 * ```
 */
export function createSnapshotManager(
  testFilePath: string,
  defaultOptions: SnapshotOptions & { stxOptions?: StxOptions } = {},
) {
  return {
    /**
     * Match template output against snapshot and return result
     */
    match: (
      template: string,
      snapshotName: string,
      context: Record<string, any> = {},
      options: SnapshotOptions & { stxOptions?: StxOptions } = {},
    ) => matchSnapshot(template, snapshotName, context, {
      ...defaultOptions,
      ...options,
      testFilePath,
    }),

    /**
     * Assert template output matches snapshot (throws on mismatch)
     */
    assert: (
      template: string,
      snapshotName: string,
      context: Record<string, any> = {},
      options: SnapshotOptions & { stxOptions?: StxOptions } = {},
    ) => assertSnapshot(template, snapshotName, context, {
      ...defaultOptions,
      ...options,
      testFilePath,
    }),

    /**
     * Get the snapshot directory path
     */
    getSnapshotDir: () => getSnapshotDir(testFilePath, defaultOptions),

    /**
     * Clear all snapshots for this test file
     */
    clearSnapshots: () => {
      const dir = getSnapshotDir(testFilePath, defaultOptions)
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir)
        for (const file of files) {
          if (file.endsWith('.snap.html')) {
            fs.unlinkSync(path.join(dir, file))
          }
        }
      }
    },

    /**
     * List all snapshots for this test file
     */
    listSnapshots: (): string[] => {
      const dir = getSnapshotDir(testFilePath, defaultOptions)
      if (!fs.existsSync(dir)) {
        return []
      }
      return fs.readdirSync(dir)
        .filter(f => f.endsWith('.snap.html'))
        .map(f => f.replace('.snap.html', ''))
    },
  }
}
