/**
 * `error` is live state, not a render-time snapshot (stacksjs/stx#2047).
 *
 * `disabled` and `loading` were made reactive because they change after
 * render. Validity is the clearest case of the same thing and was still read
 * once: a form posted with `fetch` learns the problem AFTER the submit, with
 * no re-render, so a field could never BECOME invalid. That made the component
 * a step backwards from a plain `<input>` for exactly the forms it exists for
 * -- six apps drive their sign-in banners from a signal this way.
 *
 * Two halves, and both matter:
 *
 *   - a STATIC `aria-invalid` so a server-rendered error is announced before
 *     hydration and with JavaScript off, and
 *   - a reactive `:aria-invalid` so it flips when the signal does.
 *
 * The colour is toggled with an OBJECT class binding rather than a whole
 * reactive class string. Measured, a reactive string MERGES with the static
 * one -- the element ends up carrying `ring-line-strong` and
 * `ring-danger-line` at once, and which wins is CSS source order rather than
 * anything the component controls. Per-class toggling removes one set as it
 * adds the other.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'
import { markup, render } from './utils/render-component'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')

function component(rel: string): string {
  return readFileSync(path.join(UI, rel), 'utf-8')
}

const CONTROLS: Array<[string, string, string]> = [
  ['TextInput', '<TextInput label="E" name="e" />', 'input'],
  ['Textarea', '<Textarea label="B" name="b" />', 'textarea'],
  ['Select', '<Select label="P" name="p" />', 'select'],
  ['Checkbox', '<Checkbox label="A" name="a" />', 'input'],
  ['Radio', '<Radio label="R" name="r" value="1" />', 'input'],
]

describe('every control exposes validity both ways', () => {
  for (const [name, usage, tag] of CONTROLS) {
    it(`${name} serves a static aria-invalid and binds a reactive one`, async () => {
      const html = markup(await render(usage))
      const element = new RegExp(`<${tag}[^>]*>`).exec(html)?.[0] ?? ''

      // Served, so a server-rendered error is announced with JS off.
      expect(element).toMatch(/\saria-invalid="(true|false)"/)
      // Bound, so it can change after the submit that found the problem.
      expect(element).toContain(':aria-invalid=')
      // And the colour follows, per class rather than as a whole string.
      expect(element).toContain(':class="{')
    })
  }

  it('serves aria-invalid="true" for a server-rendered error', async () => {
    const html = markup(await render('<TextInput label="E" name="e" error helperText="Bad address" />'))
    expect(html).toContain('aria-invalid="true"')
  })
})

/**
 * The part the report is actually about: a field that becomes invalid after a
 * failed submit, with no re-render.
 */
const FILES = {
  'layouts/app.stx': layout(''),
  'components/TextInput.stx': component('input/TextInput.stx'),
  'pages/index.stx': page('app', `<script client>
  const hasError = state(false)
  function fail() { hasError.set(true) }
</script>

<TextInput label="Email" name="email" :error="hasError()" helperText="Bad address" />
<button id="fail" @click="fail()">submit</button>`),
}

afterEach(() => {
  closeBrowser()
})

describe('a field becomes invalid after the submit that found the problem', () => {
  it('flips aria-invalid and the ring when the signal flips', async () => {
    const app = await renderApp(FILES, { '/': 'pages/index.stx' })
    const browser = await boot(app, '/')
    await settle()

    const input = browser.document.querySelector('input')!
    expect(input.getAttribute('aria-invalid')).toBe('false')
    expect(input.className).toContain('ring-line-strong')
    expect(input.className).not.toContain('ring-danger-line')

    // The failed submit.
    browser.document.querySelector('#fail')!.dispatchEvent(
      new browser.window.Event('click', { bubbles: true }),
    )
    await settle()

    expect(input.getAttribute('aria-invalid')).toBe('true')
    // The valid ring is REMOVED, not merely joined by the invalid one.
    expect(input.className).toContain('ring-danger-line')
    expect(input.className).not.toContain('ring-line-strong')
  })
})
