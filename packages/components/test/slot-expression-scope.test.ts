/**
 * A component's slot content is the CALLER's markup, in the caller's scope
 * (stacksjs/stx#2046).
 *
 * It was substituted into the component and then interpolated with the
 * COMPONENT's context, so every name the component happens to declare shadowed
 * the caller's. `<Button>` alone declares `label`, `loading`, `disabled`,
 * `type`, `size`, `variant` and `className` -- ordinary names for a page to
 * use -- and the collision was silent in both directions:
 *
 *     {{ label }}                 the component's '' instead of the caller's
 *     {{ loading() ? a : b }}     calls the component's BOOLEAN, throws, ''
 *
 * The second is the reported shape and the worse one. The natural spelling for
 * a state-dependent button label
 *
 *     <Button :loading="loading()">{{ loading() ? 'Signing in…' : 'Sign in' }}</Button>
 *
 * rendered a button with a spinner, no text and no accessible name -- while the
 * same expression on a native `<button>` in the same file worked, because there
 * the literal `{{ }}` is emitted and hydration replaces it. The difference was
 * never the expression; it was whose scope evaluated it. Six call sites across
 * one app's auth pages shipped nameless.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'
import { markup, render } from './utils/render-component'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')

/** The shipped component, not a copy: the point is to test what apps install. */
function component(rel: string): string {
  return readFileSync(path.join(UI, rel), 'utf-8')
}

/** The rendered <button>'s text, as a reader would see it. */
async function buttonText(pageSource: string): Promise<string> {
  const html = markup(await render(pageSource))
  const button = /<button[\s\S]*?<\/button>/.exec(html)?.[0] ?? ''
  return button.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

const PAGE_HEAD = `<script server>
const pageTitle = 'Dashboard'
const label = 'CallerLabel'
</script>
<script client>
const loading = state(false)
const busy = state(false)
</script>
`

describe('a slot expression is evaluated in the caller\'s scope', () => {
  it('resolves a caller server value whose name the component also uses', async () => {
    // `label` is a Button prop. The caller's value has to win in the caller's
    // own markup.
    expect(await buttonText(`${PAGE_HEAD}<Button>{{ label }}</Button>`)).toBe('CallerLabel')
  })

  it('resolves a caller server value the component does not shadow', async () => {
    expect(await buttonText(`${PAGE_HEAD}<Button>{{ pageTitle }}</Button>`)).toBe('Dashboard')
  })

  it('leaves a caller signal for the runtime even when the component shadows it', async () => {
    // This is the reported case: `loading` is both the caller's signal and a
    // Button prop, and the component's pass used to call the boolean.
    const text = await buttonText(`${PAGE_HEAD}<Button :loading="loading()">{{ loading() ? 'Signing in…' : 'Sign in' }}</Button>`)
    expect(text).toContain('{{')
    expect(text).toContain('Sign in')
  })

  it('leaves a caller signal whose name is free', async () => {
    const text = await buttonText(`${PAGE_HEAD}<Button>{{ busy() ? 'Working…' : 'Go' }}</Button>`)
    expect(text).toContain('{{')
  })

  it('matches what a native element does with the same expression', async () => {
    // The asymmetry was the whole complaint: same expression, same scope,
    // opposite outcome depending only on whether the tag is a component.
    const html = markup(await render(
      `${PAGE_HEAD}<Button :loading="loading()">{{ loading() ? 'A' : 'B' }}</Button>`
      + `<button :disabled="loading()">{{ loading() ? 'A' : 'B' }}</button>`,
    ))
    const buttons = (html.match(/<button[\s\S]*?<\/button>/g) ?? [])
      .map(b => b.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim())
    expect(buttons).toHaveLength(2)
    expect(buttons[0]).toBe(buttons[1])
  })

  it('leaves a plain static slot alone', async () => {
    expect(await buttonText(`${PAGE_HEAD}<Button :loading="loading()">Sign in</Button>`)).toBe('Sign in')
  })
})

/**
 * The half that matters most: a preserved `{{ }}` has to actually be filled in.
 * Shipping a literal mustache that never resolves would be worse than the bug.
 */
const SPA_FILES = {
  'layouts/app.stx': layout(''),
  'components/Button.stx': component('button/Button.stx'),
  'pages/index.stx': page('app', `<script client>
  const loading = state(false)
</script>

<Button className="probe" type="submit" :loading="loading()">{{ loading() ? 'Signing in…' : 'Sign in' }}</Button>`),
}

afterEach(() => {
  closeBrowser()
})

describe('the runtime fills in the slot expression it was handed', () => {
  it('renders the caller\'s text after hydration, and names the button', async () => {
    const app = await renderApp(SPA_FILES, { '/': 'pages/index.stx' })
    const browser = await boot(app, '/')
    await settle()

    const button = browser.document.querySelector('button.probe')
      ?? browser.document.querySelector('button')
    expect(button).not.toBeNull()

    const text = (button!.textContent ?? '').replace(/\s+/g, ' ').trim()
    expect(text).toContain('Sign in')
    // No leftover mustache: the runtime replaced it rather than displaying it.
    expect(text).not.toContain('{{')
  })
})
