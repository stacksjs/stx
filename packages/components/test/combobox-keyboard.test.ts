/**
 * `<Combobox>` is navigable from the keyboard (stacksjs/stx#2032).
 *
 * The last of the four, and the one whose pattern genuinely differs. A
 * combobox keeps focus in its INPUT so the user can keep typing, so there is
 * no focused option to move: the option a user has arrowed to is the ACTIVE
 * one, named by `aria-activedescendant` on the input. `<Listbox>` and
 * `<Dropdown>` move real focus with a roving `tabindex`; this must not, and
 * its options deliberately have no `tabindex` at all.
 *
 * That is also why `aria-activedescendant` could not be added when the ARIA
 * work went in: there was no movement for it to describe. It arrives here,
 * with the movement.
 *
 * Space is deliberately not an activation key here. On the other two it
 * activates the focused item; in a text input it has to type a space.
 *
 * Enter is asserted as far as the CLICK it delivers. Whether that click
 * selects is `<ComboboxOption>`'s own path, broken for more than one option by
 * stacksjs/stx#2033 — clicking with a mouse is equally dead there, so this is
 * not a regression, but asserting the selection would pin that bug as correct.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

const UI = path.join(import.meta.dir, '..', 'src', 'ui', 'combobox')
const read = (name: string) => readFileSync(path.join(UI, name), 'utf-8')

const OPTIONS = `
  <ComboboxOptions>
    <ComboboxOption value="apple">Apple</ComboboxOption>
    <ComboboxOption value="banana">Banana</ComboboxOption>
    <ComboboxOption value="cherry" disabled>Cherry</ComboboxOption>
    <ComboboxOption value="damson">Damson</ComboboxOption>
  </ComboboxOptions>`

async function mount() {
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    'components/Combobox.stx': read('Combobox.stx'),
    'components/ComboboxInput.stx': read('ComboboxInput.stx'),
    'components/ComboboxButton.stx': read('ComboboxButton.stx'),
    'components/ComboboxOptions.stx': read('ComboboxOptions.stx'),
    'components/ComboboxOption.stx': read('ComboboxOption.stx'),
    'pages/index.stx': page('app', `<div id="host"><Combobox><ComboboxInput /><ComboboxButton />${OPTIONS}</Combobox></div>`),
  }, { '/': 'pages/index.stx' })
  const browser = await boot(app, '/')
  await settle()

  const doc = browser.window.document
  const scope = Object.values(browser.window.stx._scopes || {})
    .find((s: any) => typeof s?.selectValue === 'function' && typeof s?.query === 'function') as Record<string, any>
  if (!scope)
    throw new Error('combobox scope not registered')

  const input = doc.querySelector('[data-stx-combobox-input]')
  const options = Array.from<any>(doc.querySelectorAll('[data-stx-combobox-option]'))
  return {
    scope,
    doc,
    input,
    options,
    /** The option the input currently points at, by its own aria-activedescendant. */
    active: () => {
      const id = input.getAttribute('aria-activedescendant')
      if (!id) return null
      const el = doc.getElementById(id)
      return el && el.textContent?.trim()
    },
    marked: () => options.filter(o => o.getAttribute('data-active') === 'true').map(o => o.textContent?.trim()),
    press: (key: string, target?: any) => {
      (target ?? input).dispatchEvent(new browser.window.KeyboardEvent('keydown', { key, bubbles: true }))
    },
    dispose: () => app.dispose(),
  }
}

afterEach(() => {
  closeBrowser()
})

