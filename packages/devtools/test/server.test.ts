import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-server')
const PACKAGE_ROOT = path.resolve(TEST_DIR, '..')

describe('DEVTOOLS: Server Functionality Tests', () => {
  beforeEach(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })
  })

  afterEach(async () => {
    await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
  })

  test('should have devtools server module', async () => {
    const serverPath = path.join(PACKAGE_ROOT, 'devtools-server.ts')
    const exists = await Bun.file(serverPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(serverPath).text()
    expect(content).toContain('serve')
    expect(content.length).toBeGreaterThan(0)
  })

  test('should export server functionality', async () => {
    const serverPath = path.join(PACKAGE_ROOT, 'devtools-server.ts')
    const content = await Bun.file(serverPath).text()

    // Check for server setup code
    expect(content).toMatch(/serve|port|fetch/)
  })

  test('should have main index module', async () => {
    const indexPath = path.join(PACKAGE_ROOT, 'src/index.ts')
    const exists = await Bun.file(indexPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(indexPath).text()
    expect(content.length).toBeGreaterThan(0)
  })

  test('should validate package.json configuration', async () => {
    const packagePath = path.join(PACKAGE_ROOT, 'package.json')
    const exists = await Bun.file(packagePath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(packagePath).text()
    const packageJson = JSON.parse(content)

    expect(packageJson.name).toBeDefined()
    expect(packageJson.scripts).toBeDefined()
    expect(packageJson.scripts.test).toBeDefined()
  })

  test('should have valid STX configuration', async () => {
    const configPath = path.join(PACKAGE_ROOT, 'src/stx.config.ts')
    const exists = await Bun.file(configPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(configPath).text()
    expect(content).toContain('export')
    expect(content).toMatch(/StxConfig|export\s+default|export\s+const/)
  })

  test('should validate static assets exist', async () => {
    const publicAssets = [
      'public/index.html',
      'public/dashboard.html',
      'public/performance.html',
      'public/templates.html',
      'public/config.html',
    ].map(asset => path.join(PACKAGE_ROOT, asset))

    for (const assetPath of publicAssets) {
      const exists = await Bun.file(assetPath).exists()
      expect(exists).toBe(true)

      const content = await Bun.file(assetPath).text()
      // These are HTML fragments/compiled templates, not full HTML documents
      expect(content.length).toBeGreaterThan(0)
      expect(content).toMatch(/<div|<section|<h[1-6]/)
    }
  })

  test('should validate icon assets exist', async () => {
    const iconPaths = [
      'public/icons/dashboard.svg',
      'public/icons/chart-line.svg',
      'public/icons/document.svg',
      'public/icons/settings.svg',
      'public/icons/assembly-cluster.svg',
    ].map(icon => path.join(PACKAGE_ROOT, icon))

    for (const iconPath of iconPaths) {
      const exists = await Bun.file(iconPath).exists()
      expect(exists).toBe(true)
    }
  })

  test('should have proper TypeScript configuration', async () => {
    const tsconfigPath = path.join(PACKAGE_ROOT, 'tsconfig.json')
    const exists = await Bun.file(tsconfigPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(tsconfigPath).text()
    const tsconfig = JSON.parse(content)

    expect(tsconfig.compilerOptions).toBeDefined()
    expect(tsconfig.compilerOptions.target).toBeDefined()
  })

  test('should validate devtools bundle configuration', async () => {
    const bunfigPath = path.join(PACKAGE_ROOT, 'bunfig.toml')
    const exists = await Bun.file(bunfigPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(bunfigPath).text()
    expect(content).toContain('[')
  })

  test('should validate UnoCSS configuration', async () => {
    const unoConfigPath = path.join(PACKAGE_ROOT, 'uno.config.ts')
    const exists = await Bun.file(unoConfigPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(unoConfigPath).text()
    expect(content).toContain('export')
    expect(content).toMatch(/defineConfig|export\s+default/)
  })

  test('should validate UnoCSS source configuration', async () => {
    const srcUnoConfigPath = path.join(PACKAGE_ROOT, 'src/uno.config.ts')
    const exists = await Bun.file(srcUnoConfigPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(srcUnoConfigPath).text()
    expect(content).toContain('export')
  })

  test('should validate STX type definitions', async () => {
    const stxTypesPath = path.join(PACKAGE_ROOT, 'src/stx.d.ts')
    const exists = await Bun.file(stxTypesPath).exists()
    expect(exists).toBe(true)

    const content = await Bun.file(stxTypesPath).text()
    expect(content).toMatch(/declare|interface|type|namespace/)
  })

  test('should have proper HTML structure in public files', async () => {
    const htmlFiles = [
      'public/index.html',
      'public/dashboard.html',
      'public/performance.html',
    ].map(html => path.join(PACKAGE_ROOT, html))

    for (const htmlPath of htmlFiles) {
      const content = await Bun.file(htmlPath).text()

      // These are HTML fragments/compiled templates, not full HTML documents
      expect(content.length).toBeGreaterThan(0)
      expect(content).toMatch(/<div|<section|<h[1-6]/)
    }
  })

  test('should validate favicon exists', async () => {
    const faviconPath = path.join(PACKAGE_ROOT, 'public/favicon.ico')
    const exists = await Bun.file(faviconPath).exists()
    expect(exists).toBe(true)
  })

  test('should check for development server setup', async () => {
    const serverPath = path.join(PACKAGE_ROOT, 'devtools-server.ts')
    const content = await Bun.file(serverPath).text()

    // Check for server-related code
    expect(content).toMatch(/server|listen|port|Bun\.serve/)
  })

  test('should validate component integration in views', async () => {
    const dashboardPath = path.join(PACKAGE_ROOT, 'src/views/dashboard.stx')
    const content = await Bun.file(dashboardPath).text()

    // Check for STX template features
    expect(content).toMatch(/@extends|@include|@foreach|\{\{/)
    // Should have some kind of STX directive or placeholder
    expect(content).toMatch(/@\w+|\{\{.*\}\}/)
  })
})
