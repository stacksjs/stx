import { afterAll, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from './spa-harness'

afterAll(closeBrowser)

it('mounts a keyed row once when a child reconciles its forwarded prop during setup', async () => {
  const app = await renderApp({
    'layouts/default.stx': layout('<header>chrome</header>'),
    'components/Editor.stx': `<script client>
window.EDITOR_SETUPS = (window.EDITOR_SETUPS || 0) + 1
if (window.EDITOR_SETUPS > 8) throw new Error('Keyed editor setup reentered')
const text = useReactiveProp('text', '')
const body = state(text())
watch(text, value => { if (body() !== value) body.set(value) })
</script>
<textarea data-editor x-model="body"></textarea>`,
    'views/editor.stx': page('default', `<script client>
const first = { id: 1, text: 'Opening' }
const second = { id: 2, text: 'Conclusion' }
const drafts = state([first, second])
const rows = derived(() => drafts().map((draft, index) => ({ ...draft, number: index + 1 })))
window.SHOW_SECOND = visible => drafts.set(visible ? [first, second] : [first])
</script>
<article x-for="row in rows()" :key="row.id" data-row><Editor :text="row.text" /></article>`),
  }, { '/editor': 'views/editor.stx' })
  try {
    const browser = await boot(app, '/editor')
    const bodies = () => [...browser.document.querySelectorAll<HTMLTextAreaElement>('[data-editor]')].map(editor => editor.value)
    expect(bodies()).toEqual(['Opening', 'Conclusion'])
    browser.window.SHOW_SECOND(false)
    await settle()
    expect(bodies()).toEqual(['Opening'])
    const before = browser.window.EDITOR_SETUPS
    browser.window.SHOW_SECOND(true)
    await settle()
    expect(bodies()).toEqual(['Opening', 'Conclusion'])
    expect(browser.window.EDITOR_SETUPS - before).toBe(1)
    expect(browser.errors).toEqual([])
  }
  finally { await app.dispose() }
})
