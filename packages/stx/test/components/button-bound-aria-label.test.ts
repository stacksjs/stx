/**
 * A bound accessible name reaches the button.
 *
 * The shared Button read `ariaLabel` once on the server. A bound one, which
 * is how a row of icon buttons names each of them, has no server value: it
 * was written to the component's scope wrapper, an element with no box and no
 * role, and the `<button>` inside came out with no name. A screen reader
 * announced "button" for every one of them.
 */
import { afterEach, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../router/spa-harness'

afterEach(closeBrowser)

const button = await Bun.file(new URL('../../../components/src/ui/button/Button.stx', import.meta.url)).text()

const source = `<script client>
const name = state('Save draft')
const actions = state([{ id: 1, label: 'Edit' }, { id: 2, label: 'Delete' }])
window.probe = { name, actions }
</script>
<section data-one><Button :ariaLabel="name()"><span>*</span></Button></section>
<section data-kebab><Button :aria-label="name()"><span>*</span></Button></section>
<section data-written><Button ariaLabel="Close"><span>*</span></Button></section>
<section data-none><Button>Plain</Button></section>
<section data-rows><Button :for="action in actions()" :key="action.id" :ariaLabel="action.label"><span>*</span></Button></section>
`

it('names the button from a bound ariaLabel, and keeps following it', async () => {
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    'components/Button.stx': button,
    'pages/probe.stx': page('app', source),
  }, { '/probe': 'pages/probe.stx' })
  try {
    const browser = await boot(app, '/probe')
    await settle()
    expect(browser.errors).toEqual([])
    const names = (root: string) => [...browser.document.querySelectorAll(`${root} button`)].map(b => b.getAttribute('aria-label'))

    expect(names('[data-one]')).toEqual(['Save draft'])
    expect(names('[data-kebab]')).toEqual(['Save draft'])
    expect(names('[data-written]')).toEqual(['Close'])
    // No name asked for, none written: the button's own text names it.
    expect(names('[data-none]')).toEqual([null])
    expect(names('[data-rows]')).toEqual(['Edit', 'Delete'])

    browser.window.probe.name.set('Publish')
    browser.window.probe.actions.set([{ id: 2, label: 'Remove' }])
    await settle()
    expect(names('[data-one]')).toEqual(['Publish'])
    expect(names('[data-kebab]')).toEqual(['Publish'])
    expect(names('[data-rows]')).toEqual(['Remove'])

    browser.window.probe.name.set('')
    await settle()
    expect(names('[data-one]')).toEqual([null])
  }
  finally {
    await app.dispose()
  }
}, 30_000)
