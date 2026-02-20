import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs, TEMP_DIR } from '../utils'

describe('Event Directives in Signal Components', () => {
  beforeAll(async () => {
    await setupTestDirs()
  })

  afterAll(cleanupTestDirs)

  it('should preserve @click in signal components for runtime processing', async () => {
    const componentFile = path.join(TEMP_DIR, 'components', 'ClickButton.stx')
    await Bun.write(componentFile, `
      <button @click="handleClick()">Click me</button>

      <script client>
        const { state } = window.stx
        const clicked = state(false)

        function handleClick() {
          clicked.set(true)
          console.log('Button clicked!')
        }
      </script>
    `)

    const testFile = await createTestFile('click-signal.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Click Signal Test</title></head>
      <body>
        <ClickButton />
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const html = await getHtmlOutput(result)

    // @click should be preserved for signal components
    expect(html).toContain('@click="handleClick()"')
    // Should NOT have id="__stx_evt_X"
    expect(html).not.toMatch(/<button[^>]*id="__stx_evt_\d+"/)
  })

  it('should preserve @click.self modifier in signal components', async () => {
    const componentFile = path.join(TEMP_DIR, 'components', 'Overlay.stx')
    await Bun.write(componentFile, `
      <div class="overlay" @click.self="closeOverlay()">
        <div class="content">
          <p>Modal content</p>
        </div>
      </div>

      <script client>
        const { state } = window.stx
        const isOpen = state(true)

        function closeOverlay() {
          isOpen.set(false)
        }
      </script>
    `)

    const testFile = await createTestFile('click-self.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Click Self Test</title></head>
      <body>
        <Overlay />
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const html = await getHtmlOutput(result)

    // @click.self should be preserved
    expect(html).toContain('@click.self="closeOverlay()"')
  })

  it('should preserve multiple event handlers in signal components', async () => {
    const componentFile = path.join(TEMP_DIR, 'components', 'Input.stx')
    await Bun.write(componentFile, `
      <input
        type="text"
        @input="handleInput($event)"
        @keydown.enter="handleSubmit()"
        @focus="handleFocus()"
        @blur="handleBlur()"
      />

      <script client>
        const { state } = window.stx
        const value = state('')
        const focused = state(false)

        function handleInput(e) {
          value.set(e.target.value)
        }

        function handleSubmit() {
          console.log('Submitted:', value())
        }

        function handleFocus() {
          focused.set(true)
        }

        function handleBlur() {
          focused.set(false)
        }
      </script>
    `)

    const testFile = await createTestFile('multiple-events.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Multiple Events Test</title></head>
      <body>
        <Input />
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const html = await getHtmlOutput(result)

    // All event handlers should be preserved
    expect(html).toContain('@input="handleInput($event)"')
    expect(html).toContain('@keydown.enter="handleSubmit()"')
    expect(html).toContain('@focus="handleFocus()"')
    expect(html).toContain('@blur="handleBlur()"')
  })

  it('should convert @click to IDs for non-signal components', async () => {
    const componentFile = path.join(TEMP_DIR, 'components', 'SimpleButton.stx')
    await Bun.write(componentFile, `
      <button @click="console.log('clicked')">Simple Click</button>

      <script client>
        // No signals here - just plain JS
        console.log('Component loaded')
      </script>
    `)

    const testFile = await createTestFile('click-non-signal.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Non-Signal Click Test</title></head>
      <body>
        <SimpleButton />
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const html = await getHtmlOutput(result)

    // Non-signal components should have @click converted to ID
    // because skipEventDirectives is only true for signal components
    expect(html).toMatch(/id="__stx_evt_\d+"/)
    expect(html).not.toContain('@click=')
  })

  it('should preserve @click in nested signal components', async () => {
    const parentComponent = path.join(TEMP_DIR, 'components', 'Parent.stx')
    await Bun.write(parentComponent, `
      <div class="parent">
        <button @click="parentClick()">Parent Button</button>
        <Child />
      </div>

      <script client>
        const { state } = window.stx
        const parentState = state(0)

        function parentClick() {
          parentState.set(parentState() + 1)
        }
      </script>
    `)

    const childComponent = path.join(TEMP_DIR, 'components', 'Child.stx')
    await Bun.write(childComponent, `
      <div class="child">
        <button @click="childClick()">Child Button</button>
      </div>

      <script client>
        const { state } = window.stx
        const childState = state(0)

        function childClick() {
          childState.set(childState() + 1)
        }
      </script>
    `)

    const testFile = await createTestFile('nested-events.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Nested Events Test</title></head>
      <body>
        <Parent />
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const html = await getHtmlOutput(result)

    // Both parent and child @click should be preserved
    expect(html).toContain('@click="parentClick()"')
    expect(html).toContain('@click="childClick()"')
  })
})
