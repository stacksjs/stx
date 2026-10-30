/**
 * <AiTextarea> in a real browser: the ghost overlay is only worth anything if
 * it lands on the same pixels as the text, which a DOM emulator cannot say.
 */
import { WebView } from 'bun'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { generateCss } from '../../stx/src/dev-server/ts-css'
import { processDirectives } from '../../stx/src/process'
import { createTempDir } from '../../stx/src/temp-dir'

let dir = ''
let view: InstanceType<typeof WebView>
let server: ReturnType<typeof Bun.serve>
const posted: Array<Record<string, unknown>> = []

const DOCUMENT = 'The quick brown fox jumps over the lazy dog and keeps running through the long meadow until the sun goes down behind the hills'

beforeAll(async () => {
  dir = createTempDir('stx-ai-textarea-')
  await Bun.write(join(dir, 'AiTextarea.stx'), Bun.file(resolve(import.meta.dir, '../src/ui/textarea/AiTextarea.stx')))
  const html = await processDirectives(`<!doctype html><html><head></head><body>
<script client>
const saved = state('')
const requests = []
window.requests = requests
window.reply = ' jumps over the lazy dog.'
function load(ctx, signal) {
  requests.push({ before: ctx.before, after: ctx.after, kind: ctx.kind, context: ctx.context, aborted: false })
  const entry = requests[requests.length - 1]
  signal.addEventListener('abort', () => { entry.aborted = true })
  return Promise.resolve(window.reply)
}
window.probe = { saved }
</script>
<div style="width: 320px; padding: 16px">
<AiTextarea id="note" label="Note" kind="note" context="Fables" rows="4" :fetcher="load" :debounceMs="30" :minChars="8" v-model:value="saved" />
</div>
<div style="width: 320px; padding: 16px">
<AiTextarea id="plain" rows="2" :fetcher="load" :completions="false" />
</div>
<div style="width: 320px; padding: 16px">
<AiTextarea id="remote" rows="2" kind="todo" fetcher="/api/complete" />
</div>
</body></html>`, {}, join(dir, 'page.stx'), { componentsDir: dir, cache: false, debug: false, root: dir }, new Set())
  const css = await generateCss(html, dir)
  const page = html.replace('</head>', `<style>${css}</style></head>`)
  await Bun.write(join(dir, 'page.html'), page)
  server = Bun.serve({
    port: 0,
    hostname: '127.0.0.1',
    async fetch(request) {
      if (new URL(request.url).pathname === '/api/complete' && request.method === 'POST') {
        posted.push(await request.json() as Record<string, unknown>)
        return Response.json({ completion: ' milk and eggs' })
      }
      return new Response(page, { headers: { 'Content-Type': 'text/html' } })
    },
  })
  view = new WebView({ headless: true, width: 900, height: 700, backend: { type: 'chrome', url: false } })
  await view.navigate(server.url.href)
  for (let i = 0; i < 150; i++) {
    if (await view.evaluate('!!window.probe && !!document.getElementById("note")'))
      break
    await Bun.sleep(20)
  }
}, 30_000)

afterAll(() => {
  view?.close()
  server?.stop(true)
  rmSync(dir, { recursive: true, force: true })
})

const waitFor = async (read: () => Promise<unknown>, expected: unknown): Promise<void> => {
  for (let i = 0; i < 150; i++) {
    if (await read() === expected)
      return
    await Bun.sleep(20)
  }
  expect(await read()).toBe(expected)
}

const ghost = (): Promise<string> => view.evaluate(`document.querySelector('#note-ghost [data-stx-ai-ghost-text]').textContent`) as Promise<string>

