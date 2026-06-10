/**
 * Tests for App Shell (Phase 3c)
 */
import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import {
  detectShell,
  processShell,
  composeShellWithPage,
  stripDocumentWrapper,
  isSpaNavigation,
} from '../../src/app-shell'

const tmpDir = path.join(import.meta.dir, 'tmp-shell-test')

beforeAll(() => {
  fs.mkdirSync(tmpDir, { recursive: true })
  fs.mkdirSync(path.join(tmpDir, 'pages'), { recursive: true })
})

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('App Shell', () => {
  describe('detectShell', () => {
    // detectShell is async (Bun-first migration, #1715) — these calls must
    // be awaited; previously they compared a Promise against a string/null
    // and silently failed.
    it('should detect app.stx in project root', async () => {
      fs.writeFileSync(path.join(tmpDir, 'app.stx'), '<template><slot /></template>')
      const result = await detectShell(tmpDir)
      expect(result).toBe(path.join(tmpDir, 'app.stx'))
    })

    it('should return null when no app.stx exists', async () => {
      const emptyDir = path.join(tmpDir, 'empty')
      fs.mkdirSync(emptyDir, { recursive: true })
      const result = await detectShell(emptyDir)
      expect(result).toBeNull()
    })

    it('should return null when shell is explicitly disabled', async () => {
      const result = await detectShell(tmpDir, false)
      expect(result).toBeNull()
    })

    it('should use custom shell path when configured', async () => {
      const customShell = path.join(tmpDir, 'layout.stx')
      fs.writeFileSync(customShell, '<template><slot /></template>')
      const result = await detectShell(tmpDir, 'layout.stx')
      expect(result).toBe(customShell)
    })

    it('should return null for non-existent custom shell', async () => {
      const result = await detectShell(tmpDir, 'nonexistent.stx')
      expect(result).toBeNull()
    })
  })

  describe('processShell', () => {
    it('should split shell at <slot /> marker', async () => {
      const shellPath = path.join(tmpDir, 'shell-basic.stx')
      fs.writeFileSync(shellPath, `<template>
<div class="app">
  <nav>Navigation</nav>
  <main><slot /></main>
  <footer>Footer</footer>
</div>
</template>`)

      const result = await processShell(shellPath, {})
      expect(result).not.toBeNull()
      expect(result!.beforeSlot).toContain('Navigation')
      expect(result!.beforeSlot).toContain('<main>')
      expect(result!.afterSlot).toContain('</main>')
      expect(result!.afterSlot).toContain('Footer')
    })

    it('should handle self-closing <slot /> syntax', async () => {
      const shellPath = path.join(tmpDir, 'shell-selfclose.stx')
      fs.writeFileSync(shellPath, '<div class="app"><slot /></div>')

      const result = await processShell(shellPath, {})
      expect(result).not.toBeNull()
      expect(result!.beforeSlot).toContain('<div')
      expect(result!.afterSlot).toContain('</div>')
    })

    it('should handle <slot></slot> syntax', async () => {
      const shellPath = path.join(tmpDir, 'shell-open.stx')
      fs.writeFileSync(shellPath, '<div class="app"><slot></slot></div>')

      const result = await processShell(shellPath, {})
      expect(result).not.toBeNull()
      expect(result!.beforeSlot).toContain('<div')
      expect(result!.afterSlot).toContain('</div>')
    })

    it('should return null when shell has no <slot />', async () => {
      const shellPath = path.join(tmpDir, 'shell-noslot.stx')
      fs.writeFileSync(shellPath, '<div class="app">No slot here</div>')

      const result = await processShell(shellPath, {})
      expect(result).toBeNull()
    })

    it('should extract shell styles', async () => {
      const shellPath = path.join(tmpDir, 'shell-styles.stx')
      fs.writeFileSync(shellPath, `<template><div><slot /></div></template>
<style>.app { display: flex; }</style>`)

      const result = await processShell(shellPath, {})
      expect(result).not.toBeNull()
      expect(result!.shellStyles.length).toBe(1)
      expect(result!.shellStyles[0]).toContain('.app { display: flex; }')
    })

    it('should extract shell client scripts', async () => {
      const shellPath = path.join(tmpDir, 'shell-scripts.stx')
      fs.writeFileSync(shellPath, `<template><div><slot /></div></template>
<script client>const x = 1</script>`)

      const result = await processShell(shellPath, {})
      expect(result).not.toBeNull()
      expect(result!.shellScripts.length).toBe(1)
      expect(result!.shellScripts[0]).toContain('const x = 1')
    })

    it('should extract shell signals scripts', async () => {
      const shellPath = path.join(tmpDir, 'shell-signals.stx')
      fs.writeFileSync(shellPath, `<template><div><slot /></div></template>
<script>const collapsed = state(false)</script>`)

      const result = await processShell(shellPath, {})
      expect(result).not.toBeNull()
      expect(result!.shellScripts.length).toBe(1)
      expect(result!.shellScripts[0]).toContain('state(false)')
    })

    it('should not include server scripts in shell scripts', async () => {
      const shellPath = path.join(tmpDir, 'shell-server.stx')
      fs.writeFileSync(shellPath, `<template><div><slot /></div></template>
<script server>const data = await fetchData()</script>
<script client>const x = 1</script>`)

      const result = await processShell(shellPath, {})
      expect(result).not.toBeNull()
      expect(result!.shellScripts.length).toBe(1)
      expect(result!.shellScripts[0]).not.toContain('fetchData')
    })
  })

  describe('composeShellWithPage', () => {
    it('should compose shell with page content', async () => {
      const shellPath = path.join(tmpDir, 'shell-compose.stx')
      fs.writeFileSync(shellPath, `<template>
<div class="app">
  <nav>Nav</nav>
  <main><slot /></main>
</div>
</template>
<style>.app { display: flex; }</style>`)

      const shell = await processShell(shellPath, {})
      expect(shell).not.toBeNull()

      const result = composeShellWithPage(shell!, '<h1>Page Content</h1>', 'Test Page')

      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('<title>Test Page</title>')
      expect(result).toContain('Nav')
      expect(result).toContain('<div data-stx-content><h1>Page Content</h1></div>')
      expect(result).toContain('.app { display: flex; }')
    })

    it('should configure router container to data-stx-content', async () => {
      const shellPath = path.join(tmpDir, 'shell-router.stx')
      fs.writeFileSync(shellPath, '<div><slot /></div>')

      const shell = await processShell(shellPath, {})
      expect(shell).not.toBeNull()

      const result = composeShellWithPage(shell!, '<p>Page</p>')
      expect(result).toContain("container:'[data-stx-content]'")
    })
  })

  describe('stripDocumentWrapper', () => {
    it('should return fragments as-is', () => {
      const fragment = '<h1>Hello</h1><p>World</p>'
      const result = stripDocumentWrapper(fragment)
      expect(result).toBe(fragment)
    })

    it('should strip full document wrapper', () => {
      const doc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Page</title>
</head>
<body>
<h1>Hello</h1>
<p>World</p>
</body>
</html>`
      const result = stripDocumentWrapper(doc)
      expect(result).not.toContain('<!DOCTYPE')
      expect(result).not.toContain('<html')
      expect(result).not.toContain('<head')
      expect(result).not.toContain('<body')
      expect(result).not.toContain('</html>')
      expect(result).toContain('<h1>Hello</h1>')
      expect(result).toContain('<p>World</p>')
    })

    it('should preserve scripts from body', () => {
      const doc = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
<h1>Hello</h1>
<script data-stx-scoped>const x = 1;</script>
</body>
</html>`
      const result = stripDocumentWrapper(doc)
      expect(result).toContain('<script data-stx-scoped>const x = 1;</script>')
      expect(result).toContain('<h1>Hello</h1>')
    })

    it('should preserve styles from head', () => {
      const doc = `<!DOCTYPE html>
<html>
<head>
  <title>Test</title>
  <style>.card { color: red; }</style>
</head>
<body>
<div class="card">Content</div>
</body>
</html>`
      const result = stripDocumentWrapper(doc)
      expect(result).toContain('<style>.card { color: red; }</style>')
      expect(result).toContain('<div class="card">Content</div>')
      expect(result).not.toContain('<title>')
    })

    it('should strip meta and link tags from head', () => {
      const doc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <link rel="stylesheet" href="/style.css">
  <title>Test</title>
</head>
<body><p>Content</p></body>
</html>`
      const result = stripDocumentWrapper(doc)
      expect(result).not.toContain('<meta')
      expect(result).not.toContain('<link')
      expect(result).not.toContain('<title>')
      expect(result).toContain('<p>Content</p>')
    })
  })

  describe('page head preservation through shell composition (#1756)', () => {
    const pageDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Per-Page Title</title>
  <meta name="description" content="Page description">
  <link rel="canonical" href="https://example.com/page">
</head>
<body><h1>Content</h1></body>
</html>`

    it('preserveHead carries title/meta/link as an inert marker', () => {
      const fragment = stripDocumentWrapper(pageDoc, { preserveHead: true })
      expect(fragment).toContain('<!--stx-page-head:')
      expect(fragment).toContain('<h1>Content</h1>')
      // tags are encoded, not raw, in the fragment
      expect(fragment).not.toContain('<title>')
      expect(fragment).not.toContain('<meta name="description"')
      // default charset/viewport metas are not carried — the shell emits its own
      const encoded = fragment.match(/<!--stx-page-head:([A-Za-z0-9+/=]+)-->/)![1]
      const decoded = Buffer.from(encoded, 'base64').toString('utf8')
      expect(decoded).toContain('<title>Per-Page Title</title>')
      expect(decoded).toContain('<meta name="description" content="Page description">')
      expect(decoded).toContain('<link rel="canonical" href="https://example.com/page">')
      expect(decoded).not.toContain('charset')
      expect(decoded).not.toContain('viewport')
    })

    it('composeShellWithPage hoists the marker into the shell head', async () => {
      const shellPath = path.join(tmpDir, 'shell-hoist.stx')
      fs.writeFileSync(shellPath, '<div class="app"><slot /></div>')
      const shell = await processShell(shellPath, {})
      expect(shell).not.toBeNull()

      const fragment = stripDocumentWrapper(pageDoc, { preserveHead: true })
      const result = composeShellWithPage(shell!, fragment)

      expect(result).toContain('<title>Per-Page Title</title>')
      expect(result).not.toContain('<title>stx App</title>')
      const head = result.slice(0, result.indexOf('</head>'))
      expect(head).toContain('<meta name="description" content="Page description">')
      expect(head).toContain('<link rel="canonical" href="https://example.com/page">')
      // marker removed from the final document
      expect(result).not.toContain('stx-page-head:')
      // exactly one title in the document
      expect(result.match(/<title/g)!.length).toBe(1)
    })

    it('explicit pageTitle argument still wins over the hoisted title', async () => {
      const shellPath = path.join(tmpDir, 'shell-hoist2.stx')
      fs.writeFileSync(shellPath, '<div><slot /></div>')
      const shell = await processShell(shellPath, {})

      const fragment = stripDocumentWrapper(pageDoc, { preserveHead: true })
      const result = composeShellWithPage(shell!, fragment, 'Explicit Title')
      expect(result).toContain('<title>Explicit Title</title>')
      expect(result).not.toContain('Per-Page Title')
    })

    it('compose without a marker keeps the default title', async () => {
      const shellPath = path.join(tmpDir, 'shell-hoist3.stx')
      fs.writeFileSync(shellPath, '<div><slot /></div>')
      const shell = await processShell(shellPath, {})

      const result = composeShellWithPage(shell!, '<h1>No marker</h1>')
      expect(result).toContain('<title>stx App</title>')
    })
  })

  describe('isSpaNavigation', () => {
    it('should detect X-STX-Router header', () => {
      const request = new Request('http://localhost/test', {
        headers: { 'X-STX-Router': 'true' },
      })
      expect(isSpaNavigation(request)).toBe(true)
    })

    it('should return false for normal requests', () => {
      const request = new Request('http://localhost/test')
      expect(isSpaNavigation(request)).toBe(false)
    })
  })
})
