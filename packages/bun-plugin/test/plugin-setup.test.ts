import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import plugin from '../src/index'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-plugin-setup')
const OUTPUT_DIR = path.join(TEMP_DIR, 'dist')

describe('BUN-PLUGIN: Plugin Setup & Configuration', () => {
  beforeEach(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })
    await fs.promises.mkdir(OUTPUT_DIR, { recursive: true })
  })

  afterEach(async () => {
    await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
  })

  test('should initialize plugin with default config', async () => {
    const testFile = path.join(TEMP_DIR, 'test.stx')
    await Bun.write(testFile, `
      <!DOCTYPE html>
      <html>
      <head><title>Test</title></head>
      <body><h1>Hello World</h1></body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    expect(result.outputs.length).toBeGreaterThanOrEqual(1)
  })

  test('should initialize plugin with custom stx options', async () => {
    const testFile = path.join(TEMP_DIR, 'test.stx')
    await Bun.write(testFile, `
      <!DOCTYPE html>
      <html>
      <head><title>Test</title></head>
      <body><h1>Hello World</h1></body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
      stx: {
        debug: true,
        cache: false,
        partialsDir: 'custom-partials',
        componentsDir: 'custom-components',
      },
    } as any)

    expect(result.success).toBe(true)
    expect(result.outputs.length).toBeGreaterThanOrEqual(1)
  })

  test('should register plugin in Bun build', async () => {
    // Test that the plugin name is correctly registered
    const pluginInstance = plugin()
    expect(pluginInstance.name).toBe('bun-plugin-stx')
    expect(typeof pluginInstance.setup).toBe('function')
  })

  test('should handle web components configuration', async () => {
    const testFile = path.join(TEMP_DIR, 'test.stx')
    await Bun.write(testFile, `
      <!DOCTYPE html>
      <html>
      <head><title>Test</title></head>
      <body><h1>Hello World</h1></body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
      stx: {
        webComponents: {
          enabled: true,
          outputDir: 'web-components',
          components: [
            {
              name: 'TestButton',
              tag: 'test-button',
              file: 'button.stx',
              attributes: ['type', 'text'],
            },
          ],
        },
      },
    } as any)

    expect(result.success).toBe(true)
  })

  test('should handle configuration errors gracefully', async () => {
    const testFile = path.join(TEMP_DIR, 'test.stx')
    await Bun.write(testFile, `
      <!DOCTYPE html>
      <html>
      <head><title>Test</title></head>
      <body><h1>Hello World</h1></body>
      </html>
    `)

    // Test with invalid configuration (should not crash)
    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
      stx: {
        // Intentionally invalid config for testing - should not cause errors
        invalidOption: 'invalid',
      },
    } as any)

    expect(result.success).toBe(true)
  })

  test('should initialize with default stx options when no config provided', async () => {
    const testFile = path.join(TEMP_DIR, 'simple.stx')
    await Bun.write(testFile, `
      <h1>Simple Template</h1>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
      // No config provided
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()
    expect(content).toContain('<h1>Simple Template</h1>')
  })
})
