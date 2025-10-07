import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { buildWebComponents } from '../../src/web-components'
import { OUTPUT_DIR, setupTestDirs, TEMP_DIR } from '../utils'

describe('stx Web Components', () => {
  const COMPONENTS_DIR = path.join(TEMP_DIR, 'components')
  const WEB_COMPONENTS_DIR = path.join(OUTPUT_DIR, 'web-components')

  beforeAll(async () => {
    await setupTestDirs()
    await fs.promises.mkdir(COMPONENTS_DIR, { recursive: true })

    // Create a component file
    const buttonComponent = path.join(COMPONENTS_DIR, 'button.stx')
    await Bun.write(buttonComponent, `
      <button class="btn {{ type ? 'btn-' + type : '' }}" {{ disabled ? 'disabled' : '' }}>
        <span class="btn-icon">{{ icon ? '📎' : '' }}</span>
        <span class="btn-text">{{ text || slot }}</span>
      </button>
    `)

    // Create a card component
    const cardComponent = path.join(COMPONENTS_DIR, 'card.stx')
    await Bun.write(cardComponent, `
      <div class="card {{ cardClass }}">
        <div class="card-header">{{ title }}</div>
        <div class="card-body">
          {{ content || slot }}
        </div>
        <div class="card-footer">{{ footer }}</div>
      </div>
    `)

    // Create the web components directory
    await fs.promises.mkdir(WEB_COMPONENTS_DIR, { recursive: true })
  })

  afterAll(async () => {
    try {
      // Check if directory exists before trying to remove it
      const dirExists = await fs.promises.stat(WEB_COMPONENTS_DIR)
        .then(() => true)
        .catch(() => false)

      if (dirExists) {
        // Use recursive deletion from fs/promises
        await fs.promises.rm(WEB_COMPONENTS_DIR, { recursive: true, force: true })
      }
    }
    catch (error) {
      console.warn('Failed to clean up web components directory:', error)
    }
  })

  it('should build web components directly', async () => {
    const dependencies = new Set<string>()

    // Call the buildWebComponents function directly
    const builtComponents = await buildWebComponents({
      debug: true,
      componentsDir: COMPONENTS_DIR,
      webComponents: {
        enabled: true,
        outputDir: WEB_COMPONENTS_DIR,
        components: [
          {
            name: 'MyButton',
            tag: 'my-button',
            file: path.join(COMPONENTS_DIR, 'button.stx'),
            attributes: ['type', 'text', 'disabled', 'icon'],
          },
          {
            name: 'MyCard',
            tag: 'my-card',
            file: path.join(COMPONENTS_DIR, 'card.stx'),
            attributes: ['title', 'footer', 'cardClass'],
          },
        ],
      },
    }, dependencies)

    // Verify components were built
    expect(builtComponents.length).toBe(2)
    expect(builtComponents[0]).toContain('my-button.js')
    expect(builtComponents[1]).toContain('my-card.js')

    // Check file existence
    expect(await fs.promises.stat(path.join(WEB_COMPONENTS_DIR, 'my-button.js'))).toBeTruthy()
    expect(await fs.promises.stat(path.join(WEB_COMPONENTS_DIR, 'my-card.js'))).toBeTruthy()

    // Verify file contents
    const buttonJs = await Bun.file(path.join(WEB_COMPONENTS_DIR, 'my-button.js')).text()
    expect(buttonJs).toContain('class MyButton extends HTMLElement')
    expect(buttonJs).toContain('customElements.define(\'my-button\', MyButton)')

    const cardJs = await Bun.file(path.join(WEB_COMPONENTS_DIR, 'my-card.js')).text()
    expect(cardJs).toContain('class MyCard extends HTMLElement')
    expect(cardJs).toContain('customElements.define(\'my-card\', MyCard)')
  })
})
