/**
 * An `@event` on a nested component tag leaves the component's own scope alone
 * (stacksjs/stx#2018).
 *
 * `<Child @change="onChange($event)" />` forwards the listener to the child's
 * rendered root, which is also the element carrying `data-stx-scope`. The
 * report was that the attribute "clobbers" the child's scope: its own
 * `derived()` reported `is not defined` at hydration, and only when the
 * `@change` was present.
 *
 * In a browser that never happened. The renderer splices the forwarded
 * attributes in front of `data-stx-scope`, and very-happy-dom's HTML parser
 * (before 0.3.5) gave up on a tag at the first `@`-prefixed attribute name,
 * emitting the rest of the tag as text. So the root lost `data-stx-scope`, the
 * child's bindings fell through to the page scope, and the forwarded listener
 * was never attached either. The harness was reporting its own DOM, not the
 * runtime. With a parser that accepts the names a browser accepts, every case
 * below holds, including that the event actually reaches the parent.
 *
 * Each case drives the whole pipeline through the SPA harness and asserts
 * three things: the child's own binding rendered from the child's scope, the
 * runtime logged nothing, and the forwarded handler ran in the parent's scope.
 */
import type { Browser, SpaApp } from '../router/spa-harness'
import { afterEach, beforeEach, describe, expect, it, setDefaultTimeout, spyOn } from 'bun:test'
import { boot, closeBrowser, find, layout, page, renderApp, settle, text } from '../router/spa-harness'

setDefaultTimeout(60_000)

/** Its own signal, a derived over it, and an emit the parent listens for. */
const CHILD = `<script client>
const count = state(3)
const label = derived(() => 'child ' + count())
const emit = defineEmits()
function bump() {
  count.set(count() + 1)
  emit('change', count())
}
function shut() { emit('close') }
</script>
<div class="child"><span class="label">{{ label() }}</span><button class="bump" @click="bump()">+</button></div>
`

/** No script at all: there is no child scope, so the root is just markup. */
const PLAIN = `<button class="plain">plain</button>
`

/** A component that itself forwards an event from a nested component. */
const OUTER = `<script client>
const seen = state(0)
const outerLabel = derived(() => 'outer ' + seen())
const emit = defineEmits()
function onInner(value) {
  seen.set(value)
  emit('select', value * 10)
}
</script>
<section class="outer"><span class="outer-label">{{ outerLabel() }}</span><Child @change="onInner($event)" /></section>
`

const PARENT_SCRIPT = `<script client>
const got = state('none')
const closed = state(0)
function onChange(value) { got.set('change ' + value) }
function onClose() { closed.set(closed() + 1) }
function onSelect(value) { got.set('select ' + value) }
function onPlain(id) { got.set('plain ' + id) }
</script>
<p id="got">{{ got() }}</p><p id="closed">{{ closed() }}</p>
`

let logged: string[] = []
let spies: Array<{ mockRestore: () => void }> = []
let app: SpaApp | null = null

beforeEach(() => {
  logged = []
  spies = [
    spyOn(console, 'error').mockImplementation((...args: unknown[]) => { logged.push(args.map(String).join(' ')) }),
    spyOn(console, 'warn').mockImplementation((...args: unknown[]) => { logged.push(args.map(String).join(' ')) }),
  ]
})

afterEach(async () => {
  closeBrowser()
  for (const spy of spies)
    spy.mockRestore()
  await app?.dispose()
  app = null
})

async function mount(body: string): Promise<Browser> {
  app = await renderApp({
    'layouts/app.stx': layout(''),
    'components/Child.stx': CHILD,
    'components/Plain.stx': PLAIN,
    'components/Outer.stx': OUTER,
    'pages/index.stx': page('app', `${PARENT_SCRIPT}${body}`),
  }, { '/': 'pages/index.stx' })
  // Rendering warns about the temp app's layout; only the browser matters here.
  logged = []
  const browser = await boot(app, '/')
  await settle()
  return browser
}

/** Every rendered child's root, the element both the scope and the listener live on. */
function childRoots(browser: Browser): any[] {
  return Array.from(browser.document.querySelectorAll('[data-stx-scope]'))
    .filter((el: any) => el.querySelector(':scope > .child'))
}

async function click(browser: Browser, el: any): Promise<void> {
  el.dispatchEvent(new browser.window.Event('click', { bubbles: true }))
  await settle()
}

function runtimeComplaints(): string[] {
  return logged.filter(line => line.includes('[stx]'))
}

