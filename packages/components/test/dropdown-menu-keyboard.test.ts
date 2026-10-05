/**
 * `<Dropdown>` is operable from the keyboard (stacksjs/stx#2032).
 *
 * The menu had no key handling at all, and its items could not even receive
 * focus: `<DropdownItem>` renders a div with `role="menuitem"` and no
 * `tabindex`, so there was nothing to move focus to — and a div does not
 * activate on Enter the way a button does. Both halves had to change.
 *
 * Driven with real keydown events and read back through `document.activeElement`,
 * because the thing under test IS where focus is. Asserting on the source
 * would only prove the handler exists.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

const UI = path.join(import.meta.dir, '..', 'src', 'ui', 'dropdown')
const read = (name: string) => readFileSync(path.join(UI, name), 'utf-8')

const ITEMS = `
  <DropdownItems>
    <DropdownItem value="one">One</DropdownItem>
    <DropdownItem value="two">Two</DropdownItem>
    <DropdownItem value="three" disabled>Three</DropdownItem>
    <DropdownItem value="four">Four</DropdownItem>
  </DropdownItems>`

async function mount() {
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    'components/Dropdown.stx': read('Dropdown.stx'),
    'components/DropdownButton.stx': read('DropdownButton.stx'),
    'components/DropdownItems.stx': read('DropdownItems.stx'),
    'components/DropdownItem.stx': read('DropdownItem.stx'),
    'pages/index.stx': page('app', `<div id="host"><Dropdown><DropdownButton>Open</DropdownButton>${ITEMS}</Dropdown></div>`),
  }, { '/': 'pages/index.stx' })
  const browser = await boot(app, '/')
  await settle()

  const doc = browser.window.document
  const scope = Object.values(browser.window.stx._scopes || {})
    .find((s: any) => typeof s?.toggle === 'function' && typeof s?.isOpen === 'function') as Record<string, any>
  if (!scope)
    throw new Error('dropdown scope not registered')

  const items = Array.from<any>(doc.querySelectorAll('[data-stx-dropdown-item]'))
  return {
    scope,
    doc,
    trigger: doc.querySelector('[data-stx-dropdown-button]'),
    /*
     * Selections are observed here rather than on the document, because
     * `Dropdown.onItemSelect` calls `stopPropagation()` -- by design, so a
     * nested dropdown's choice is not also its parent's. The menu container is
     * below that point and above the items.
     */
    menu: doc.querySelector('[data-stx-dropdown-items]'),
    items,
    /** The items a keyboard user can reach — the disabled one is not one of them. */
    enabled: items.filter(i => i.getAttribute('aria-disabled') !== 'true'),
    label: () => doc.activeElement && doc.activeElement.textContent?.trim(),
    press: (key: string, target?: any) => {
      (target ?? doc.activeElement ?? doc).dispatchEvent(
        new browser.window.KeyboardEvent('keydown', { key, bubbles: true }),
      )
    },
    dispose: () => app.dispose(),
  }
}

afterEach(() => {
  closeBrowser()
})

describe('a menu item can be focused at all', () => {
  it('gives every item a tabindex, since a menuitem div has none', async () => {
    const m = await mount()
    try {
      expect(m.items.length).toBe(4)
      for (const item of m.items)
        expect(item.getAttribute('tabindex'), item.textContent?.trim()).toBe('-1')
    }
    finally {
      await m.dispose()
    }
  })
})

describe('Dropdown moves focus with the arrow keys (#2032)', () => {
  it('opens on ArrowDown from the closed trigger, landing on the first item', async () => {
    const m = await mount()
    try {
      m.press('ArrowDown', m.trigger)
      await settle()

      expect(m.scope.isOpen()).toBe(true)
      expect(m.label()).toBe('One')
    }
    finally {
      await m.dispose()
    }
  })

  it('opens upward on ArrowUp, landing on the last item', async () => {
    const m = await mount()
    try {
      m.press('ArrowUp', m.trigger)
      await settle()

      expect(m.scope.isOpen()).toBe(true)
      expect(m.label()).toBe('Four')
    }
    finally {
      await m.dispose()
    }
  })

  it('walks down the items and wraps round', async () => {
    const m = await mount()
    try {
      m.press('ArrowDown', m.trigger)
      await settle()
      expect(m.label()).toBe('One')

      m.press('ArrowDown')
      expect(m.label()).toBe('Two')

      // Three is disabled: focusing it would read as the menu being broken.
      m.press('ArrowDown')
      expect(m.label()).toBe('Four')

      m.press('ArrowDown')
      expect(m.label(), 'wrapped to the top').toBe('One')

      m.press('ArrowUp')
      expect(m.label(), 'wrapped back to the bottom').toBe('Four')
    }
    finally {
      await m.dispose()
    }
  })

  it('jumps to the ends with Home and End', async () => {
    const m = await mount()
    try {
      m.press('ArrowDown', m.trigger)
      await settle()

      m.press('End')
      expect(m.label()).toBe('Four')

      m.press('Home')
      expect(m.label()).toBe('One')
    }
    finally {
      await m.dispose()
    }
  })

  it('never lands on a disabled item', async () => {
    const m = await mount()
    try {
      m.press('ArrowDown', m.trigger)
      await settle()

      const seen: (string | undefined)[] = []
      for (let i = 0; i < 8; i++) {
        seen.push(m.label())
        m.press('ArrowDown')
      }

      expect(m.enabled).toHaveLength(3)
      expect(seen).not.toContain('Three')
    }
    finally {
      await m.dispose()
    }
  })
})

describe('Dropdown activates the focused item', () => {
  it('selects on Enter, which a div would otherwise ignore', async () => {
    const m = await mount()
    try {
      const picked: unknown[] = []
      m.menu.addEventListener('stx:dropdown-select', (e: any) => picked.push(e.detail))

      m.press('ArrowDown', m.trigger)
      await settle()
      m.press('ArrowDown')
      expect(m.label()).toBe('Two')

      m.press('Enter')
      await settle()

      expect(picked).toEqual(['two'])
      expect(m.scope.isOpen(), 'and it closes behind the choice').toBe(false)
    }
    finally {
      await m.dispose()
    }
  })

  it('selects on Space as well', async () => {
    const m = await mount()
    try {
      const picked: unknown[] = []
      m.menu.addEventListener('stx:dropdown-select', (e: any) => picked.push(e.detail))

      m.press('ArrowDown', m.trigger)
      await settle()
      m.press(' ')
      await settle()

      expect(picked).toEqual(['one'])
    }
    finally {
      await m.dispose()
    }
  })

  it('closes when focus leaves on Tab', async () => {
    const m = await mount()
    try {
      m.press('ArrowDown', m.trigger)
      await settle()
      expect(m.scope.isOpen()).toBe(true)

      m.press('Tab')
      await settle()

      expect(m.scope.isOpen()).toBe(false)
    }
    finally {
      await m.dispose()
    }
  })

  /*
   * The handler is on the document, so Escape works before focus has moved
   * into the panel. That makes an unguarded arrow key a page-wide scroll
   * hijack, so everything but Escape is gated on the event coming from inside
   * this dropdown.
   */
  it('leaves arrow keys alone when they come from outside the dropdown', async () => {
    const m = await mount()
    try {
      const outside = m.doc.getElementById('host').ownerDocument.body

      m.press('ArrowDown', outside)
      await settle()

      expect(m.scope.isOpen(), 'an ArrowDown on the body is not ours').toBe(false)
    }
    finally {
      await m.dispose()
    }
  })
})
