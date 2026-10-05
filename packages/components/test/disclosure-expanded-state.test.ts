/**
 * A trigger that opens something says so, and says whether it is open.
 *
 * `<Dropdown>`, `<Listbox>` and `<Popover>` all tracked `isOpen` and bound it
 * to `data-state` on their root, which is what hides the panel in CSS. Nothing
 * reached the button. So a screen reader announced "button" — no indication
 * that it controls a menu, and no way to tell an open dropdown from a closed
 * one, which is WCAG 4.1.2: the state has to be programmatically determinable.
 *
 * `<AccordionItem>` had `aria-expanded` from the start, so the library knew
 * the pattern; these three were just never given it.
 *
 * Driven through each component's own scope and read back off the DOM, because
 * the defect was precisely that the state existed in the scope and never
 * reached the element. A test that read the source for the attribute would have
 * passed on the static `aria-expanded="false"` alone, which is the half that
 * does not move.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')

const read = (rel: string) => readFileSync(path.join(UI, rel), 'utf-8')

/** Source with comments removed: a comment naming an attribute is not a use of it. */
const code = (rel: string) => read(rel)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/^\s*\/\/.*$/gm, '')

interface Widget {
  scope: Record<string, any>
  trigger: any
  panel: any
  doc: any
  dispose: () => Promise<void>
}

/** Mount one disclosure widget and hand back its scope plus its two elements. */
async function mount(spec: {
  files: Record<string, string>
  markup: string
  triggerAttr: string
  panelAttr: string
}): Promise<Widget> {
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    ...spec.files,
    'pages/index.stx': page('app', `<div id="host">${spec.markup}</div>`),
  }, { '/': 'pages/index.stx' })
  const browser = await boot(app, '/')
  await settle()

  const doc = browser.window.document
  const scope = Object.values(browser.window.stx._scopes || {})
    .find((s: any) => typeof s?.toggle === 'function' && typeof s?.isOpen === 'function') as Record<string, any>
  if (!scope)
    throw new Error('no disclosure scope registered')

  return {
    scope,
    trigger: doc.querySelector(`[${spec.triggerAttr}]`),
    panel: doc.querySelector(`[${spec.panelAttr}]`),
    doc,
    dispose: () => app.dispose(),
  }
}

const WIDGETS = [
  {
    name: 'Dropdown',
    source: 'dropdown/DropdownButton.stx',
    haspopup: 'menu',
    triggerAttr: 'data-stx-dropdown-button',
    panelAttr: 'data-stx-dropdown-items',
    files: {
      'components/Dropdown.stx': read('dropdown/Dropdown.stx'),
      'components/DropdownButton.stx': read('dropdown/DropdownButton.stx'),
      'components/DropdownItems.stx': read('dropdown/DropdownItems.stx'),
    },
    markup: '<Dropdown><DropdownButton>Open</DropdownButton><DropdownItems><span>one</span></DropdownItems></Dropdown>',
  },
  {
    name: 'Listbox',
    source: 'listbox/ListboxButton.stx',
    haspopup: 'listbox',
    triggerAttr: 'data-stx-listbox-button',
    panelAttr: 'data-stx-listbox-options',
    files: {
      'components/Listbox.stx': read('listbox/Listbox.stx'),
      'components/ListboxButton.stx': read('listbox/ListboxButton.stx'),
      'components/ListboxOptions.stx': read('listbox/ListboxOptions.stx'),
    },
    markup: '<Listbox><ListboxButton>Pick</ListboxButton><ListboxOptions><span>one</span></ListboxOptions></Listbox>',
  },
  {
    name: 'Popover',
    source: 'popover/PopoverButton.stx',
    haspopup: null,
    triggerAttr: 'data-stx-popover-button',
    panelAttr: 'data-stx-popover-panel',
    files: {
      'components/Popover.stx': read('popover/Popover.stx'),
      'components/PopoverButton.stx': read('popover/PopoverButton.stx'),
      'components/PopoverPanel.stx': read('popover/PopoverPanel.stx'),
    },
    markup: '<Popover><PopoverButton>More</PopoverButton><PopoverPanel><span>body</span></PopoverPanel></Popover>',
  },
  {
    name: 'Combobox',
    source: 'combobox/ComboboxInput.stx',
    haspopup: null,
    // The combobox itself is the input, not the chevron beside it.
    triggerAttr: 'data-stx-combobox-input',
    panelAttr: 'data-stx-combobox-options',
    files: {
      'components/Combobox.stx': read('combobox/Combobox.stx'),
      'components/ComboboxInput.stx': read('combobox/ComboboxInput.stx'),
      'components/ComboboxButton.stx': read('combobox/ComboboxButton.stx'),
      'components/ComboboxOptions.stx': read('combobox/ComboboxOptions.stx'),
    },
    markup: '<Combobox><ComboboxInput /><ComboboxButton /><ComboboxOptions><li>one</li></ComboboxOptions></Combobox>',
  },
] as const

