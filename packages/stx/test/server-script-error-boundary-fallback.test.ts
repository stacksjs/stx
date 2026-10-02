/**
 * An `@errorBoundary` shows its fallback when a `<script server>` inside it
 * failed (stacksjs/stx#1991, ask 3).
 *
 * `extractVariables` warns and returns normally on purpose — one failed script
 * must not take the page down — so every value in the script is undefined and
 * the component renders its markup with nothing in it. That is the right
 * default and was the only option: nothing downstream could tell a failed
 * component from an empty one, so an app could not say what a failed component
 * should look like.
 *
 * The boundary already shipped both halves and flipped them from the client. A
 * server script that failed never reaches the client runtime — it failed before
 * the page was sent — so the component rendered empty inside a boundary whose
 * fallback sat there hidden. The one case a boundary exists for was the one it
 * could not cover.
 *
 * Unlike the development boundary from ask 2, this works in production: it is
 * the app's own markup being shown, not a diagnostic.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { processDirectives } from '../src/process'
import { cleanupTestDirs, createPartialFile, PARTIALS_DIR, setupTestDirs } from './utils'

const opts = { debug: false, partialsDir: PARTIALS_DIR, componentsDir: PARTIALS_DIR } as never

const FALLBACK = '<p id="fb">could not load</p>'

beforeAll(async () => {
  await setupTestDirs()
  // A missing binding: the classification that means the script is wrong,
  // rather than the browser-only case the quiet fallback is for.
  await createPartialFile('Bad.stx', '<script server>\nexport const v = nope()\n</script>\n<div class="bad">{{ v }}</div>')
  await createPartialFile('Ok.stx', '<script server>\nexport const v = \'fine\'\n</script>\n<div class="ok">{{ v }}</div>')
  // A server script reaching for a browser global, which classifies as
  // `unknown` and must NOT trip a boundary.
  await createPartialFile('Browsery.stx', '<script server>\nexport const v = window.localStorage.getItem(\'k\')\n</script>\n<div class="browsery">{{ v }}</div>')
})

afterAll(cleanupTestDirs)

const render = (template: string): Promise<string> =>
  processDirectives(template, {}, 'page.stx', opts, new Set())

const boundary = (inner: string): string =>
  `@errorBoundary\n${inner}\n@fallback\n${FALLBACK}\n@enderrorBoundary`

describe('#1991 ask 3 — a boundary covers a render-time failure', () => {
  it('shows the fallback instead of the empty component', async () => {
    const html = await render(boundary('<Bad />'))

    expect(html).toContain('could not load')
    expect(html).toContain('data-has-error="true"')
    // Visible, not merely present: the fallback carries no inline display:none.
    expect(html).not.toMatch(/data-boundary-fallback="[^"]*" style="display: none;"/)
  })

  /*
   * Dropped rather than hidden. It is markup with every value undefined, so
   * leaving it in the document means a screen reader still reads it and a
   * `:show` still binds to it.
   */
  it('drops the failed markup rather than hiding it', async () => {
    const html = await render(boundary('<Bad />'))

    expect(html).not.toContain('class="bad"')
  })

  it('leaves a working component exactly as it was', async () => {
    const html = await render(boundary('<Ok />'))

    expect(html).toContain('data-has-error="false"')
    expect(html).toContain('class="ok"')
    expect(html).toContain('fine')
    // The fallback is still shipped hidden, for the client runtime to reveal.
    expect(html).toMatch(/data-boundary-fallback="[^"]*" style="display: none;"/)
  })

  /*
   * The classification gate, matching the development boundary: a server script
   * reaching for `window` is the case the quiet fallback exists for, and
   * replacing those components with a fallback would break pages that work.
   */
  it('ignores a browser-only script, which is not a broken one', async () => {
    const html = await render(boundary('<Browsery />'))

    expect(html).toContain('data-has-error="false"')
    expect(html).toContain('class="browsery"')
  })

  /*
   * Without a boundary the behaviour is unchanged - the component renders
   * empty - and the marker that makes this detectable must not reach a browser.
   */
  it('changes nothing when there is no boundary, and leaks no marker', async () => {
    const html = await render('<div><Bad /></div>')

    expect(html).toContain('class="bad"')
    expect(html).not.toContain('stx-render-failed')
  })

  it('leaks no marker through a boundary either', async () => {
    const html = await render(boundary('<Bad />'))

    expect(html).not.toContain('stx-render-failed')
  })

  /*
   * Two boundaries, one failure. The marker travels with the component's own
   * output, so the boundary around the working component is untouched - a
   * page-wide flag could not do this.
   */
  it('flips only the boundary the failure is inside', async () => {
    const html = await render(`${boundary('<Bad />')}\n${boundary('<Ok />')}`)

    expect(html).toContain('data-has-error="true"')
    expect(html).toContain('data-has-error="false"')
    expect(html).toContain('class="ok"')
    expect(html).not.toContain('class="bad"')
  })
})
