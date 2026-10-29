import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { createBrowserFixture } from '../../test-utils/browser-fixture'
import { textareaMultilineSource } from '../../test-utils/textarea-multiline-fixture'
import { renderBrowserScreen } from '../../src/native/compiler/browser'
import { createTempDir } from '../../src/temp-dir'

it.each([false, true])('renders a real multiline field through the browser peer host (minify=%s)', async (minify) => {
  const root = createTempDir('stx-textarea-multiline-browser-')
  let fixture: ReturnType<typeof createBrowserFixture> | undefined
  try {
    await Bun.write(join(root, 'Screen.stx'), textareaMultilineSource)
    await Bun.write(join(root, 'platform.ts'), 'export async function createBrowserPlatform() { return { craft: {}, capabilities: [], call: async () => null, navigate() {}, dispose() {} } }')
    const html = await renderBrowserScreen({ root, source: 'Screen.stx', screen: 'Screen', minify, browser: {
      screen: 'Screen', container: '#screen', appURL: '/', routes: { '/': 'Screen' }, platformModule: join(root, 'platform.ts'),
    } })
    fixture = createBrowserFixture({
      createServer: () => Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: () => new Response(`<!doctype html><html><head></head><body>${html}</body></html>`, { headers: { 'Content-Type': 'text/html' } }) }),
      createView: () => new WebView({ headless: true, backend: { type: 'chrome', url: false } }),
    })
    const { view } = fixture
    // The peer renderer exposes test IDs/placeholders, not HTML id props.
    const find = (id: string) => id === 'notes' || id === 'lazy-notes'
      ? `document.querySelector('[placeholder="${id === 'notes' ? 'Notes' : 'Lazy notes'}"]')`
      : `document.querySelector('[data-testid="${id}"]')`
    const notes = find('notes')
    const wait = async (expression: string) => expect(await fixture!.waitFor(expression, Boolean)).toBe(true)
    const read = () => view.evaluate(`(() => {
      const field = ${notes};
      return { tag: field.tagName, value: field.value, model: probe.value(), identical: field === window.original,
        inputs: probe.inputs.map(value => typeof value === 'string' ? value : { unexpected: typeof value, type: value && value.type }), submits: probe.submits };
    })()`)
    const edit = (id: string, value: string, event = 'input') => view.evaluate(`(() => {
      const field = ${find(id)}; field.value = ${JSON.stringify(value)};
      field.dispatchEvent(new Event(${JSON.stringify(event)}, { bubbles: true }));
    })()`)
    await view.navigate(fixture.url)
    await wait(`!!window.probe && !!${notes}`)
    await view.evaluate(`void (window.original = ${notes})`)
    expect(await read()).toMatchObject({ tag: 'TEXTAREA', value: '\nSeed\nSecond\n', identical: true })
    expect(await view.evaluate(`['legacy', 'plain', 'explicit-single', 'explicit-multi'].map(id => document.querySelector('[data-testid="' + id + '"]').tagName)`)).toEqual(['INPUT', 'INPUT', 'INPUT', 'TEXTAREA'])
    const typed = '\n  First\nSecond  \n'
    await edit('notes', typed)
    await view.evaluate(`original.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))`)
    await wait(`probe.value() === ${JSON.stringify(typed)}`)
    expect(await read()).toMatchObject({ value: typed, model: typed, inputs: [typed], submits: 0, identical: true })
    const parent = '\nParent\n\nLast\n'
    await view.evaluate(`probe.value.set(${JSON.stringify(parent)})`)
    await wait(`${notes}.value === ${JSON.stringify(parent)}`)
    expect(await read()).toMatchObject({ value: parent, identical: true })
    await edit('lazy-notes', '\n  Lazy\nlines  \n')
    expect(await view.evaluate(`probe.lazy()`)).toBe('Saved')
    await edit('lazy-notes', '\n  Lazy\nlines  \n', 'change')
    await wait(`probe.lazy() === 'Lazy\\nlines'`)
    await edit('legacy', 'Legacy edit')
    await view.evaluate(`${find('legacy')}.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))`)
    await wait(`probe.legacySubmits.length === 1`)
    expect(await view.evaluate(`({ inputs: probe.legacyInputs, submitted: probe.legacySubmits.map(event => event[0]), forms: probe.submits })`)).toEqual({
      inputs: ['Legacy edit'], submitted: ['Legacy edit'], forms: 0,
    })
    // An authored legacy submit handler owns Enter. An ordinary single-line
    // input still takes the implicit form-submit path exactly once.
    await view.evaluate(`${find('plain')}.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))`)
    await wait(`probe.submits === 1`)

    await view.evaluate(`probe.shown.set(false)`)
    await wait(`!${notes}`)
    await view.evaluate(`(() => { original.value = 'Stale'; original.dispatchEvent(new Event('input', { bubbles: true })) })()`)
    expect(await view.evaluate(`probe.value()`)).toBe(parent)
    const remount = 'Remount\n\nvalue\n'
    await view.evaluate(`(() => { probe.value.set(${JSON.stringify(remount)}); probe.shown.set(true) })()`)
    await wait(`${notes}?.value === ${JSON.stringify(remount)}`)
    expect(await view.evaluate(`${notes} !== original && ${notes}.tagName === 'TEXTAREA'`)).toBe(true)
    await view.evaluate(`void (window.original = ${notes})`)
    await edit('notes', 'New\nedit')
    await wait(`probe.value() === 'New\\nedit'`)
    expect(await read()).toMatchObject({ value: 'New\nedit', model: 'New\nedit', inputs: [typed, 'New\nedit'], identical: true, submits: 1 })
  }
  finally {
    fixture?.close()
    await rm(root, { recursive: true, force: true })
  }
}, 30_000)
