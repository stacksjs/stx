import { describe, expect, it } from 'bun:test'
import * as browser from '../src/browser'

describe('browser entry', () => {
  // Code inside a Craft window imports @stacksjs/desktop/browser. contextMenu
  // was only on the main entry, so a window importing it got undefined and
  // every right-click threw.
  it('carries the in-window wrappers a page needs', () => {
    expect(typeof browser.contextMenu?.pick).toBe('function')
    expect(typeof browser.sidebar?.create).toBe('function')
    expect(typeof browser.menu).toBe('object')
    expect(typeof browser.showMessageBox).toBe('function')
  })
})


it('bundles the browser entry without host-only FFI or Bun require glue', async () => {
  const result = await Bun.build({
    entrypoints: [new URL('../src/browser.ts', import.meta.url).pathname],
    target: 'browser',
    format: 'iife',
  })
  expect(result.success, result.logs.map(String).join('\n')).toBe(true)
  const script = await result.outputs[0].text()
  expect(script).not.toContain('bun:ffi')
  expect(script).not.toContain('import.meta.require')
  expect(() => new Function(script)).not.toThrow()
  expect('caffeinate' in browser).toBe(false)
})
