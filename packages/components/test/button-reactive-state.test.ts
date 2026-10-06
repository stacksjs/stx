/**
 * Button's `disabled` and `loading` follow the parent's signal after render.
 *
 * Both props used to be evaluated once on the server and frozen:
 *
 *     const disabledNow = {{ isDisabled }}
 *     <button @if(isDisabled)disabled@endif>
 *
 * so the single most common piece of button state in an application could not
 * be expressed at all:
 *
 *     <Button :disabled="saving()" @click="save">Save</Button>
 *
 * `saving()` is a signal. On the server it is not yet meaningful, `isDisabled`
 * resolved false, and the button shipped enabled and stayed enabled for the
 * life of the page — through the exact async action it was there to guard.
 * Double-submit protection, destructive deletes and rotate-key confirmations
 * all land on this. The same freeze hid the built-in spinner: `loading` could
 * only ever be true if it had been true when the page was built, which is
 * never the case for an action that starts on a click.
 *
 * The reporting app measured 22 of its 50 otherwise-migratable buttons as
 * depending on a reactive `:disabled`, and kept a plain `<button>` for them.
 *
 * stacksjs/stx#1997.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, find, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')

/** The shipped component, not a copy: the point is to test what apps install. */
function component(rel: string): string {
  return readFileSync(path.join(UI, rel), 'utf-8')
}

/**
 * A parent that owns the signal, which is the shape the bug is about: the value
 * is not known until something happens on the client, long after render.
 */
const HOST = `<script client>
  const saving = state(false)
  function flip() { saving.set(!saving()) }
</script>

<div id="host">
  <Button className="probe" :disabled="saving()" :loading="saving()">Save</Button>
</div>`

/**
 * A parent whose button TEXT changes with its state.
 *
 * "Rotate" -> "Rotating..." is as common as disabling the button, and the slot
 * cannot express it: slot content is the caller's markup interpolated in the
 * caller's scope at render time, so it is a snapshot the way `disabled` used
 * to be.
 */
const LABEL_HOST = `<script client>
  const rotating = state(false)
  const rotateLabel = derived(() => rotating() ? 'Rotating...' : 'Rotate')
  function flip() { rotating.set(!rotating()) }
</script>

<div id="label-host">
  <Button className="labelled" :label="rotateLabel()" :disabled="rotating()" />
  <Button className="slotted">Save</Button>
  <Button className="static-label" label="Static" />
  <Button className="fallback" :label="rotateLabel()">Confirm</Button>
  <Button className="named" :label="rotateLabel()" ariaLabel="Rotate the key" />
</div>`

const FILES = {
  'layouts/app.stx': layout(''),
  'components/Button.stx': component('button/Button.stx'),
  'components/Host.stx': HOST,
  'components/LabelHost.stx': LABEL_HOST,
  'pages/index.stx': page('app', '<Host />'),
  'pages/labels.stx': page('app', '<LabelHost />'),
}

const ROUTES = { '/': 'pages/index.stx', '/labels': 'pages/labels.stx' }

interface Harness {
  /** The component's own <button>, found by the className the parent passed. */
  button: () => any
  /** The spinner, which stays in the DOM and is shown by `:show`. */
  spinner: () => any
  /** Flip the parent's signal. */
  flip: () => void
  dispose: () => Promise<void>
}

async function mount(): Promise<Harness> {
  const app = await renderApp(FILES, ROUTES)
  const browser = await boot(app, '/')
  await settle()
  const hostEl = find(browser, '#host').closest('[data-stx-scope]')
  const hostScope = browser.window.stx._scopes[hostEl.getAttribute('data-stx-scope')]
  return {
    button: () => find(browser, 'button.probe'),
    spinner: () => find(browser, 'button.probe svg'),
    // Called on the scope rather than dispatched: this harness renders the
    // @click attribute but does not wire it as a DOM listener, the same reason
    // dialog-modal-behaviour.test.ts invokes its handler directly.
    flip: () => hostScope.flip(),
    dispose: () => app.dispose(),
  }
}

/** `:show` toggles display rather than detaching, so ask the style. */
function visible(el: any): boolean {
  return !!el && el.style.display !== 'none'
}

