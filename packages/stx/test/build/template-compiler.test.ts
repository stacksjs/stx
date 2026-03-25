/**
 * Tests for template compiler and hydrator
 */
import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { compileTemplate } from '../../src/template-compiler'
import { hydrateTemplate, hydrateFragment } from '../../src/template-hydrator'
import { createPlaceholder, replacePlaceholders, hasPlaceholders, resetPlaceholders } from '../../src/placeholder'

const tmpDir = path.join(import.meta.dir, 'tmp-compiler-test')

beforeAll(() => {
  fs.mkdirSync(tmpDir, { recursive: true })
  fs.mkdirSync(path.join(tmpDir, 'pages'), { recursive: true })
  fs.mkdirSync(path.join(tmpDir, 'partials'), { recursive: true })
})

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('Placeholder System', () => {
  it('should create unique placeholder tokens', () => {
    resetPlaceholders()
    const p1 = createPlaceholder('expr', 'user.name')
    const p2 = createPlaceholder('expr', 'user.email')
    expect(p1).toContain('__STX_EXPR_')
    expect(p2).toContain('__STX_EXPR_')
    expect(p1).not.toBe(p2)
  })

  it('should detect placeholders in HTML', () => {
    expect(hasPlaceholders('<div><!--__STX_EXPR_0__--></div>')).toBe(true)
    expect(hasPlaceholders('<div>Hello</div>')).toBe(false)
  })

  it('should replace placeholders with values', () => {
    const html = '<div><!--__STX_EXPR_0__--></div>'
    const values = new Map([['<!--__STX_EXPR_0__-->', 'Glenn']])
    expect(replacePlaceholders(html, values)).toBe('<div>Glenn</div>')
  })

  it('should replace multiple placeholders', () => {
    const html = '<h1><!--__STX_EXPR_0__--></h1><p><!--__STX_EXPR_1__--></p>'
    const values = new Map([
      ['<!--__STX_EXPR_0__-->', 'Title'],
      ['<!--__STX_EXPR_1__-->', 'Body'],
    ])
    expect(replacePlaceholders(html, values)).toBe('<h1>Title</h1><p>Body</p>')
  })
})

describe('Template Compiler', () => {
  it('should compile a static page', async () => {
    const pagePath = path.join(tmpDir, 'pages/static.stx')
    fs.writeFileSync(pagePath, '<h1>Hello World</h1>')

    const compiled = await compileTemplate(pagePath, '/')
    expect(compiled.route).toBe('/')
    expect(compiled.sourceFile).toBe(pagePath)
    expect(compiled.html).toContain('Hello World')
    expect(compiled.contentHash).toHaveLength(16)
    expect(compiled.hasServerScripts).toBe(false)
    expect(compiled.serverScriptContent).toEqual([])
  })

  it('should detect server scripts', async () => {
    const pagePath = path.join(tmpDir, 'pages/dynamic.stx')
    fs.writeFileSync(pagePath, `<script server>
const title = 'Dynamic'
</script>
<h1>{{ title }}</h1>`)

    const compiled = await compileTemplate(pagePath, '/dynamic')
    expect(compiled.hasServerScripts).toBe(true)
    expect(compiled.serverScriptContent.length).toBe(1)
    expect(compiled.serverScriptContent[0]).toContain("const title = 'Dynamic'")
  })

  it('should use external runtime reference in compile mode', async () => {
    const pagePath = path.join(tmpDir, 'pages/signals.stx')
    fs.writeFileSync(pagePath, `<script>
const count = state(0)
</script>
<div>{{ count() }}</div>`)

    const compiled = await compileTemplate(pagePath, '/signals')
    // Should have external script src, not inline runtime
    expect(compiled.html).toContain('/__stx/runtime.__STX_HASH__.js')
    expect(compiled.html).not.toContain('let activeEffect')
  })

  it('should produce a fragment', async () => {
    const pagePath = path.join(tmpDir, 'pages/frag.stx')
    fs.writeFileSync(pagePath, '<div class="content"><p>Page content</p></div>')

    const compiled = await compileTemplate(pagePath, '/frag')
    expect(compiled.fragment).toContain('Page content')
    // Fragment should not have document wrapper
    expect(compiled.fragment).not.toContain('<!DOCTYPE')
  })

  it('should produce deterministic content hash', async () => {
    const pagePath = path.join(tmpDir, 'pages/hash.stx')
    fs.writeFileSync(pagePath, '<h1>Deterministic</h1>')

    const a = await compileTemplate(pagePath, '/hash')
    const b = await compileTemplate(pagePath, '/hash')
    expect(a.contentHash).toBe(b.contentHash)
  })
})

describe('Template Hydrator', () => {
  it('should return static HTML as-is', async () => {
    const compiled = {
      route: '/',
      sourceFile: '/test.stx',
      html: '<h1>Static</h1>',
      fragment: '<h1>Static</h1>',
      placeholders: {},
      hasServerScripts: false,
      serverScriptContent: [],
      dependencies: [],
      contentHash: 'abc123',
    }

    const result = await hydrateTemplate(compiled)
    expect(result).toBe('<h1>Static</h1>')
  })

  it('should execute server scripts and populate context', async () => {
    const compiled = {
      route: '/dynamic',
      sourceFile: '/test.stx',
      html: '<h1>Test</h1>',
      fragment: '<h1>Test</h1>',
      placeholders: {},
      hasServerScripts: true,
      serverScriptContent: ['const greeting = "Hello"'],
      dependencies: [],
      contentHash: 'abc123',
    }

    // Even without placeholders, server scripts execute for side effects
    const result = await hydrateTemplate(compiled)
    expect(result).toBe('<h1>Test</h1>')
  })

  it('should hydrate fragments', async () => {
    const compiled = {
      route: '/',
      sourceFile: '/test.stx',
      html: '<!DOCTYPE html><html><body><h1>Full</h1></body></html>',
      fragment: '<h1>Fragment</h1>',
      placeholders: {},
      hasServerScripts: false,
      serverScriptContent: [],
      dependencies: [],
      contentHash: 'abc123',
    }

    const result = await hydrateFragment(compiled)
    expect(result).toBe('<h1>Fragment</h1>')
  })
})
