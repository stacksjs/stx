/**
 * A library table can say what a screen reader needs (stacksjs/stx#2060).
 *
 * Since #1975 and #1980 the Table family renders and is reactive. What kept an
 * app from adopting it was accessibility the markup could not express:
 *
 *   - a <th> with no `scope`, and no way to give it one;
 *   - a sortable header whose click handler sat on the <th>, which is not
 *     focusable, so sorting was mouse-only, with nothing saying which way a
 *     column was sorted;
 *   - no <caption>, so a table had no accessible name.
 *
 * The markup questions are asked of the rendered document. The two that are
 * about behaviour -- the button sorts, `aria-sort` follows the page -- are
 * asked of the real runtime.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'
import { markup, parse, render } from './utils/render-component'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')

async function document(usage: string): Promise<Document> {
  return parse(markup(await render(usage)))
}

function header(usage: string): Promise<Element> {
  return document(`<table><tr>${usage}</tr></table>`).then(doc => doc.querySelector('th')!)
}

describe('TableHeader scope', () => {
  it('heads its column by default', async () => {
    expect((await header('<TableHeader>Date</TableHeader>')).getAttribute('scope')).toBe('col')
  })

  it('heads its row when asked', async () => {
    expect((await header('<TableHeader scope="row">Monday</TableHeader>')).getAttribute('scope')).toBe('row')
  })

  it('falls back to col for a value that is not a scope', async () => {
    expect((await header('<TableHeader scope="sideways">Date</TableHeader>')).getAttribute('scope')).toBe('col')
  })
})

describe('a sortable TableHeader', () => {
  it('puts the click on a button inside the th, not on the th', async () => {
    const th = await header('<TableHeader sortable>Date</TableHeader>')
    const button = th.querySelector('button')

    expect(button).not.toBeNull()
    expect(button!.getAttribute('type')).toBe('button')
    expect(button!.textContent!.trim()).toBe('Date')
    expect(button!.hasAttribute('@click')).toBe(true)
    // The th must not carry the handler: it cannot take focus, which is the bug.
    expect(th.hasAttribute('@click')).toBe(false)
  })

  it('says which way it is sorted, and says none when it is not', async () => {
    expect((await header('<TableHeader sortable sort="asc">Date</TableHeader>')).getAttribute('aria-sort')).toBe('ascending')
    expect((await header('<TableHeader sortable sort="desc">Date</TableHeader>')).getAttribute('aria-sort')).toBe('descending')
    expect((await header('<TableHeader sortable>Date</TableHeader>')).getAttribute('aria-sort')).toBe('none')
    expect((await header('<TableHeader sortable sort="up">Date</TableHeader>')).getAttribute('aria-sort')).toBe('none')
  })

  it('leaves a plain header alone: no button, no aria-sort', async () => {
    const th = await header('<TableHeader>Date</TableHeader>')

    expect(th.querySelector('button')).toBeNull()
    expect(th.hasAttribute('aria-sort')).toBe(false)
    expect(th.textContent!.trim()).toBe('Date')
  })

  it('still announces a sort on a header that is sorted but not user-sortable', async () => {
    expect((await header('<TableHeader sort="desc">Date</TableHeader>')).getAttribute('aria-sort')).toBe('descending')
  })
})

describe('Table caption', () => {
  it('names the table with a caption, as its first child', async () => {
    const table = (await document('<Table caption="Recent workouts"><TableBody><TableRow><TableCell>Run</TableCell></TableRow></TableBody></Table>')).querySelector('table')!
    const first = table.firstElementChild!

    expect(first.tagName).toBe('CAPTION')
    expect(first.textContent!.trim()).toBe('Recent workouts')
  })

  it('hides it visually by default, and shows it when asked', async () => {
    const hidden = (await document('<Table caption="Workouts"></Table>')).querySelector('caption')!
    expect(hidden.getAttribute('class')).toContain('sr-only')

    const shown = (await document('<Table caption="Workouts" captionVisible></Table>')).querySelector('caption')!
    expect(shown.getAttribute('class')).not.toContain('sr-only')
  })

  it('renders no caption when none is given', async () => {
    const table = (await document('<Table></Table>')).querySelector('table')!

    expect(table.querySelector('caption')).toBeNull()
    expect(table.hasAttribute('data-stx-caption')).toBe(false)
  })

  /*
   * divide-y borders every child after the first. With a caption first, that
   * includes the header row, so a captioned table grew a rule along its top
   * edge. The override has to outrank divide-y's (0,3,0) rather than rely on
   * landing later in the stylesheet.
   */
  it('keeps divide-y from drawing a rule under the caption, by specificity', async () => {
    const html = await render('<Table caption="Workouts"></Table>')
    const css = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = /([^{}]*caption \+[^{}]*)\{([^}]*)\}/.exec(css)

    expect(rule, 'no caption rule shipped').not.toBeNull()
    expect(rule![2]).toMatch(/border-top-width:\s*0/)
    expect(specificity(rule![1].trim())).toBeGreaterThan(specificity('.divide-y > :not([hidden]) ~ :not([hidden])'))
  })
})

/** (a, b, c) folded into one comparable number; enough for these selectors. */
function specificity(selector: string): number {
  const ids = (selector.match(/#[\w-]+/g) ?? []).length
  const classes = (selector.match(/\.[\w-]+|\[[^\]]+\]|:(?!not\()[\w-]+/g) ?? []).length
  const types = (selector.replace(/\[[^\]]*\]|:[\w-]+|\.[\w-]+|#[\w-]+/g, ' ').match(/(?:^|[\s>+~(])([a-z][\w-]*)/gi) ?? []).length
  return ids * 10000 + classes * 100 + types
}

describe('the table in the runtime', () => {
  afterEach(() => {
    closeBrowser()
  })

  async function open() {
    const app = await renderApp({
      'components/Table.stx': readFileSync(path.join(UI, 'table/Table.stx'), 'utf-8'),
      'components/TableHead.stx': readFileSync(path.join(UI, 'table/TableHead.stx'), 'utf-8'),
      'components/TableRow.stx': readFileSync(path.join(UI, 'table/TableRow.stx'), 'utf-8'),
      'components/TableHeader.stx': readFileSync(path.join(UI, 'table/TableHeader.stx'), 'utf-8'),
      'layouts/app.stx': layout(''),
      'pages/index.stx': page('app', `<script client>
  const direction = state('asc')
  const clicks = state(0)
  window.probe = { direction, clicks }
  function flip() {
    clicks.set(clicks() + 1)
    direction.set(direction() === 'asc' ? 'desc' : 'asc')
  }
</script>
<Table caption="Sessions">
  <TableHead><TableRow>
    <TableHeader sortable :sort="direction()" @click="flip()">Date</TableHeader>
  </TableRow></TableHead>
</Table>`),
    }, { '/': 'pages/index.stx' })
    const browser = await boot(app, '/')
    await settle()
    return browser
  }

  it('sorts from the button, and aria-sort follows the page', async () => {
    const browser = await open()
    const th = browser.document.querySelector('th')
    expect(th.getAttribute('aria-sort')).toBe('ascending')

    // A button's activation, which is what Enter and Space produce on it.
    th.querySelector('button').dispatchEvent(new browser.window.Event('click', { bubbles: true }))
    await settle()

    // Once: the button's native click bubbling to the <th> must not count as
    // a second sort beside the click the component emits.
    expect(browser.window.probe.clicks()).toBe(1)
    expect(th.getAttribute('aria-sort')).toBe('descending')

    browser.window.probe.direction.set('')
    await settle()
    expect(th.getAttribute('aria-sort')).toBe('none')
  })
})
