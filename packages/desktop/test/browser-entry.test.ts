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