describe('#2018 - an @event on a component tag keeps the child scope', () => {
  it('a client-script parent forwarding @change', async () => {
    const browser = await mount('<div id="w"><Child @change="onChange($event)" /></div>')

    const [root] = childRoots(browser)
    expect(root, 'the child root keeps data-stx-scope').toBeTruthy()
    expect(text(browser, '#w .label')).toBe('child 3')
    expect(browser.errors).toEqual([])
    expect(runtimeComplaints()).toEqual([])

    await click(browser, find(browser, '#w .bump'))
    expect(text(browser, '#w .label'), 'the child updated its own signal').toBe('child 4')
    expect(text(browser, '#got'), 'the parent received the payload').toBe('change 4')
  })

  it('the same tag without a parent script still hydrates the child', async () => {
    app = await renderApp({
      'layouts/app.stx': layout(''),
      'components/Child.stx': CHILD,
      'pages/index.stx': page('app', '<div id="w"><Child @change="void 0" /></div>'),
    }, { '/': 'pages/index.stx' })
    logged = []
    const browser = await boot(app, '/')
    await settle()

    expect(text(browser, '#w .label')).toBe('child 3')
    expect(browser.errors).toEqual([])
    expect(runtimeComplaints()).toEqual([])
  })

  it('several forwarded events on one tag', async () => {
    const browser = await mount('<div id="w"><Child @change="onChange($event)" @close="onClose()" /></div>')

    const [root] = childRoots(browser)
    expect(root.getAttribute('data-stx-parent-events')).toBe('change close')
    expect(text(browser, '#w .label')).toBe('child 3')

    await click(browser, find(browser, '#w .bump'))
    expect(text(browser, '#got')).toBe('change 4')

    browser.window.stx._scopes[root.getAttribute('data-stx-scope')].shut()
    await settle()
    expect(text(browser, '#closed')).toBe('1')
    expect(runtimeComplaints()).toEqual([])
  })

  it('an event with modifiers', async () => {
    const browser = await mount('<div id="w"><Child @change.once="onChange($event)" @close.stop="onClose()" /></div>')

    const [root] = childRoots(browser)
    expect(root.getAttribute('data-stx-parent-events')).toBe('change close')
    expect(text(browser, '#w .label')).toBe('child 3')

    await click(browser, find(browser, '#w .bump'))
    await click(browser, find(browser, '#w .bump'))
    expect(text(browser, '#w .label')).toBe('child 5')
    expect(text(browser, '#got'), '.once delivered the first emit only').toBe('change 4')

    browser.window.stx._scopes[root.getAttribute('data-stx-scope')].shut()
    await settle()
    expect(text(browser, '#closed')).toBe('1')
    expect(runtimeComplaints()).toEqual([])
  })

  it('a component inside @foreach, one handler per iteration', async () => {
    const browser = await mount(`<div id="w">
@foreach([1, 2, 3] as n)
  <Child @change="onChange({{ n }} * 100 + $event)" />
@endforeach
</div>`)

    const roots = childRoots(browser)
    expect(roots).toHaveLength(3)
    expect(roots.map(root => root.querySelector('.label').textContent.trim()))
      .toEqual(['child 3', 'child 3', 'child 3'])
    expect(new Set(roots.map(root => root.getAttribute('data-stx-scope'))).size, 'each child its own scope').toBe(3)

    await click(browser, roots[1].querySelector('.bump'))
    expect(roots.map(root => root.querySelector('.label').textContent.trim()))
      .toEqual(['child 3', 'child 4', 'child 3'])
    expect(text(browser, '#got')).toBe('change 204')
    expect(runtimeComplaints()).toEqual([])
  })

  it('a component inside a client :for, with the loop item in the handler', async () => {
    const browser = await mount(`<script client>
const rows = state([{ id: 7 }, { id: 8 }])
</script>
<div id="w"><div :for="row in rows()" class="row"><Child @change="onChange(row.id + ':' + $event)" /></div></div>`)

    const roots = childRoots(browser)
    expect(roots).toHaveLength(2)
    expect(roots.map(root => root.querySelector('.label').textContent.trim()))
      .toEqual(['child 3', 'child 3'])

    await click(browser, roots[1].querySelector('.bump'))
    expect(roots[1].querySelector('.label').textContent.trim()).toBe('child 4')
    expect(text(browser, '#got')).toBe('change 8:4')
    expect(runtimeComplaints()).toEqual([])
  })

  it('two levels deep: the middle component listens to its child and the page to the middle', async () => {
    const browser = await mount('<div id="w"><Outer @select="onSelect($event)" /></div>')

    expect(text(browser, '#w .outer-label'), 'the middle component kept its scope').toBe('outer 0')
    expect(text(browser, '#w .label'), 'the inner component kept its scope').toBe('child 3')

    await click(browser, find(browser, '#w .bump'))
    expect(text(browser, '#w .label')).toBe('child 4')
    expect(text(browser, '#w .outer-label'), 'the middle handler ran in the middle scope').toBe('outer 4')
    expect(text(browser, '#got'), 'the page handler ran in the page scope').toBe('select 40')
    expect(runtimeComplaints()).toEqual([])
  })

  it('a component with no script forwards a native event to the parent', async () => {
    const browser = await mount('<div id="w"><Plain @click="onPlain(1)" /></div>')

    const button = find(browser, '#w .plain')
    expect(button).toBeTruthy()
    expect(button.getAttribute('data-stx-parent-events')).toBe('click')

    await click(browser, button)
    expect(text(browser, '#got')).toBe('plain 1')
    expect(browser.errors).toEqual([])
    expect(runtimeComplaints()).toEqual([])
  })
})
