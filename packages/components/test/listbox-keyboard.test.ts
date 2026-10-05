/**
 * `<Listbox>` is operable from the keyboard (stacksjs/stx#2032).
 *
 * Same two gaps as `<Dropdown>`: no key handling, and `<ListboxOption>`
 * renders an `<li role="option">` with no `tabindex`, so focus had nowhere to
 * go and Enter did nothing on it.
 *
 * Enter and Space are asserted as far as the CLICK they deliver: whether that
 * click selects is `<ListboxOption>`'s own path, which stacksjs/stx#2033
 * breaks for more than one option. Clicking with a mouse is equally dead
 * there, so this is not a regression -- but asserting the selection would pin
 * that bug as expected behaviour.
 *
 * Arrows move FOCUS and deliberately do not change the selection. Selection
 * following focus is a documented APG variant and the louder of the two:
 * arrowing past an option should not commit a value the user was only passing
 * over. The tests pin that, since it is a choice rather than an oversight.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

const UI = path.join(import.meta.dir, '..', 'src', 'ui', 'listbox')
const read = (name: string) => readFileSync(path.join(UI, name), 'utf-8')

const OPTIONS = `
  <ListboxOptions>
    <ListboxOption value="apple">Apple</ListboxOption>
    <ListboxOption value="banana">Banana</ListboxOption>
    <ListboxOption value="cherry" disabled>Cherry</ListboxOption>
    <ListboxOption value="damson">Damson</ListboxOption>
  </ListboxOptions>`

async function mount(tag = '<Listbox>') {
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    'components/Listbox.stx': read('Listbox.stx'),
    'components/ListboxButton.stx': read('ListboxButton.stx'),
    'components/ListboxOptions.stx': read('ListboxOptions.stx'),
    'components/ListboxOption.stx': read('ListboxOption.stx'),
    'pages/index.stx': page('app', `<div id="host">${tag}<ListboxButton>Pick</ListboxButton>${OPTIONS}</Listbox></div>`),
  }, { '/': 'pages/index.stx' })
  const browser = await boot(app, '/')
  await settle()

  const doc = browser.window.document
  const scope = Object.values(browser.window.stx._scopes || {})
    .find((s: any) => typeof s?.toggle === 'function' && typeof s?.selectValue === 'function') as Record<string, any>
  if (!scope)
    throw new Error('listbox scope not registered')

  return {
    scope,
    doc,
    trigger: doc.querySelector('[data-stx-listbox-button]'),
    /*
     * Selections are observed here, not on the document: `Listbox.onSelect`
     * calls stopPropagation() so a nested listbox's choice is not also its
     * parent's, and the event never reaches the document.
     */
    list: doc.querySelector('[data-stx-listbox-options]'),
    options: Array.from<any>(doc.querySelectorAll('[data-stx-listbox-option]')),
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

describe('Listbox moves focus with the keyboard (#2032)', () => {
  it('gives every option a tabindex, since an li role=option has none', async () => {
    const m = await mount()
    try {
      expect(m.options).toHaveLength(4)
      for (const option of m.options)
        expect(option.getAttribute('tabindex'), option.textContent?.trim()).toBe('-1')
    }
    finally {
      await m.dispose()
    }
  })

  it('opens on ArrowDown and walks the options, skipping the disabled one', async () => {
    const m = await mount()
    try {
      m.press('ArrowDown', m.trigger)
      await settle()
      expect(m.scope.isOpen()).toBe(true)
      expect(m.label()).toBe('Apple')

      m.press('ArrowDown')
      expect(m.label()).toBe('Banana')

      m.press('ArrowDown')
      expect(m.label(), 'Cherry is disabled').toBe('Damson')

      m.press('ArrowDown')
      expect(m.label(), 'wraps').toBe('Apple')
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
      expect(m.label()).toBe('Damson')
      m.press('Home')
      expect(m.label()).toBe('Apple')
    }
    finally {
      await m.dispose()
    }
  })

  /*
   * Opening lands on what is already chosen rather than the top, so a listbox
   * with a value does not hide it below the fold of a long list.
   */
  it('opens onto the current selection when there is one', async () => {
    const m = await mount('<Listbox value="damson">')
    try {
      await settle()
      m.press('ArrowDown', m.trigger)
      await settle()

      expect(m.label()).toBe('Damson')
    }
    finally {
      await m.dispose()
    }
  })

  it('jumps by first letter, wrapping round the list', async () => {
    const m = await mount()
    try {
      m.press('ArrowDown', m.trigger)
      await settle()
      expect(m.label()).toBe('Apple')

      m.press('d')
      expect(m.label()).toBe('Damson')

      m.press('b')
      expect(m.label(), 'wrapped back past the top').toBe('Banana')

      m.press('c')
      expect(m.label(), 'Cherry is disabled, so nothing matches').toBe('Banana')
    }
    finally {
      await m.dispose()
    }
  })
})

