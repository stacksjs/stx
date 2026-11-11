/**
 * <CodeEditor> in a real browser.
 *
 * The editor is a text field laid over a painted copy of itself, and nearly
 * everything that can go wrong with that is something a DOM emulator cannot
 * see: whether the two layers are on the same pixels, whether the engine's own
 * editing reaches the model, how many lines are actually drawn, what a key
 * costs with two thousand lines in the field.
 *
 * WebKit where there is one, since a Craft window is a WKWebView and that is
 * where this editor has to be fast.
 */
import { WebView } from 'bun'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { resolve } from 'node:path'
import { sampleTypeScript } from '../../examples/code-editor-sample'
import { generateCss } from '../../../stx/src/dev-server/ts-css'
import { processDirectives } from '../../../stx/src/process'
import { allowForARealBrowser } from '../../../stx/test-utils/browser-timeout'

allowForARealBrowser()

const ROOT = resolve(import.meta.dir, '../..')
/*
 * Two thousand lines, with the sample's two import lines swapped for a
 * declaration. A page script that holds the text `import { x } from 'y'` inside
 * a string has it taken for one of the script's own imports, and the page's
 * script is then a syntax error. That is a problem in how a page script is
 * scanned, not in the editor, and a component's script does not have it.
 */
const SAMPLE = ['const first = \'row\'', ...sampleTypeScript(2001).split('\n').slice(2)].join('\n')
const APPLE = process.platform === 'darwin'

let view: InstanceType<typeof WebView>
let server: ReturnType<typeof Bun.serve>

const run = <T = unknown>(body: string): Promise<T> => view.evaluate(`(() => { ${body} })()`) as Promise<T>
const json = async <T = any>(body: string): Promise<T> => JSON.parse(await run<string>(`return Promise.resolve((() => { ${body} })()).then(result => JSON.stringify(result))`))

/** The field of an editor, and the pieces of its view. */
const PARTS = `
  const field = id => document.getElementById(id)
  const root = id => field(id).closest('[data-stx-code-editor]')
  const part = (id, name) => root(id).querySelector('[data-ce="' + name + '"]')
`
const on = (body: string): string => `${PARTS}\n${body}`

/** Put the caret somewhere, and tell the editor the way a browser would. */
const caretAt = (id: string, offset: string, end = offset): Promise<unknown> => run(on(`
  const f = field('${id}'); f.focus(); f.setSelectionRange(${offset}, ${end})
  document.dispatchEvent(new Event('selectionchange'))
  return true
`))

/** Type through the engine's own editing, one character at a time, as keys do. */
const type = (text: string): Promise<unknown> => run(`
  for (const character of ${JSON.stringify(text)}) document.execCommand('insertText', false, character)
  return true
`)

/** A key press, as the field receives it. True when the editor did not handle it. */
const key = (id: string, name: string, modifiers: { mod?: boolean, shift?: boolean, ctrl?: boolean } = {}): Promise<boolean> => run(on(`
  return field('${id}').dispatchEvent(new KeyboardEvent('keydown', {
    key: ${JSON.stringify(name)}, bubbles: true, cancelable: true,
    metaKey: ${Boolean(modifiers.mod && APPLE)}, ctrlKey: ${Boolean((modifiers.mod && !APPLE) || modifiers.ctrl)}, shiftKey: ${Boolean(modifiers.shift)},
  }))
`))

const value = (id: string): Promise<string> => run(on(`return field('${id}').value`))
const settle = (): Promise<void> => Bun.sleep(60)

