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

  it('should build web component with slot processing (shadow DOM)', async () => {
    const dependencies = new Set<string>()

    // Create a component with slots
    const slotComponent = path.join(COMPONENTS_DIR, 'slot-test.stx')
    await Bun.write(slotComponent, `
      <div class="card">
        <div class="card-header">
          <slot name="header">Default Header</slot>
        </div>
        <div class="card-body">
          <slot>Default Content</slot>
        </div>
        <div class="card-footer">
          <slot name="footer">Default Footer</slot>
        </div>
      </div>
    `)

    const builtComponents = await buildWebComponents({
      debug: true,
      componentsDir: COMPONENTS_DIR,
      webComponents: {
        enabled: true,
        outputDir: WEB_COMPONENTS_DIR,
        components: [
          {
            name: 'SlotTest',
            tag: 'slot-test',
            file: slotComponent,
            shadowDOM: true, // Use shadow DOM (native slot support)
          },
        ],
      },
    }, dependencies)

    expect(builtComponents.length).toBe(1)

    const slotJs = await Bun.file(path.join(WEB_COMPONENTS_DIR, 'slot-test.js')).text()

    // Should contain shadow DOM setup
    expect(slotJs).toContain('attachShadow({ mode: "open" })')

    // Should contain _processSlots method with slot change listener
    expect(slotJs).toContain('_processSlots()')
    expect(slotJs).toContain('slotchange')
    expect(slotJs).toContain('slot-changed')

    // Should preserve native <slot> elements for shadow DOM
    expect(slotJs).toContain('<slot name="header">')
    expect(slotJs).toContain('<slot name="footer">')
    expect(slotJs).toContain('<slot>')
  })

  it('should build web component with slot processing (no shadow DOM)', async () => {
    const dependencies = new Set<string>()

    // Create a component with slots
    const noShadowComponent = path.join(COMPONENTS_DIR, 'no-shadow-slot.stx')
    await Bun.write(noShadowComponent, `
      <div class="panel">
        <slot name="title">Default Title</slot>
        <slot>Default Content</slot>
      </div>
    `)

    const builtComponents = await buildWebComponents({
      debug: true,
      componentsDir: COMPONENTS_DIR,
      webComponents: {
        enabled: true,
        outputDir: WEB_COMPONENTS_DIR,
        components: [
          {
            name: 'NoShadowSlot',
            tag: 'no-shadow-slot',
            file: noShadowComponent,
            shadowDOM: false, // No shadow DOM, manual slot processing
          },
        ],
      },
    }, dependencies)

    expect(builtComponents.length).toBe(1)

    const componentJs = await Bun.file(path.join(WEB_COMPONENTS_DIR, 'no-shadow-slot.js')).text()

    // Should NOT contain shadow DOM setup
    expect(componentJs).not.toContain('attachShadow')

    // Should contain _processSlots method with manual slot processing
    expect(componentJs).toContain('_processSlots()')
    expect(componentJs).toContain('data-slot')
    expect(componentJs).toContain('data-default-slot')

    // <slot> elements should be transformed to data-slot divs
    expect(componentJs).toContain('data-slot="title"')
    expect(componentJs).toContain('data-default-slot')
    expect(componentJs).not.toContain('<slot name="title">')
    expect(componentJs).not.toContain('<slot>')
  })

  it('runs native shadow slots and emits redistributed slotchange details', async () => {
    const sourceFile = path.join(COMPONENTS_DIR, 'runtime-shadow-slot.stx')
    await Bun.write(sourceFile, `
      <section>
        <slot name="heading">Fallback heading</slot>
        <slot>Fallback body</slot>
      </section>
    `)

    await buildWebComponents({
      componentsDir: COMPONENTS_DIR,
      webComponents: {
        enabled: true,
        outputDir: WEB_COMPONENTS_DIR,
        components: [{
          name: 'RuntimeShadowSlot',
          tag: 'runtime-shadow-slot-a',
          file: sourceFile,
          shadowDOM: true,
        }],
      },
    }, new Set<string>())
    await import(`${path.join(WEB_COMPONENTS_DIR, 'runtime-shadow-slot-a.js')}?test=${Date.now()}`)

    const element = document.createElement('runtime-shadow-slot-a')
    const heading = document.createElement('h2')
    const body = document.createElement('p')
    heading.setAttribute('slot', 'heading')
    heading.textContent = 'Projected heading'
    body.textContent = 'Projected body'
    element.append(heading, body)
    document.body.appendChild(element)

    const slots = element.shadowRoot!.querySelectorAll('slot') as HTMLSlotElement[]
    expect(slots[0]).toBeInstanceOf(HTMLSlotElement)
    expect(slots[0].assignedElements()).toEqual([heading])
    expect(slots[1].assignedElements()).toEqual([body])

    const changes: Array<{ slotName: string, assignedNodes: Node[] }> = []
    element.addEventListener('slot-changed', event => changes.push((event as CustomEvent).detail))
    // Let the initial assignment checkpoint settle before testing a second,
    // distinct redistribution. Browsers coalesce changes within one microtask.
    await Promise.resolve()
    changes.length = 0
    heading.removeAttribute('slot')
    await Promise.resolve()
    await Promise.resolve()

    expect(slots[0].assignedNodes()).toEqual([])
    expect(slots[1].assignedElements()).toEqual([heading, body])
    expect(changes.map(change => change.slotName)).toEqual(['heading', 'default'])
  })

  it('projects initial light DOM without cloning and survives reconnects', async () => {
    const sourceFile = path.join(COMPONENTS_DIR, 'runtime-light-slot.stx')
    await Bun.write(sourceFile, `
      <section>
        <header><slot name="title">Fallback title</slot></header>
        <main><slot>Fallback body</slot></main>
      </section>
    `)

    await buildWebComponents({
      componentsDir: COMPONENTS_DIR,
      webComponents: {
        enabled: true,
        outputDir: WEB_COMPONENTS_DIR,
        components: [{
          name: 'RuntimeLightSlot',
          tag: 'runtime-light-slot-a',
          file: sourceFile,
          shadowDOM: false,
        }],
      },
    }, new Set<string>())
    await import(`${path.join(WEB_COMPONENTS_DIR, 'runtime-light-slot-a.js')}?test=${Date.now()}`)

    const element = document.createElement('runtime-light-slot-a')
    const title = document.createElement('strong')
    const body = document.createElement('p')
    title.setAttribute('slot', 'title')
    title.textContent = 'Original title'
    body.textContent = 'Original body'
    let clicks = 0
    title.addEventListener('click', () => clicks++)
    element.append(title, body)
    document.body.appendChild(element)

    const titleSlot = element.querySelector('[data-slot="title"]')!
    const defaultSlot = element.querySelector('[data-default-slot]')!
    expect(titleSlot.firstChild).toBe(title)
    expect(defaultSlot.firstChild).toBe(body)
    expect(element.querySelectorAll('[slot="title"]')).toHaveLength(1)
    title.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(clicks).toBe(1)

    element.remove()
    document.body.appendChild(element)
    expect(element.querySelectorAll('section')).toHaveLength(1)
    expect(element.querySelector('[data-slot="title"]')!.firstChild).toBe(title)
    title.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(clicks).toBe(2)
  })

  it('emits type-safe deferred slot projection that compiles', async () => {
    const sourceFile = path.join(COMPONENTS_DIR, 'runtime-typed-slot.stx')
    await Bun.write(sourceFile, '<article><slot name="label"></slot><slot></slot></article>')

    await buildWebComponents({
      componentsDir: COMPONENTS_DIR,
      webComponents: {
        enabled: true,
        outputDir: WEB_COMPONENTS_DIR,
        components: [{
          name: 'RuntimeTypedSlot',
          tag: 'runtime-typed-slot-a',
          file: sourceFile,
          shadowDOM: false,
          outputFormat: 'ts',
        }],
      },
    }, new Set<string>())

    const source = await Bun.file(path.join(WEB_COMPONENTS_DIR, 'runtime-typed-slot-a.ts')).text()
    expect(source).toContain('private _slotContent: Node[] = []')
    expect(source).toContain('this._slotContent = Array.from(this.childNodes)')
    expect(source).not.toContain('slottedContent.cloneNode')

    const build = await Bun.build({
      entrypoints: [path.join(WEB_COMPONENTS_DIR, 'runtime-typed-slot-a.ts')],
      target: 'browser',
      format: 'esm',
      write: false,
    })
    expect(build.success).toBe(true)
    expect(build.logs).toEqual([])
  })
})
