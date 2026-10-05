/**
 * TwoFactorChallenge renders one input per code digit.
 *
 * It looped with `@for(i in Array(codeLength).keys())`. `@for` compiles to a
 * plain JavaScript `for`, and `for…in` over an array iterator visits nothing -
 * an iterator has no enumerable keys - so the challenge rendered no inputs at
 * all and nobody could type a code. `stx typecheck` had been reporting the
 * loop variable as undeclared the whole time.
 */
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
// `../../stx/src`, never `@stacksjs/stx`, which resolves to a lagging dist.
import { readFileSync } from 'node:fs'
import { processDirectives } from '../../stx/src/process'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

const ROOT = path.resolve(import.meta.dir, '..')
const DIR = path.join(ROOT, 'src/ui/auth')

async function render(tag: string): Promise<string> {
  const html = await processDirectives(
    tag,
    {},
    path.join(ROOT, 'two-factor-audit.stx'),
    { componentsDir: DIR, root: ROOT, buildMode: 'serve', cache: false } as any,
    new Set<string>(),
  )
  return html.replace(/<script[\s\S]*?<\/script>/g, '')
}

describe('TwoFactorChallenge', () => {
  /** The digit ids in document order, whatever this instance's prefix is. */
  function digitIds(html: string): string[] {
    return [...html.matchAll(/id="([^"]*code-[^"]*-\d+)"/g)].map(match => match[1])
  }

  it('renders an input for every digit of the default code', async () => {
    const html = await render('<TwoFactorChallenge />')
    const ids = digitIds(html)

    expect(ids.length).toBeGreaterThan(0)
    // Numbered from zero, in order, under one shared prefix.
    const prefix = ids[0].replace(/-0$/, '')
    expect(ids).toEqual(ids.map((_, i) => `${prefix}-${i}`))
  })

  it('follows codeLength', async () => {
    const html = await render('<TwoFactorChallenge :codeLength="4" />')

    expect(digitIds(html)).toHaveLength(4)
  })

  it('points the label at the first digit', async () => {
    const html = await render('<TwoFactorChallenge />')
    const labelFor = html.match(/<label for="([^"]+)"/)?.[1]

    expect(labelFor).toBe(digitIds(html)[0])
  })

  /*
   * The ids were `code-0` ... `code-5` and the focus management looks them up
   * with `document.getElementById` -- document-wide, on an id as generic as
   * `code-1`. Two of these on a page typed into each other, and any element in
   * the host app with that id took the focus instead.
   */
  it('gives two challenges on one page two sets of ids', async () => {
    const html = await render('<TwoFactorChallenge /><TwoFactorChallenge />')
    const ids = digitIds(html)

    expect(ids).toHaveLength(12)
    expect(new Set(ids).size, 'every id distinct').toBe(12)
  })

  /*
   * `name` is the key the form submits under, so it stays `code-<i>`:
   * namespacing it would change the payload a server sees. Only the id moved.
   */
  it('keeps the submitted field names generic', async () => {
    const html = await render('<TwoFactorChallenge :codeLength="3" />')
    const names = [...html.matchAll(/name="([^"]+)"/g)].map(m => m[1])

    expect(names).toEqual(['code-0', 'code-1', 'code-2'])
  })
})

/**
 * The focus moves, driven through the real runtime.
 *
 * The ids are what the focus management looks itself up by, so the rename is
 * only correct if typing still advances the caret -- and advances it inside
 * the widget that was typed in. With the old `code-0`...`code-5`, two
 * challenges on a page shared every id, so typing into the second one moved
 * focus into the FIRST one's second digit.
 */
describe('TwoFactorChallenge focus management', () => {
  async function mountTwo() {
    const app = await renderApp({
      'layouts/app.stx': layout(''),
      'components/TwoFactorChallenge.stx': readFileSync(path.join(DIR, 'TwoFactorChallenge.stx'), 'utf-8'),
      'pages/index.stx': page('app', '<div id="host"><TwoFactorChallenge :codeLength="3" /><TwoFactorChallenge :codeLength="3" /></div>'),
    }, { '/': 'pages/index.stx' })
    const browser = await boot(app, '/')
    await settle()
    const doc = browser.window.document
    return {
      doc,
      digits: Array.from<any>(doc.querySelectorAll('input[maxlength="1"]')),
      type: (input: any, value: string) => {
        input.value = value
        input.dispatchEvent(new browser.window.Event('input', { bubbles: true }))
      },
      errors: browser.errors,
      dispose: () => app.dispose(),
    }
  }

  afterEach(() => {
    closeBrowser()
  })

  it('advances to the next digit of the SAME challenge', async () => {
    const m = await mountTwo()
    try {
      expect(m.digits).toHaveLength(6)

      // The second widget's first digit; its own second digit must take focus.
      m.type(m.digits[3], '7')
      await settle()

      expect(m.doc.activeElement.id).toBe(m.digits[4].id)
      expect(m.errors).toEqual([])
    }
    finally {
      await m.dispose()
    }
  })

  it('steps back on Backspace, within the same challenge', async () => {
    const m = await mountTwo()
    try {
      m.digits[5].dispatchEvent(new m.doc.defaultView.KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
      await settle()

      expect(m.doc.activeElement.id).toBe(m.digits[4].id)
    }
    finally {
      await m.dispose()
    }
  })
})
