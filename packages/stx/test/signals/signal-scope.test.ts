import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs, TEMP_DIR } from '../utils'

describe('Signal Scoped Components', () => {
  beforeAll(async () => {
    await setupTestDirs()
  })

  afterAll(cleanupTestDirs)

  it('should wrap signal components with data-stx-scope', async () => {
    const componentFile = path.join(TEMP_DIR, 'components', 'Counter.stx')
    await Bun.write(componentFile, `
      <div class="counter">
        <span>{{ count() }}</span>
        <button @click="increment()">+</button>
      </div>

      <script client>
        const { state } = window.stx
        const count = state(0)

        function increment() {
          count.set(count() + 1)
        }
      </script>
    `)

    const testFile = await createTestFile('signal-scope.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Signal Scope Test</title></head>
      <body>
        <Counter />
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const html = await getHtmlOutput(result)

    // Component should be wrapped with data-stx-scope (lowercase component name)
    expect(html).toMatch(/data-stx-scope="stx_counter_\d+_[a-z0-9]+"/)
  })

  it('should register scope variables in window.stx._scopes', async () => {
    const componentFile = path.join(TEMP_DIR, 'components', 'Toggle.stx')
    await Bun.write(componentFile, `
      <button @click="toggle()">Toggle</button>

      <script client>
        const { state } = window.stx
        const isOpen = state(false)

        function toggle() {
          isOpen.set(!isOpen())
        }
      </script>
    `)

    const testFile = await createTestFile('scope-registration.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Scope Registration Test</title></head>
      <body>
        <Toggle />
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const html = await getHtmlOutput(result)

    // Should have scope registration code
    expect(html).toContain('window.stx._scopes')
    expect(html).toContain('__scopeVars')
    expect(html).toContain('__localVars')
  })

  it('should preserve @click handlers for signal components (not convert to IDs)', async () => {
    const componentFile = path.join(TEMP_DIR, 'components', 'Button.stx')
    await Bun.write(componentFile, `
      <button @click="handleClick()">Click me</button>

      <script client>
        const { state } = window.stx
        const clicked = state(false)

        function handleClick() {
          clicked.set(true)
        }
      </script>
    `)

    const testFile = await createTestFile('click-preserved.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Click Preserved Test</title></head>
      <body>
        <Button />
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const html = await getHtmlOutput(result)

    // Signal components should have @click preserved for runtime processing
    expect(html).toContain('@click="handleClick()"')
    // Should NOT have been converted to id="__stx_evt_X"
    expect(html).not.toMatch(/id="__stx_evt_\d+"[^>]*>Click me/)
  })

  it('should prepend scope scripts before HTML for correct initialization order', async () => {
    const componentFile = path.join(TEMP_DIR, 'components', 'InitOrder.stx')
    await Bun.write(componentFile, `
      <div class="init-test">Test</div>

      <script client>
        const { state } = window.stx
        const ready = state(false)
      </script>
    `)

    const testFile = await createTestFile('init-order.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Init Order Test</title></head>
      <body>
        <InitOrder />
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const html = await getHtmlOutput(result)

    // Find positions of script and HTML
    const scriptPos = html.indexOf('window.stx._scopes')
    const htmlPos = html.indexOf('class="init-test"')

    // Script should come before the HTML element
    expect(scriptPos).toBeLessThan(htmlPos)
  })
})
