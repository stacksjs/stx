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
  buildPageFragment,
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
    it('should detect app.stx in project root', () => {
      fs.writeFileSync(path.join(tmpDir, 'app.stx'), '<template><slot /></template>')
      const result = detectShell(tmpDir)
      expect(result).toBe(path.join(tmpDir, 'app.stx'))
    })

    it('should return null when no app.stx exists', () => {
      const emptyDir = path.join(tmpDir, 'empty')
      fs.mkdirSync(emptyDir, { recursive: true })
      const result = detectShell(emptyDir)
      expect(result).toBeNull()
    })

    it('should return null when shell is explicitly disabled', () => {
      const result = detectShell(tmpDir, false)
      expect(result).toBeNull()
    })

    it('should use custom shell path when configured', () => {
      const customShell = path.join(tmpDir, 'layout.stx')
      fs.writeFileSync(customShell, '<template><slot /></template>')
      const result = detectShell(tmpDir, 'layout.stx')
      expect(result).toBe(customShell)
    })

    it('should return null for non-existent custom shell', () => {
      const result = detectShell(tmpDir, 'nonexistent.stx')
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

    it('should extract shell scripts', async () => {
      const shellPath = path.join(tmpDir, 'shell-scripts.stx')
      fs.writeFileSync(shellPath, `<template><div><slot /></div></template>
<script>const x = 1</script>`)

      const result = await processShell(shellPath, {})
      expect(result).not.toBeNull()
      expect(result!.shellScripts.length).toBe(1)
      expect(result!.shellScripts[0]).toContain('const x = 1')
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

  describe('buildPageFragment', () => {
    it('should return page content as-is', () => {
      const page = '<h1>Hello</h1><p>World</p>'
      const result = buildPageFragment(page)
      expect(result).toBe(page)
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
