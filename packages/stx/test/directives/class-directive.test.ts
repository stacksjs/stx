import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs, TEMP_DIR } from '../utils'

describe('@class Directive', () => {
  beforeAll(async () => {
    await setupTestDirs()
  })

  afterAll(cleanupTestDirs)

  it('should preserve @class directive for runtime processing', async () => {
    const testFile = await createTestFile('class-directive.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Class Directive Test</title></head>
      <body>
        <div @class="{ 'active': isActive, 'hidden': !isVisible }">Test</div>

        <script>
          const { state } = window.stx
          const isActive = state(true)
          const isVisible = state(true)
        </script>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const html = await getHtmlOutput(result)

    // @class should be preserved for runtime processing
    expect(html).toContain('@class=')
    expect(html).toContain('active')
    expect(html).toContain('hidden')
  })

  it('should preserve @class with signal function calls', async () => {
    const testFile = await createTestFile('class-signal.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Class Signal Test</title></head>
      <body>
        <button @class="{ 'text-pink': isRecording(), 'text-gray': !isRecording() }">Record</button>

        <script>
          const { state } = window.stx
          const isRecording = state(false)
        </script>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const html = await getHtmlOutput(result)

    // @class with signal calls should be preserved
    expect(html).toContain('@class=')
    expect(html).toContain('isRecording()')
    expect(html).toContain('text-pink')
  })

  it('should work with @class in signal-scoped components', async () => {
    const componentFile = path.join(TEMP_DIR, 'components', 'Modal.stx')
    await Bun.write(componentFile, `
      <div class="modal-overlay" @class="{ 'hidden': !isOpen(), 'flex': isOpen() }">
        <div class="modal-content">
          <button @click="close()">Close</button>
        </div>
      </div>

      <script client>
        const { state } = window.stx
        const isOpen = state(false)

        function close() {
          isOpen.set(false)
        }
      </script>
    `)

    const testFile = await createTestFile('class-component.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Class Component Test</title></head>
      <body>
        <Modal />
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const html = await getHtmlOutput(result)

    // Component should have data-stx-scope (lowercase component name)
    expect(html).toMatch(/data-stx-scope="stx_modal_\d+_[a-z0-9]+"/)

    // @class should be preserved for runtime
    expect(html).toContain('@class=')
    expect(html).toContain('isOpen()')
  })

  it('should handle @class with multiple conditional classes', async () => {
    const testFile = await createTestFile('class-multiple.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Multiple Classes Test</title></head>
      <body>
        <div
          class="base-class"
          @class="{
            'border-pink': isRecording(),
            'border-gray': !isRecording(),
            'bg-dark': isDark(),
            'opacity-50': isDisabled()
          }"
        >Content</div>

        <script>
          const { state } = window.stx
          const isRecording = state(false)
          const isDark = state(true)
          const isDisabled = state(false)
        </script>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const html = await getHtmlOutput(result)

    // All class conditions should be preserved
    expect(html).toContain('border-pink')
    expect(html).toContain('border-gray')
    expect(html).toContain('bg-dark')
    expect(html).toContain('opacity-50')
    expect(html).toContain('base-class')
  })
})