afterEach(() => {
  closeBrowser()
})

describe('a disclosure trigger reports its own state', () => {
  for (const w of WIDGETS) {
    it(`${w.name} starts closed, and says so before any script runs`, async () => {
      /*
       * Asserted in the SOURCE as well as the DOM. The harness always
       * hydrates, and syncExpanded() sets the attribute on mount, so a DOM
       * read alone passes even with the static attribute deleted -- it cannot
       * see the state the markup ships in, which is the one a server-rendered
       * page shows until the runtime arrives.
       */
      expect(code(w.source), w.source).toContain('aria-expanded="false"')

      const m = await mount(w)
      try {
        expect(m.trigger, 'trigger rendered').toBeTruthy()
        expect(m.trigger.getAttribute('aria-expanded')).toBe('false')
      }
      finally {
        await m.dispose()
      }
    })

    it(`${w.name} flips aria-expanded on the trigger when it opens`, async () => {
      const m = await mount(w)
      try {
        m.scope.toggle()
        await settle()
        expect(m.trigger.getAttribute('aria-expanded'), 'opened').toBe('true')

        m.scope.toggle()
        await settle()
        expect(m.trigger.getAttribute('aria-expanded'), 'closed again').toBe('false')
      }
      finally {
        await m.dispose()
      }
    })

    it(`${w.name} points the trigger at the panel it controls`, async () => {
      const m = await mount(w)
      try {
        expect(m.panel, 'panel rendered').toBeTruthy()
        const controls = m.trigger.getAttribute('aria-controls')

        expect(controls, 'aria-controls set').toBeTruthy()
        expect(controls).toBe(m.panel.id)
        expect(m.panel.id).toBeTruthy()
      }
      finally {
        await m.dispose()
      }
    })

    if (w.haspopup) {
      it(`${w.name} declares the kind of popup it opens`, async () => {
        const m = await mount(w)
        try {
          expect(m.trigger.getAttribute('aria-haspopup')).toBe(w.haspopup)
        }
        finally {
          await m.dispose()
        }
      })
    }
  }

  /*
   * `<ComboboxInput>` was a bare `<input type="text">` — not one ARIA
   * attribute on the most ARIA-demanding widget in the library. role="combobox"
   * is what makes aria-expanded required rather than merely useful.
   */
  it('makes the Combobox input an actual combobox', async () => {
    const m = await mount(WIDGETS.find(w => w.name === 'Combobox')!)
    try {
      expect(m.trigger.getAttribute('role')).toBe('combobox')
      expect(m.trigger.getAttribute('aria-autocomplete')).toBe('list')
      expect(m.panel.getAttribute('role')).toBe('listbox')
    }
    finally {
      await m.dispose()
    }
  })

  /*
   * aria-activedescendant names the option the user has moved to. This
   * combobox has no option keyboard navigation to move with, so setting it
   * would describe a focus that does not exist — a worse lie than the silence
   * it replaces. See the note in Combobox.stx.
   */
  it('claims no active option, having no way to move between them', () => {
    for (const rel of ['combobox/Combobox.stx', 'combobox/ComboboxInput.stx', 'combobox/ComboboxOptions.stx'])
      expect(code(rel), rel).not.toContain('aria-activedescendant')
  })

  it('names the Combobox chevron, which is an icon alone', async () => {
    const m = await mount(WIDGETS.find(w => w.name === 'Combobox')!)
    try {
      const chevron = m.trigger.ownerDocument.querySelector('[data-stx-combobox-button]')

      expect(chevron.getAttribute('aria-label')).toBeTruthy()
      expect(chevron.getAttribute('tabindex'), 'the input is the tab stop').toBe('-1')
      expect(chevron.querySelector('svg').getAttribute('aria-hidden')).toBe('true')
    }
    finally {
      await m.dispose()
    }
  })

  /*
   * Popover's panel carries no role, so it is a plain disclosure: a button
   * with `aria-expanded` and `aria-controls` and nothing promising a menu or a
   * dialog that is not there.
   */
  it('does not promise Popover a popup role its panel does not have', () => {
    expect(code('popover/PopoverPanel.stx')).not.toMatch(/role="/)
    expect(code('popover/PopoverButton.stx')).not.toContain('aria-haspopup')
  })
})

/**
 * Escape dismisses a popup.
 *
 * None of the four handled a single key (stacksjs/stx#2032). This covers the
 * dismissal half only: arrow navigation between items is a separate change per
 * widget, and `aria-activedescendant` waits on it.
 *
 * Bound on the document rather than the panel, for the reason `<Drawer>`
 * already records: opening one of these does not move focus, so a handler on
 * the panel never sees the first Escape — focus is still on the trigger.
 */
describe('Escape dismisses a popup (#2032)', () => {
  const press = (doc: any, key: string) => {
    doc.dispatchEvent(new doc.defaultView.KeyboardEvent('keydown', { key, bubbles: true }))
  }

  for (const w of WIDGETS) {
    it(`${w.name} closes on Escape, with focus still on the trigger`, async () => {
      const m = await mount(w)
      try {
        m.scope.open()
        await settle()
        expect(m.scope.isOpen(), 'open to begin with').toBe(true)

        press(m.doc, 'Escape')
        await settle()

        expect(m.scope.isOpen(), 'Escape closed it').toBe(false)
        expect(m.trigger.getAttribute('aria-expanded'), 'and the trigger says so').toBe('false')
      }
      finally {
        await m.dispose()
      }
    })

    it(`${w.name} ignores Escape while already closed`, async () => {
      const m = await mount(w)
      try {
        expect(m.scope.isOpen()).toBe(false)
        press(m.doc, 'Escape')
        await settle()

        expect(m.scope.isOpen()).toBe(false)
      }
      finally {
        await m.dispose()
      }
    })

    it(`${w.name} leaves other keys alone`, async () => {
      const m = await mount(w)
      try {
        m.scope.open()
        await settle()
        press(m.doc, 'a')
        press(m.doc, 'Enter')
        await settle()

        expect(m.scope.isOpen(), 'still open').toBe(true)
      }
      finally {
        await m.dispose()
      }
    })
  }

  /*
   * Returning focus is conditional: it goes back to the trigger only when it
   * had moved into the panel, so Escape pressed while the user is elsewhere on
   * the page does not yank focus to a popup they just dismissed.
   */
  it('returns focus to the trigger only when focus was inside the panel', () => {
    for (const w of WIDGETS) {
      const parent = code(w.name === 'Dropdown'
        ? 'dropdown/Dropdown.stx'
        : w.name === 'Listbox'
          ? 'listbox/Listbox.stx'
          : w.name === 'Popover' ? 'popover/Popover.stx' : 'combobox/Combobox.stx')

      expect(parent, w.name).toContain('if (!active || !rootEl.contains(active)) return')
    }
  })
})