afterEach(() => {
  closeBrowser()
})

describe('#1997 — Button reads disabled and loading as live props', () => {
  it('ships enabled while the parent signal is false', async () => {
    const h = await mount()
    expect(h.button().hasAttribute('disabled')).toBe(false)
    expect(h.button().getAttribute('aria-busy')).toBe('false')
    await h.dispose()
  })

  it('disables when the parent signal flips after render', async () => {
    const h = await mount()
    h.flip()
    await settle()
    // The whole bug: this stayed false forever, because the attribute came from
    // a value computed before the page was sent.
    expect(h.button().hasAttribute('disabled')).toBe(true)
    await h.dispose()
  })

  it('re-enables when the signal flips back, so the state is not one-way', async () => {
    const h = await mount()
    h.flip()
    await settle()
    h.flip()
    await settle()
    expect(h.button().hasAttribute('disabled')).toBe(false)
    await h.dispose()
  })

  it('marks itself busy for assistive tech while loading', async () => {
    const h = await mount()
    h.flip()
    await settle()
    expect(h.button().getAttribute('aria-busy')).toBe('true')
    await h.dispose()
  })

  it('reveals the spinner when loading turns on after render', async () => {
    const h = await mount()
    // Present from the start but hidden. It used to live inside an @if, so the
    // only way to see it was to have been loading when the page was built.
    expect(h.spinner()).toBeTruthy()
    expect(visible(h.spinner())).toBe(false)
    h.flip()
    await settle()
    expect(visible(h.spinner())).toBe(true)
    await h.dispose()
  })
})

/**
 * The other half of #1997: the label.
 *
 * `:text` on the component tag is not the answer - the runtime's text binding
 * writes textContent, which would erase the spinner and the icons this button
 * keeps inside itself - so the reactive spelling is a prop.
 */
describe('#1997 — Button reads its label as a live prop', () => {
  interface LabelHarness {
    button: (className: string) => any
    flip: () => void
    dispose: () => Promise<void>
  }

  async function mountLabels(): Promise<LabelHarness> {
    const app = await renderApp(FILES, ROUTES)
    const browser = await boot(app, '/labels')
    await settle()
    const hostEl = find(browser, '#label-host').closest('[data-stx-scope]')
    const hostScope = browser.window.stx._scopes[hostEl.getAttribute('data-stx-scope')]
    return {
      button: (className: string) => find(browser, `button.${className}`),
      flip: () => hostScope.flip(),
      dispose: () => app.dispose(),
    }
  }

  it('renders the label the parent signal currently holds', async () => {
    const harness = await mountLabels()
    try {
      expect(harness.button('labelled').textContent).toContain('Rotate')
    }
    finally {
      await harness.dispose()
    }
  })

  it('changes the label when the signal flips after render', async () => {
    const harness = await mountLabels()
    try {
      harness.flip()
      await settle()

      // The whole point: before this, the text was fixed at render and a
      // button could not say what it was doing.
      expect(harness.button('labelled').textContent).toContain('Rotating...')
    }
    finally {
      await harness.dispose()
    }
  })

  it('changes back, so the label is not one-way', async () => {
    const harness = await mountLabels()
    try {
      harness.flip()
      await settle()
      harness.flip()
      await settle()

      expect(harness.button('labelled').textContent).toContain('Rotate')
      expect(harness.button('labelled').textContent).not.toContain('Rotating')
    }
    finally {
      await harness.dispose()
    }
  })

  it('renders a static label on first paint', async () => {
    const harness = await mountLabels()
    try {
      expect(harness.button('static-label').textContent).toContain('Static')
    }
    finally {
      await harness.dispose()
    }
  })

  /*
   * The regression this could have caused. The button is a flex container with
   * a gap, so an empty label span would be a flex item and add a trailing gap
   * to every button in every app that uses the slot. `:if` removes it instead.
   *
   * This counted spans until #2034, when the slot gained a wrapper so it can
   * serve as a reactive label's fallback. The wrapper cannot be conditional --
   * `data-stx-parent-bindings` is stamped on the rendered HTML by the renderer
   * and never reaches the component's own server script, so the component
   * cannot know whether a reactive :label exists. So it asserts what the count
   * was standing in for: nothing inside the button is an extra FLEX ITEM.
   * display:contents is not a box, so the gap is unchanged -- which is the
   * property the gap regression was ever about.
   */
  it('adds no flex item to a button that uses the slot', async () => {
    const harness = await mountLabels()
    try {
      const slotted = harness.button('slotted')

      expect(slotted.textContent).toContain('Save')

      const boxes = [...slotted.querySelectorAll('span')]
        .filter((el: any) => !/display:\s*contents/.test(el.getAttribute('style') ?? ''))
      expect(boxes.length).toBe(0)

      // ...and the label span itself is still absent, which is the original point.
      expect(slotted.innerHTML).not.toContain(':text')
    }
    finally {
      await harness.dispose()
    }
  })
})