describe('AiTextarea', () => {
  it('renders the ghost layer hidden from assistive tech, with a polite live region', async () => {
    expect(await view.evaluate(`document.getElementById('note-ghost').getAttribute('aria-hidden')`)).toBe('true')
    expect(await view.evaluate(`getComputedStyle(document.getElementById('note-ghost')).pointerEvents`)).toBe('none')
    expect(await view.evaluate(`document.querySelector('[role=status]').getAttribute('aria-live')`)).toBe('polite')
  })

  it('shows a suggestion after typing, passes kind and context, and aligns it with the text', async () => {
    await view.click('#note')
    await view.type(DOCUMENT)
    await waitFor(ghost, ' jumps over the lazy dog.')
    const request = await view.evaluate(`JSON.stringify(window.requests[window.requests.length - 1])`) as string
    expect(JSON.parse(request)).toMatchObject({ before: DOCUMENT, kind: 'note', context: 'Fables' })
    expect(await view.evaluate(`document.querySelector('[role=status]').textContent`)).toContain('Suggestion available')
    expect(await view.evaluate(`document.querySelector('[role=status]').textContent`)).toContain('Tab')

    // The overlay's invisible text and the textarea wrap identically, so the
    // ghost starts at the caret: compare the two boxes' computed layout.
    const same = await view.evaluate(`(() => {
      const t = document.getElementById('note'), m = document.getElementById('note-ghost')
      const a = getComputedStyle(t), b = getComputedStyle(m)
      return ['fontSize','fontFamily','lineHeight','letterSpacing','paddingLeft','paddingTop','whiteSpace','overflowWrap'].every(k => a[k] === b[k])
        && t.getBoundingClientRect().width === m.getBoundingClientRect().width
        && t.getBoundingClientRect().height === m.getBoundingClientRect().height
    })()`)
    expect(same).toBe(true)

    // The invisible text before the caret wraps into exactly as many lines as
    // the textarea's own content, so the ghost starts on the caret's line.
    const lines = await view.evaluate(`(() => {
      const t = document.getElementById('note'), m = document.getElementById('note-ghost')
      const cs = getComputedStyle(t)
      const content = t.scrollHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      return JSON.stringify({
        textarea: Math.round(content / parseFloat(cs.lineHeight)),
        overlay: m.firstElementChild.getClientRects().length,
      })
    })()`) as string
    const { textarea, overlay } = JSON.parse(lines)
    expect(textarea).toBeGreaterThan(1)
    expect(overlay).toBe(textarea)
  })

  it('Tab accepts the suggestion into the field and keeps focus', async () => {
    await view.press('Tab')
    await waitFor(() => view.evaluate(`document.getElementById('note').value`), `${DOCUMENT} jumps over the lazy dog.`)
    expect(await ghost()).toBe('')
    expect(await view.evaluate(`document.activeElement.id`)).toBe('note')
    // The v-model followed the insertion.
    expect(await view.evaluate(`window.probe.saved()`)).toBe(`${DOCUMENT} jumps over the lazy dog.`)
  })

  it('Escape dismisses a suggestion and the next Tab moves on', async () => {
    await view.evaluate(`window.reply = ' and then rests.'`)
    await view.type(' It ran')
    await waitFor(ghost, ' and then rests.')
    await view.press('Escape')
    await waitFor(ghost, '')
    expect(await view.evaluate(`document.activeElement.id`)).toBe('note')
  })

  it('typing the start of the suggestion consumes it', async () => {
    await view.evaluate(`window.reply = ' towards the water.'`)
    await view.type(' slowly')
    await waitFor(ghost, ' towards the water.')
    const before = await view.evaluate(`window.requests.length`)
    await view.type(' to')
    await waitFor(ghost, 'wards the water.')
    expect(await view.evaluate(`window.requests.length`)).toBe(before)
  })

  it('Ctrl+Right accepts one word', async () => {
    await view.press('ArrowRight', { modifiers: ['Control'] })
    await waitFor(() => view.evaluate(`document.getElementById('note').value.endsWith(' towards')`), true)
    expect(await ghost()).toBe(' the water.')
  })

  it('does not ask while an IME composition is active', async () => {
    const count = await view.evaluate(`window.requests.length`)
    await view.evaluate(`(() => {
      const t = document.getElementById('note')
      t.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
      t.setRangeText(' に', t.selectionStart, t.selectionEnd, 'end')
      t.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }))
    })()`)
    await Bun.sleep(150)
    expect(await view.evaluate(`window.requests.length`)).toBe(count)
    expect(await ghost()).toBe('')
  })

  it('keeps the overlay scrolled with the textarea', async () => {
    await view.evaluate(`(() => {
      const t = document.getElementById('note')
      t.value = Array.from({ length: 30 }, (_, i) => 'Line number ' + i).join('\\n')
      t.dispatchEvent(new Event('input', { bubbles: true }))
      t.scrollTop = 60
      t.dispatchEvent(new Event('scroll'))
    })()`)
    expect(await view.evaluate(`document.getElementById('note-ghost').scrollTop === document.getElementById('note').scrollTop`)).toBe(true)
    expect(await view.evaluate(`document.getElementById('note').scrollTop`)).toBeGreaterThan(0)
  })

  it('a URL fetcher is POSTed { before, after, kind, context } and answers { completion }', async () => {
    await view.click('#remote')
    await view.type('Remember to buy')
    await waitFor(() => view.evaluate(`document.querySelector('#remote-ghost [data-stx-ai-ghost-text]').textContent`), ' milk and eggs')
    expect(posted.at(-1)).toEqual({ before: 'Remember to buy', after: '', kind: 'todo', context: '' })
  })

  it('a field with completions off never asks', async () => {
    const count = await view.evaluate(`window.requests.length`)
    await view.click('#plain')
    await view.type('This is a long enough sentence to ask')
    await Bun.sleep(200)
    expect(await view.evaluate(`window.requests.length`)).toBe(count)
  })
}, 60_000)
