import type { StxOptions } from '../../src/types'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { processIncludes } from '../../src/includes'

const TEST_DIR = path.join(import.meta.dir, 'temp-circular')

describe('Circular Include Detection', () => {
  beforeAll(() => {
    // Create test directory
    fs.mkdirSync(TEST_DIR, { recursive: true })
  })

  afterAll(() => {
    // Clean up test directory
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it('should detect simple circular include (A includes A)', async () => {
    // Create a file that includes itself
    const fileA = path.join(TEST_DIR, 'self-include.stx')
    fs.writeFileSync(fileA, `<div>@include('self-include')</div>`)

    const options: StxOptions = {
      partialsDir: TEST_DIR,
      debug: true,
    }

    const result = await processIncludes(
      `@include('self-include')`,
      {},
      fileA,
      options,
      new Set(),
    )

    expect(result).toContain('Circular include detected')
  })

  it('should detect two-level circular include (A includes B, B includes A)', async () => {
    // Create file A that includes B
    const fileA = path.join(TEST_DIR, 'file-a.stx')
    const fileB = path.join(TEST_DIR, 'file-b.stx')

    fs.writeFileSync(fileA, `<div class="a">@include('file-b')</div>`)
    fs.writeFileSync(fileB, `<div class="b">@include('file-a')</div>`)

    const options: StxOptions = {
      partialsDir: TEST_DIR,
      debug: true,
    }

    const result = await processIncludes(
      `@include('file-a')`,
      {},
      path.join(TEST_DIR, 'main.stx'),
      options,
      new Set(),
    )

    expect(result).toContain('Circular include detected')
  })

  it('should detect three-level circular include (A -> B -> C -> A)', async () => {
    // Create a chain: A includes B, B includes C, C includes A
    const fileA = path.join(TEST_DIR, 'chain-a.stx')
    const fileB = path.join(TEST_DIR, 'chain-b.stx')
    const fileC = path.join(TEST_DIR, 'chain-c.stx')

    fs.writeFileSync(fileA, `<div class="a">@include('chain-b')</div>`)
    fs.writeFileSync(fileB, `<div class="b">@include('chain-c')</div>`)
    fs.writeFileSync(fileC, `<div class="c">@include('chain-a')</div>`)

    const options: StxOptions = {
      partialsDir: TEST_DIR,
      debug: true,
    }

    const result = await processIncludes(
      `@include('chain-a')`,
      {},
      path.join(TEST_DIR, 'main.stx'),
      options,
      new Set(),
    )

    expect(result).toContain('Circular include detected')
  })

  it('should allow including the same file from different branches (diamond pattern)', async () => {
    // Diamond pattern: main -> A -> shared, main -> B -> shared
    // This should NOT trigger circular detection
    const shared = path.join(TEST_DIR, 'shared.stx')
    const branchA = path.join(TEST_DIR, 'branch-a.stx')
    const branchB = path.join(TEST_DIR, 'branch-b.stx')

    fs.writeFileSync(shared, `<div class="shared">Shared content</div>`)
    fs.writeFileSync(branchA, `<div class="a">@include('shared')</div>`)
    fs.writeFileSync(branchB, `<div class="b">@include('shared')</div>`)

    const options: StxOptions = {
      partialsDir: TEST_DIR,
      debug: true,
    }

    const result = await processIncludes(
      `@include('branch-a') @include('branch-b')`,
      {},
      path.join(TEST_DIR, 'main.stx'),
      options,
      new Set(),
    )

    // Should contain content from both branches
    expect(result).toContain('class="a"')
    expect(result).toContain('class="b"')
    expect(result).toContain('Shared content')
    // Should NOT contain circular error
    expect(result).not.toContain('Circular include detected')
  })

  it('should include the error chain in circular detection message', async () => {
    // Create a circular chain to verify the chain is shown
    const fileX = path.join(TEST_DIR, 'x.stx')
    const fileY = path.join(TEST_DIR, 'y.stx')

    fs.writeFileSync(fileX, `<div>@include('y')</div>`)
    fs.writeFileSync(fileY, `<div>@include('x')</div>`)

    const options: StxOptions = {
      partialsDir: TEST_DIR,
      debug: true,
    }

    const result = await processIncludes(
      `@include('x')`,
      {},
      path.join(TEST_DIR, 'main.stx'),
      options,
      new Set(),
    )

    // The error message should contain the chain
    expect(result).toContain('Circular include detected')
    // Should show both files in the chain
    expect(result).toMatch(/x\.stx.*y\.stx|y\.stx.*x\.stx/)
  })
})