describe('Combobox tracks an active option without moving focus (#2032)', () => {
  it('leaves its options out of the tab order entirely', async () => {
    const m = await mount()
    try {
      expect(m.options).toHaveLength(4)
      for (const option of m.options)
        expect(option.getAttribute('tabindex'), option.textContent?.trim()).toBeNull()
    }
    finally {
      await m.dispose()
    }
  })

  it('opens on ArrowDown and points the input at the first option', async () => {
    const m = await mount()
    try {
      expect(m.active(), 'nothing active before any key').toBeNull()

      m.press('ArrowDown')
      await settle()

      expect(m.scope.isOpen()).toBe(true)
      expect(m.active()).toBe('Apple')
      expect(m.doc.activeElement === m.options[0], 'focus did NOT move to the option').toBe(false)
    }
    finally {
      await m.dispose()
    }
  })

  it('walks the options, skipping the disabled one, and wraps', async () => {
    const m = await mount()
    try {
      m.press('ArrowDown')
      await settle()
      expect(m.active()).toBe('Apple')

      m.press('ArrowDown')
      expect(m.active()).toBe('Banana')

      m.press('ArrowDown')
      expect(m.active(), 'Cherry is disabled').toBe('Damson')

      m.press('ArrowDown')
      expect(m.active(), 'wraps').toBe('Apple')

      m.press('ArrowUp')
      expect(m.active(), 'wraps back').toBe('Damson')
    }
    finally {
      await m.dispose()
    }
  })

  it('opens upward on ArrowUp, onto the last option', async () => {
    const m = await mount()
    try {
      m.press('ArrowUp')
      await settle()

      expect(m.active()).toBe('Damson')
    }
    finally {
      await m.dispose()
    }
  })

  it('jumps to the ends with Home and End', async () => {
    const m = await mount()
    try {
      m.press('ArrowDown')
      await settle()

      m.press('End')
      expect(m.active()).toBe('Damson')
      m.press('Home')
      expect(m.active()).toBe('Apple')
    }
    finally {
      await m.dispose()
    }
  })

  /*
   * The active option has no focus ring to show it, so it is marked for CSS as
   * well as for assistive tech — one option at a time, and the same one.
   */
  it('marks exactly the option it names, for a sighted keyboard user', async () => {
    const m = await mount()
    try {
      m.press('ArrowDown')
      await settle()
      m.press('ArrowDown')

      expect(m.marked()).toEqual(['Banana'])
      expect(m.active()).toBe('Banana')
    }
    finally {
      await m.dispose()
    }
  })

  it('gives up the active option when it closes', async () => {
    const m = await mount()
    try {
      m.press('ArrowDown')
      await settle()
      expect(m.active()).toBe('Apple')

      m.press('Escape')
      await settle()

      expect(m.scope.isOpen()).toBe(false)
      expect(m.active(), 'nothing is active in a closed list').toBeNull()
      expect(m.marked()).toEqual([])
    }
    finally {
      await m.dispose()
    }
  })

  /*
   * Typing filters the list, so the index the active option was is no longer
   * the option it was — keeping it would point the input at whatever happened
   * to land in that slot.
   */
  it('drops the active option when the query changes', async () => {
    const m = await mount()
    try {
      m.press('ArrowDown')
      await settle()
      expect(m.active()).toBe('Apple')

      m.input.dispatchEvent(new m.doc.defaultView.CustomEvent('stx:combobox-query', { bubbles: true, detail: 'ba' }))
      await settle()

      expect(m.active()).toBeNull()
      expect(m.marked()).toEqual([])
    }
    finally {
      await m.dispose()
    }
  })
})

describe('Combobox activates the active option', () => {
  const clicksOn = (option: any) => {
    const hits: string[] = []
    option.addEventListener('click', () => hits.push('click'))
    return hits
  }

  it('clicks the active option on Enter', async () => {
    const m = await mount()
    try {
      const banana = clicksOn(m.options[1])
      const apple = clicksOn(m.options[0])

      m.press('ArrowDown')
      await settle()
      m.press('ArrowDown')
      expect(m.active()).toBe('Banana')

      m.press('Enter')
      await settle()

      expect(banana).toEqual(['click'])
      expect(apple, 'and only that one').toEqual([])
    }
    finally {
      await m.dispose()
    }
  })

  it('does nothing on Enter with no active option', async () => {
    const m = await mount()
    try {
      const hits = m.options.map(clicksOn)
      m.scope.open()
      await settle()

      m.press('Enter')
      await settle()

      expect(hits.flat()).toEqual([])
    }
    finally {
      await m.dispose()
    }
  })

  /*
   * Space types a space in the input. Treating it as activation, the way the
   * other two widgets do, would make the combobox unable to accept a query
   * with a space in it.
   */
  it('leaves Space to the input', async () => {
    const m = await mount()
    try {
      const hits = m.options.map(clicksOn)

      m.press('ArrowDown')
      await settle()
      m.press(' ')
      await settle()

      expect(hits.flat(), 'Space activated nothing').toEqual([])
      expect(m.active(), 'and the active option is untouched').toBe('Apple')
    }
    finally {
      await m.dispose()
    }
  })

  it('leaves arrow keys alone when they come from outside', async () => {
    const m = await mount()
    try {
      m.press('ArrowDown', m.doc.body)
      await settle()

      expect(m.scope.isOpen()).toBe(false)
      expect(m.active()).toBeNull()
    }
    finally {
      await m.dispose()
    }
  })
})
