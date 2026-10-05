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

interface Widget {
  scope: Record<string, any>
  trigger: any
  panel: any
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
    dispose: () => app.dispose(),
  }
}

const WIDGETS = [
  {
    name: 'Dropdown',
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
] as const

afterEach(() => {
  closeBrowser()
})

describe('a disclosure trigger reports its own state', () => {
  for (const w of WIDGETS) {
    it(`${w.name} starts closed, and says so before any script runs`, async () => {
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
   * Popover's panel carries no role, so it is a plain disclosure: a button
   * with `aria-expanded` and `aria-controls` and nothing promising a menu or a
   * dialog that is not there.
   */
  it('does not promise Popover a popup role its panel does not have', () => {
    expect(read('popover/PopoverPanel.stx')).not.toMatch(/role="/)
    expect(read('popover/PopoverButton.stx')).not.toContain('aria-haspopup')
  })
})
