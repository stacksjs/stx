/**
 * A loop on a component tag keeps its item in the slot content when the
 * component holding the loop is itself drawn once per row of an outer loop
 * (stacksjs/stx#2185).
 *
 * Slot content finds its caller's scope by walking up to the component it
 * was handed to, which it knows by id. A loop clone of that component carries
 * two ids, the live one and the template it was cloned from, and only the
 * template id was compared. The slot content of a clone is renamed with the
 * live id, so the walk passed the component and stopped at the first row
 * scope above it: the outer loop's, which has its own item and not the inner
 * one. Outside an outer loop the walk reached the page instead, which is
 * layered over the scope in hand, so the same markup worked there.
 */
import { afterEach, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../router/spa-harness'

afterEach(closeBrowser)

const button = await Bun.file(new URL('../../../components/src/ui/button/Button.stx', import.meta.url)).text()

const rowActions = `<script client>
const actions = useReactiveProp('actions', [])
function iconClass(action) { return 'icon-' + action.icon }
</script>
<div data-actions>
  <Button :for="action in actions()" :ariaLabel="action.label">
    <span data-glyph aria-hidden="true" :class="'h-4 w-4 ' + action.icon"></span>
    <span data-called :class="iconClass(action)"></span>
  </Button>
</div>
`

const pageSource = `<script client>
const rows = state([{ id: 1 }, { id: 2 }])
function actionsFor(row) {
  return [{ label: 'Edit ' + row.id, icon: 'i-edit' }, { label: 'Delete ' + row.id, icon: 'i-trash' }]
}
</script>
<table><tbody>
  <tr :for="row in rows()" :key="row.id">
    <td><RowActions :actions="actionsFor(row)" /></td>
  </tr>
</tbody></table>
<section data-single><RowActions :actions="actionsFor({ id: 9 })" /></section>
`

it('binds slot content to the loop item, inside an outer loop and outside one', async () => {
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    'components/Button.stx': button,
    'components/RowActions.stx': rowActions,
    'pages/probe.stx': page('app', pageSource),
  }, { '/probe': 'pages/probe.stx' })
  try {
    const browser = await boot(app, '/probe')
    await settle()
    expect(browser.errors).toEqual([])
    const read = (root: string) => ({
      glyphs: [...browser.document.querySelectorAll(`${root} [data-glyph]`)].map(s => s.getAttribute('class')),
      called: [...browser.document.querySelectorAll(`${root} [data-called]`)].map(s => s.getAttribute('class')),
    })

    expect(read('[data-single]')).toEqual({
      glyphs: ['h-4 w-4 i-edit', 'h-4 w-4 i-trash'],
      called: ['icon-i-edit', 'icon-i-trash'],
    })
    expect(read('tbody')).toEqual({
      glyphs: ['h-4 w-4 i-edit', 'h-4 w-4 i-trash', 'h-4 w-4 i-edit', 'h-4 w-4 i-trash'],
      called: ['icon-i-edit', 'icon-i-trash', 'icon-i-edit', 'icon-i-trash'],
    })
  }
  finally {
    await app.dispose()
  }
}, 30_000)
