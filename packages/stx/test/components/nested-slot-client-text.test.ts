import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs, TEMP_DIR } from '../utils'

/**
 * A component's `{{ signal() }}` text, when the component sits in another
 * component's slot. The inner component leaves it for the client; the outer
 * one used to evaluate it again in the caller's scope, where the name is
 * undefined, and render nothing. On a native screen every element is a
 * component, so every component's text binding was lost that way.
 */
const counter = `<script client>const count = state(3)</script><div><span>{{ count() + ' items' }}</span></div>`

describe('client text in a component inside another component', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  it('keeps it for the browser', async () => {
    await Bun.write(path.join(TEMP_DIR, 'components', 'Counter.stx'), counter)
    await Bun.write(path.join(TEMP_DIR, 'components', 'Panel.stx'), '<section class="panel"><slot /></section>')
    const file = await createTestFile('nested-slot-client-text.stx', '<!DOCTYPE html><html><body><Panel><Counter /></Panel></body></html>')
    const result = await Bun.build({ entrypoints: [file], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
    const html = await getHtmlOutput(result)
    expect(html).toContain('{{ count() + \' items\' }}')
  })

  it('shows it on a native screen, where View and Text are components too', async () => {
    const root = createTempDir('stx-nested-slot-text-')
    await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
    await Bun.write(path.join(root, 'components', 'Counter.stx'), `<script client>const count = state(3)</script><View><Text>{{ count() + ' items' }}</Text></View>`)
    const file = path.join(root, 'Screen.stx')
    await Bun.write(file, '<View><Counter /></View>')
    const { code } = await compileSharedScreenBundle(file, { root })
    const screen = mountNativeScreen(code, 'Screen')
    await screen.settle()
    expect(screen.texts()).toEqual(['3 items'])
  })
})