beforeAll(async () => {
  const html = await processDirectives(`<!doctype html><html><head><meta charset="utf-8"><script>window.__errors=[];window.addEventListener('error',function(e){window.__errors.push(String(e.message))})</script></head><body>
<script client>
const big = state({{ sample }})
const small = state('const a = 1\\nfunction f() {\\n  return a\\n}')
const marks = state([])
const notes = state([])
const hint = state('')
const names = [{ label: 'getUser' }, { label: 'getUserByEmail', detail: '(email)' }, { label: 'forget' }, { label: 'where', insert: 'where()' }]
const events = { run: [], runSelection: [], selection: [], complete: [], ghost: [] }
window.probe = { big, small, marks, notes, hint, events }
</script>
<div style="width: 720px; padding: 16px">
  <CodeEditor id="big" label="Big file" height="400px" v-model:value="big" />
</div>
<div style="width: 720px; padding: 16px">
  <CodeEditor id="small" height="220px" v-model:value="small" :completions="names" :diagnostics="marks()" :widgets="notes()" :ghostText="hint()"
    @run="events.run.push($event)" @run-selection="events.runSelection.push($event)" @selection="events.selection.push($event)"
    @complete="events.complete.push($event)" @ghost="events.ghost.push($event)" />
</div>
<div style="width: 720px; padding: 16px">
  <CodeEditor id="locked" height="120px" value="const fixed = true" readonly lineNumbers="false" language="no-such-language" placeholder="Nothing here" />
</div>
</body></html>`, { sample: SAMPLE }, resolve(ROOT, 'code-editor-browser.stx'), { componentsDir: resolve(ROOT, 'src/ui'), root: ROOT, cache: false, debug: false } as any, new Set())

  const css = await generateCss(html, ROOT)
  const page = html.replace('</head>', `<style>${css}</style></head>`)
  server = Bun.serve({
    port: 0,
    hostname: '127.0.0.1',
    fetch: () => new Response(page, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
  })
  view = new WebView({ headless: true, width: 900, height: 900, backend: APPLE ? { type: 'webkit' } : { type: 'chrome', url: false } } as any)
  await view.navigate(server.url.href)

  for (let attempt = 0; attempt < 200; attempt++) {
    if (await view.evaluate(`document.querySelectorAll('[data-ce-ready]').length === 3 && document.querySelectorAll('[data-ce="rows"] span').length > 0`))
      break
    await Bun.sleep(25)
  }
}, 60_000)

afterAll(() => {
  view?.close()
  server?.stop(true)
})

describe('what is drawn', () => {
  it('raises no script errors on the way up', async () => {
    expect(await json(`return window.__errors`)).toEqual([])
  })

  it('mounts every editor on the page with its text in the field', async () => {
    expect(await view.evaluate(`document.querySelectorAll('[data-ce-ready]').length`)).toBe(3)
    expect(await value('big')).toBe(SAMPLE)
    expect(await value('locked')).toBe('const fixed = true')
  })

  it('draws the lines on screen, not the two thousand in the file', async () => {
    const drawn = await json(on(`return { rows: part('big', 'rows').childElementCount, numbers: part('big', 'gutter-rows').childElementCount, height: part('big', 'content').style.height }`))

    expect(drawn.rows).toBeGreaterThan(15)
    expect(drawn.rows).toBeLessThan(80)
    expect(drawn.numbers).toBe(drawn.rows)
    // The scroller still scrolls the whole file: 2,000 lines of 20px and the padding.
    expect(drawn.height).toBe('40016px')
  })

  it('colours the code with token classes', async () => {
    const first = await run<string>(on(`return part('big', 'rows').firstElementChild.innerHTML`))

    expect(first).toContain('<span class="tok-keyword">const</span>')
    expect(first).toContain('tok-string')
    const colours = await json(on(`
      const span = name => getComputedStyle(part('big', 'rows').querySelector('.tok-' + name)).color
      return { keyword: span('keyword'), string: span('string'), plain: getComputedStyle(part('big', 'rows')).color }
    `))
    expect(colours.keyword).not.toBe(colours.plain)
    expect(colours.string).not.toBe(colours.keyword)
  })

  it('keeps the field and its painted copy on the same pixels', async () => {
    const boxes = await json(on(`
      const f = field('big'), rows = part('big', 'rows'), a = getComputedStyle(f), b = getComputedStyle(rows)
      const same = ['fontFamily', 'fontSize', 'lineHeight', 'letterSpacing', 'tabSize', 'whiteSpace', 'paddingLeft', 'fontVariantLigatures'].filter(k => a[k] !== b[k])
      const fr = f.getBoundingClientRect(), first = rows.firstElementChild.getBoundingClientRect(), second = rows.children[1].getBoundingClientRect()
      return { same, top: first.top - fr.top, padTop: parseFloat(a.paddingTop), left: first.left - fr.left, step: second.top - first.top, line: parseFloat(a.lineHeight), padLeft: parseFloat(a.paddingLeft), fill: a.webkitTextFillColor }
    `))

    expect(boxes.same).toEqual([])
    expect(boxes.top).toBe(boxes.padTop)
    expect(boxes.left).toBe(boxes.padLeft)
    expect(boxes.step).toBe(boxes.line)
    // The field's own text is invisible, or every character would be drawn twice.
    expect(boxes.fill).toMatch(/rgba\(0, 0, 0, 0\)|transparent/)
  })

  it('measures a character the way the field lays one out', async () => {
    // The same text in the measuring element and in a drawn row has to be the
    // same width, or everything positioned by column drifts along the line.
    const widths = await json(on(`
      const row = part('big', 'rows').firstElementChild, m = part('big', 'measure')
      const range = document.createRange(); range.selectNodeContents(row)
      m.textContent = row.textContent
      return { row: range.getBoundingClientRect().width, measured: m.getBoundingClientRect().width }
    `))

    expect(Math.abs(widths.row - widths.measured)).toBeLessThan(0.5)
  })

  it('the field is the accessible control; the layers around it are not read', async () => {
    const a11y = await json(on(`
      const f = field('small')
      return {
        label: field('big').getAttribute('aria-label'), multiline: f.getAttribute('aria-multiline'),
        controls: !!document.getElementById(f.getAttribute('aria-controls')), describedBy: document.getElementById(f.getAttribute('aria-describedby')).getAttribute('role'),
        expanded: f.getAttribute('aria-expanded'), hidden: ['gutter', 'rows', 'widgets', 'decorations'].map(n => part('small', n).getAttribute('aria-hidden')),
        spellcheck: f.getAttribute('spellcheck'), wrap: f.getAttribute('wrap'),
      }
    `))

    expect(a11y).toEqual({
      label: 'Big file', multiline: 'true', controls: true, describedBy: 'status', expanded: 'false',
      hidden: ['true', 'true', 'true', 'true'], spellcheck: 'false', wrap: 'off',
    })
  })

  it('a language with no grammar is shown plain, and a gutter can be turned off', async () => {
    const locked = await json(on(`return { html: part('locked', 'rows').innerHTML, gutter: getComputedStyle(part('locked', 'gutter')).display, readOnly: field('locked').readOnly }`))

    expect(locked.html).toBe('<div class="stx-ce-line">const fixed = true</div>')
    expect(locked.gutter).toBe('none')
    expect(locked.readOnly).toBe(true)
  })
})

describe('typing', () => {
  it('a typed character reaches the model and the bound signal, and redraws one row', async () => {
    await caretAt('small', `field('small').value.length`)
    await run(on(`window.__rows = [...part('small', 'rows').children].map(r => r.innerHTML); return true`))
    await type('1')
    await settle()

    expect(await value('small')).toBe('const a = 1\nfunction f() {\n  return a\n}1')
    expect(await view.evaluate(`window.probe.small()`)).toBe('const a = 1\nfunction f() {\n  return a\n}1')
    const changed = await json(on(`return [...part('small', 'rows').children].map((r, i) => r.innerHTML !== window.__rows[i] ? i : -1).filter(i => i >= 0)`))
    expect(changed).toEqual([3])
  })

  it('an opening bracket brings its closer, and typing the closer steps over it', async () => {
    await type('(')
    expect(await value('small')).toEndWith('}1()')
    expect(await run(on(`return field('small').selectionStart === field('small').value.length - 1`))).toBe(true)
    await type(')')
    expect(await value('small')).toEndWith('}1()')
    expect(await run(on(`return field('small').selectionStart === field('small').value.length`))).toBe(true)
  })

  it('Enter keeps the indentation and goes deeper after a bracket', async () => {
    await caretAt('small', `field('small').value.indexOf('{') + 1`)
    expect(await key('small', 'Enter')).toBe(false)
    await type('x')

    expect(await value('small')).toContain('function f() {\n  x\n  return a')
  })

  it('a line break that arrives without a key is indented the same', async () => {
    // What an on-screen keyboard or dictation sends: the input, and no key.
    await run(`document.execCommand('insertLineBreak'); return true`)
    await type('y')

    expect(await value('small')).toContain('function f() {\n  x\n  y\n  return a')
  })

  it('Tab indents the selected lines and Shift-Tab takes it back', async () => {
    const before = await value('small')
    await caretAt('small', `field('small').value.indexOf('  x')`, `field('small').value.indexOf('  return')`)
    await key('small', 'Tab')
    expect(await value('small')).toContain('{\n    x\n    y\n  return a')
    await key('small', 'Tab', { shift: true })
    expect(await value('small')).toBe(before)
  })

  it('the comment key comments the line and uncomments it again', async () => {
    const before = await value('small')
    await caretAt('small', `field('small').value.indexOf('return')`)
    await key('small', '/', { mod: true })
    expect(await value('small')).toContain('\n  // return a\n')
    expect(await run<string>(on(`return [...part('small', 'rows').children].find(r => r.textContent.includes('return')).innerHTML`))).toContain('tok-comment')
    await key('small', '/', { mod: true })
    expect(await value('small')).toBe(before)
  })

  it('undo and redo are the editor\'s, and put the field back too', async () => {
    const before = await value('small')
    await caretAt('small', '0')
    await key('small', '/', { mod: true })
    expect(await value('small')).toStartWith('// const a')
    await key('small', 'z', { mod: true })
    expect(await value('small')).toBe(before)
    await key('small', 'z', { mod: true, shift: true })
    expect(await value('small')).toStartWith('// const a')
    await key('small', 'z', { mod: true })
    expect(await view.evaluate(`window.probe.small()`)).toBe(before)
  })

  it('text composed by an input method reaches the model when it is committed', async () => {
    await caretAt('small', '0')
    await run(on(`
      const f = field('small')
      f.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
      f.setRangeText('に', 0, 0, 'end')
      f.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true, inputType: 'insertCompositionText' }))
      f.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'に' }))
      return true
    `))

    expect(await view.evaluate(`window.probe.small()`)).toStartWith('にconst a')
    await key('small', 'z', { mod: true })
    expect(await view.evaluate(`window.probe.small()`)).toStartWith('const a')
  })

  it('a read-only editor does not change', async () => {
    await caretAt('locked', '0')
    await type('x')
    await key('locked', 'Enter')

    expect(await value('locked')).toBe('const fixed = true')
  })

  it('a value set by the parent replaces the text', async () => {
    await run(`window.probe.small.set('let fresh = [1, 2]\\n'); return true`)
    await settle()

    expect(await value('small')).toBe('let fresh = [1, 2]\n')
    expect(await run<string>(on(`return part('small', 'rows').firstElementChild.textContent`))).toBe('let fresh = [1, 2]')
  })
})

describe('running', () => {
  it('the run key sends the whole text and where the caret is', async () => {
    await caretAt('small', '4')
    await key('small', 'Enter', { mod: true })
    const sent = await json(`return window.probe.events.run`)

    expect(sent).toHaveLength(1)
    expect(sent[0].value).toBe('let fresh = [1, 2]\n')
    expect(sent[0].selection).toMatchObject({ line: 0, column: 4, empty: true })
  })

  it('run-selection sends the selection, or the caret\'s line when there is none', async () => {
    await caretAt('small', '4', '9')
    await key('small', 'Enter', { mod: true, shift: true })
    await caretAt('small', '2')
    await key('small', 'Enter', { mod: true, shift: true })
    const sent = await json(`return window.probe.events.runSelection`)

    expect(sent[0]).toEqual({ text: 'fresh', from: 4, to: 9, line: 0, selected: true })
    expect(sent[1]).toEqual({ text: 'let fresh = [1, 2]', from: 0, to: 18, line: 0, selected: false })
  })

  it('the selection event follows the caret', async () => {
    await caretAt('small', '7')
    const last = await json(`return window.probe.events.selection.at(-1)`)

    expect(last).toMatchObject({ head: 7, line: 0, column: 7, empty: true })
  })
})

describe('the completion popup', () => {
  const popup = (): Promise<any> => json(on(`
    const list = document.getElementById(field('small').getAttribute('aria-controls'))
    return {
      shown: getComputedStyle(list).display !== 'none',
      labels: [...list.querySelectorAll('[role=option]')].map(o => o.querySelector('.stx-ce-option-label').textContent),
      selected: [...list.querySelectorAll('[role=option]')].findIndex(o => o.getAttribute('aria-selected') === 'true'),
      expanded: field('small').getAttribute('aria-expanded'),
      active: field('small').getAttribute('aria-activedescendant'),
      top: list.getBoundingClientRect().top - part('small', 'region').getBoundingClientRect().top,
      left: list.getBoundingClientRect().left - part('small', 'region').getBoundingClientRect().left,
    }
  `))

  it('opens under the caret as a word is typed, best match first', async () => {
    await caretAt('small', `field('small').value.length`)
    await type('get')
    await settle()
    const state = await popup()

    expect(state.shown).toBe(true)
    expect(state.labels).toEqual(['getUser', 'getUserByEmail', 'forget'])
    expect(state.selected).toBe(0)
    expect(state.expanded).toBe('true')
    expect(state.active).toBeTruthy()
    // Line 2 of the file: under it is two lines and the padding down.
    expect(state.top).toBe(8 + 2 * 20)
    expect(state.left).toBe(12)
  })

  it('asks the host too, saying what has been typed', async () => {
    const asked = await json(`return window.probe.events.complete.at(-1)`)

    expect(asked).toMatchObject({ query: 'g', from: 19, line: 1, explicit: false, trigger: 'g' })
  })

  it('narrows as typing continues, without closing', async () => {
    await type('U')
    await settle()

    expect((await popup()).labels).toEqual(['getUser', 'getUserByEmail'])
  })

  it('arrow keys move through it and the field keeps the focus', async () => {
    await key('small', 'ArrowDown')
    await settle()
    const state = await popup()

    expect(state.selected).toBe(1)
    expect(await view.evaluate(`document.activeElement.id`)).toBe('small')
    expect(await run(on(`return document.getElementById(field('small').getAttribute('aria-activedescendant')).textContent.includes('getUserByEmail')`))).toBe(true)
  })

  it('Enter takes the selected item in place of what was typed', async () => {
    await key('small', 'Enter')
    await settle()

    expect(await value('small')).toBe('let fresh = [1, 2]\ngetUserByEmail')
    expect((await popup()).shown).toBe(false)
    expect((await popup()).expanded).toBe('false')
  })

  it('Escape closes it and leaves the text alone', async () => {
    await type(' wh')
    await settle()
    expect((await popup()).labels).toEqual(['where'])
    await key('small', 'Escape')
    await settle()

    expect((await popup()).shown).toBe(false)
    expect(await value('small')).toEndWith('getUserByEmail wh')
  })

  it('Ctrl-Space asks for it outright, and a click takes an item', async () => {
    await key('small', ' ', { ctrl: true })
    await settle()
    expect((await popup()).labels).toEqual(['where'])
    await run(on(`
      const option = document.getElementById(field('small').getAttribute('aria-controls')).querySelector('[role=option]')
      option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
      return true
    `))
    await settle()

    expect(await value('small')).toEndWith('getUserByEmail where()')
    expect(await view.evaluate(`document.activeElement.id`)).toBe('small')
  })
})

describe('what hangs off a line', () => {
  it('a diagnostic is underlined exactly under its range, and said after the line', async () => {
    await run(`window.probe.small.set('const total = count + 1\\nreturn total'); return true`)
    await settle()
    await run(`window.probe.marks.set([{ from: { line: 0, column: 14 }, to: { line: 0, column: 19 }, severity: 'error', message: 'Cannot find name count.' }]); return true`)
    await settle()
    const drawn = await json(on(`
      const mark = part('small', 'decorations').firstElementChild, region = part('small', 'region').getBoundingClientRect()
      const m = part('small', 'measure'); m.textContent = 'const total = '; const before = m.getBoundingClientRect().width
      m.textContent = 'count'; const width = m.getBoundingClientRect().width
      const box = mark.getBoundingClientRect(), note = part('small', 'widgets').querySelector('.stx-ce-widget--diagnostic')
      return {
        text: mark.textContent, severity: mark.dataset.severity, left: box.left - region.left - 12 - before, width: box.width - width, top: box.top - region.top,
        note: note.textContent, noteKind: note.dataset.kind, noteTop: note.getBoundingClientRect().top - region.top,
        gutter: part('small', 'gutter-rows').firstElementChild.dataset.severity, line: getComputedStyle(mark).textDecorationLine,
      }
    `))

    expect(drawn.text).toBe('count')
    expect(drawn.severity).toBe('error')
    expect(Math.abs(drawn.left)).toBeLessThan(0.5)
    expect(Math.abs(drawn.width)).toBeLessThan(0.5)
    expect(drawn.top).toBe(8)
    expect(drawn.note).toBe('Cannot find name count.')
    expect(drawn.noteKind).toBe('error')
    expect(drawn.noteTop).toBe(8)
    expect(drawn.gutter).toBe('error')
    expect(drawn.line).toBe('underline')
  })

  it('a diagnostic moves with its text when a line is added above', async () => {
    await caretAt('small', '0')
    await key('small', 'Enter')
    await settle()
    const top = await run<number>(on(`return part('small', 'decorations').firstElementChild.getBoundingClientRect().top - part('small', 'region').getBoundingClientRect().top`))

    expect(top).toBe(8 + 20)
    expect(await run<string>(on(`return part('small', 'decorations').firstElementChild.textContent`))).toBe('count')
  })

  it('the caret reaching a marked line says what is wrong with it', async () => {
    await caretAt('small', '5')
    await settle()

    expect(await run<string>(on(`return part('small', 'status').textContent`))).toBe('Line 2: error: Cannot find name count.')
  })

  it('a widget follows the end of its line', async () => {
    await run(`window.probe.marks.set([]); window.probe.notes.set([{ line: 2, text: '=> 42', kind: 'result' }]); return true`)
    await settle()
    const drawn = await json(on(`
      const w = part('small', 'widgets').querySelector('.stx-ce-widget'), region = part('small', 'region').getBoundingClientRect()
      const m = part('small', 'measure'); m.textContent = 'return total'; const text = m.getBoundingClientRect().width
      const box = w.getBoundingClientRect()
      return { text: w.textContent, kind: w.dataset.kind, top: box.top - region.top, gap: box.left - region.left - 12 - text, squiggles: part('small', 'decorations').childElementCount }
    `))

    expect(drawn.text).toBe('=> 42')
    expect(drawn.kind).toBe('result')
    expect(drawn.top).toBe(8 + 40)
    expect(drawn.gap).toBeGreaterThan(10)
    expect(drawn.squiggles).toBe(0)
  })

  it('ghost text sits at the caret, Tab takes it and it is one undo step', async () => {
    await caretAt('small', `field('small').value.length`)
    await run(`window.probe.hint.set(' + bonus'); return true`)
    await settle()
    expect(await run<string>(on(`return part('small', 'widgets').querySelector('.stx-ce-ghost').textContent`))).toBe(' + bonus')

    await key('small', 'Tab')
    await settle()
    expect(await value('small')).toEndWith('return total + bonus')
    expect(await run(on(`return part('small', 'widgets').querySelector('.stx-ce-ghost') === null`))).toBe(true)
    expect(await json(`return window.probe.events.ghost.at(-1)`)).toEqual({ outcome: 'accept', text: ' + bonus' })

    await key('small', 'z', { mod: true })
    expect(await value('small')).toEndWith('return total')
  })

  it('Escape then Tab leaves the editor instead of indenting', async () => {
    const before = await value('small')
    await key('small', 'Escape')
    const passedThrough = await key('small', 'Tab')

    expect(passedThrough).toBe(true)
    expect(await value('small')).toBe(before)
    expect(await run<string>(on(`return part('small', 'status').textContent`))).toContain('Tab now moves focus')
    // And only the once: the next Tab indents again.
    expect(await key('small', 'Tab')).toBe(false)
    await key('small', 'z', { mod: true })
  })
})

describe('two thousand lines', () => {
  it('scrolling draws the lines that came into view and lets go of the rest', async () => {
    await run(on(`part('big', 'scroller').scrollTop = 20000; return true`))
    await Bun.sleep(120)
    const drawn = await json(on(`
      const rows = part('big', 'rows'), numbers = part('big', 'gutter-rows')
      return { count: rows.childElementCount, first: Number(numbers.firstElementChild.textContent), last: Number(numbers.lastElementChild.textContent), coloured: rows.querySelectorAll('span').length }
    `))

    expect(drawn.first).toBeGreaterThan(950)
    expect(drawn.first).toBeLessThanOrEqual(1000)
    expect(drawn.last).toBeLessThan(1060)
    expect(drawn.count).toBeLessThan(80)
    // Lines far below the first screen were highlighted by the time they are seen.
    expect(drawn.coloured).toBeGreaterThan(40)
  })

  it('a drawn row sits where the field puts that line', async () => {
    const offset = await run<number>(on(`
      const rows = part('big', 'rows'), numbers = part('big', 'gutter-rows'), f = field('big').getBoundingClientRect()
      const line = Number(numbers.firstElementChild.textContent) - 1
      return rows.firstElementChild.getBoundingClientRect().top - f.top - 8 - line * 20
    `))

    expect(offset).toBe(0)
  })

  it('the caret is scrolled into view when it moves off screen', async () => {
    await caretAt('big', `field('big').value.length`)
    await key('big', 'Enter')
    await Bun.sleep(120)
    const seen = await json(on(`
      const s = part('big', 'scroller'), numbers = part('big', 'gutter-rows')
      return { bottom: s.scrollTop + s.clientHeight, height: s.scrollHeight, last: Number(numbers.lastElementChild.textContent) }
    `))

    expect(seen.last).toBe(2001)
    expect(seen.height - seen.bottom).toBeLessThan(40)
    await key('big', 'z', { mod: true })
  })

  it('a keystroke in the middle of the file redraws one row and stays within a frame', async () => {
    const result = await json(on(`
      const f = field('big'), rows = part('big', 'rows'), s = part('big', 'scroller')
      const lines = f.value.split('\\n'); let offset = 0
      for (let i = 0; i < 1000; i++) offset += lines[i].length + 1
      f.focus(); f.setSelectionRange(offset, offset); document.dispatchEvent(new Event('selectionchange'))
      s.scrollTop = 1000 * 20 - 100
      rows.getBoundingClientRect()
      // Let the scroll be drawn first, so what is compared is one screen with itself.
      return new Promise(resolve => setTimeout(() => {
        const before = [...rows.children].map(r => r.innerHTML)
        let replaced = 0
        const observer = new MutationObserver(records => { replaced += records.length })
        observer.observe(rows, { childList: true, subtree: true, characterData: true })
        const times = []
        for (let i = 0; i < 120; i++) {
          const started = performance.now()
          document.execCommand('insertText', false, 'x')
          // Read layout back, so the cost of laying out the change is in the number.
          void s.scrollHeight; rows.getBoundingClientRect()
          times.push(performance.now() - started)
        }
        const changed = [...rows.children].filter((r, i) => r.innerHTML !== before[i]).length
        times.sort((a, b) => a - b)
        setTimeout(() => { observer.disconnect(); resolve({ changed, replaced, median: times[60], p95: times[114], line: f.value.split('\\n')[1000].length - lines[1000].length }) }, 0)
      }, 120))
    `))

    // Printed, because the number is the point: this is what typing costs.
    console.info(`[CodeEditor] keystroke in a 2,000 line file: median ${result.median.toFixed(1)} ms, p95 ${result.p95.toFixed(1)} ms`)
    expect(result.line).toBe(120)
    expect(result.changed).toBe(1)
    // One row rewritten per key, not a screenful. (A rewrite is a few records.)
    expect(result.replaced).toBeLessThan(120 * 12)
    // A frame at 60 a second is 16.7 ms. Loose enough to hold on a loaded
    // machine, tight enough to catch a redraw of the whole file.
    expect(result.median).toBeLessThan(33)
  })

  it('a change that recolours everything below it does not block on the whole file', async () => {
    const result = await json(on(`
      const f = field('big'), rows = part('big', 'rows'), s = part('big', 'scroller')
      s.scrollTop = 0
      f.setSelectionRange(0, 0); document.dispatchEvent(new Event('selectionchange'))
      const started = performance.now()
      document.execCommand('insertText', false, '/*')
      rows.getBoundingClientRect()
      const took = performance.now() - started
      return new Promise(resolve => setTimeout(() => resolve({ took, first: rows.firstElementChild.innerHTML, third: rows.children[2].innerHTML }), 150))
    `))

    expect(result.first).toContain('tok-comment')
    expect(result.first).not.toContain('tok-keyword')
    expect(result.took).toBeLessThan(100)
  })
})