describe('Listbox activates the focused option', () => {
  /*
   * What the key handler is responsible for is delivering the activation to
   * the focused option -- an `<li>` does not fire its own handler on Enter, so
   * the handler clicks it.
   *
   * Whether that click then SELECTS is the component's own path, and it is
   * broken for more than one option by stacksjs/stx#2033: a component whose
   * client script names no signal API gets no per-instance scope, so
   * `<ListboxOption>`'s `@click` binds only while exactly one instance exists.
   * Clicking with a mouse is equally dead, so this is not a regression, and
   * asserting the selection here would pin a framework bug as expected
   * behaviour. These assert the click, which is this handler's contract.
   */
  const clicksOn = (option: any) => {
    const hits: string[] = []
    option.addEventListener('click', () => hits.push('click'))
    return hits
  }

  it('does not activate anything while arrowing over options', async () => {
    const m = await mount()
    try {
      const hits = m.options.map(clicksOn)

      m.press('ArrowDown', m.trigger)
      await settle()
      m.press('ArrowDown')
      m.press('ArrowDown')
      await settle()

      expect(hits.flat(), 'focus moved, nothing was activated').toEqual([])
    }
    finally {
      await m.dispose()
    }
  })

  it('clicks the focused option on Enter, which an li would otherwise ignore', async () => {
    const m = await mount()
    try {
      const banana = clicksOn(m.options[1])
      const apple = clicksOn(m.options[0])

      m.press('ArrowDown', m.trigger)
      await settle()
      m.press('ArrowDown')
      expect(m.label()).toBe('Banana')

      m.press('Enter')
      await settle()

      expect(banana, 'the focused option was activated').toEqual(['click'])
      expect(apple, 'and only that one').toEqual([])
    }
    finally {
      await m.dispose()
    }
  })

  it('clicks it on Space as well', async () => {
    const m = await mount()
    try {
      const apple = clicksOn(m.options[0])

      m.press('ArrowDown', m.trigger)
      await settle()
      m.press(' ')
      await settle()

      expect(apple).toEqual(['click'])
    }
    finally {
      await m.dispose()
    }
  })

  it('never activates a disabled option, even focused past', async () => {
    const m = await mount()
    try {
      const cherry = clicksOn(m.options[2])

      m.press('ArrowDown', m.trigger)
      await settle()
      for (let i = 0; i < 6; i++) {
        m.press('Enter')
        m.press('ArrowDown')
      }
      await settle()

      expect(cherry, 'Cherry is disabled and unreachable').toEqual([])
    }
    finally {
      await m.dispose()
    }
  })

  it('closes on Tab, and leaves outside arrow keys alone', async () => {
    const m = await mount()
    try {
      m.press('ArrowDown', m.trigger)
      await settle()
      m.press('Tab')
      await settle()
      expect(m.scope.isOpen()).toBe(false)

      m.press('ArrowDown', m.doc.body)
      await settle()
      expect(m.scope.isOpen(), 'an ArrowDown on the body is not ours').toBe(false)
    }
    finally {
      await m.dispose()
    }
  })
})