/**
 * Slot content is the reactive label's server-rendered fallback (#2034).
 *
 * `:label` is client-categorised, so the server cannot see it: the markup
 * actually served for `<Button :label="confirmLabel()" />` carries no text and
 * no accessible name, and assistive technology that reaches it before
 * hydration finds an unlabelled button. On a destructive confirmation -- the
 * reported case was "Delete project" -- that is the worst case.
 *
 * Slot content was not a way out, because the slot and the label span both
 * rendered: `<Button :label="confirmLabel()">Confirm</Button>` served
 * "Confirm" and then read "ConfirmDelete project" once the binding resolved.
 * An author had to choose between a server-rendered name and a reactive one,
 * which is why the reporting app went back to a plain <button>, where static
 * content is the served name and `:text` takes over after hydration.
 *
 * The slot is now that fallback. It renders inside a display:contents wrapper
 * that `:if` removes as soon as a label resolves, so the two never both show.
 *
 * The wrapper is why this is not simply `<slot :if="...">`: a slot is replaced
 * by the caller's markup at render time and any attribute on it goes too --
 * measured, `<div><slot :if="!label" /></div>` renders the content with the
 * binding silently dropped.
 */
describe('a reactive label falls back to slot content (#2034)', () => {
  it('serves the slot text, then replaces it with the label', async () => {
    const app = await renderApp(FILES, ROUTES)
    try {
      const browser = await boot(app, '/labels')

      // Served: the slot is the accessible name, before any script runs.
      const servedHtml = app.documents.get('/labels') ?? ''
      expect(servedHtml).toContain('Confirm')

      await settle()

      const button = find(browser, '.fallback')
      expect(button).not.toBeNull()

      const text = (button.textContent ?? '').replace(/\s+/g, ' ').trim()
      // The label won; the fallback is gone rather than sitting next to it.
      expect(text).toContain('Rotate')
      expect(text).not.toContain('Confirm')
    }
    finally {
      closeBrowser()
    }
  })

  it('keeps slot content when there is no label to replace it', async () => {
    const app = await renderApp(FILES, ROUTES)
    try {
      const browser = await boot(app, '/labels')
      await settle()

      // The wrapper must not swallow an ordinary slot-only button.
      const text = (find(browser, '.slotted').textContent ?? '').trim()
      expect(text).toContain('Save')
    }
    finally {
      closeBrowser()
    }
  })

  it('names a button that has a reactive label and no slot at all', async () => {
    // The one case the slot cannot cover, so the prop is the escape hatch.
    const app = await renderApp(FILES, ROUTES)
    try {
      const servedHtml = app.documents.get('/labels') ?? ''
      expect(servedHtml).toContain('aria-label="Rotate the key"')

      const browser = await boot(app, '/labels')
      await settle()
      expect(find(browser, '.named').getAttribute('aria-label')).toBe('Rotate the key')
    }
    finally {
      closeBrowser()
    }
  })

  it('emits no aria-label when none was given', async () => {
    // An empty one would suppress the name the slot or label supplies.
    const app = await renderApp(FILES, ROUTES)
    try {
      expect(app.documents.get('/labels') ?? '').not.toContain('aria-label=""')
    }
    finally {
      await app.dispose()
    }
  })
})
