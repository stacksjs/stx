/**
 * Select, Textarea and NumberInput bind both ways, and Select takes its
 * options from the client (stacksjs/stx#2059).
 *
 * TextInput and Switch had `useModel` (#1965); these three took `value` one
 * way and emitted `change`/`input`, so every call site paired `:value` with a
 * handler that wrote it back -- a few hundred chances, across an app's forms,
 * to bind one way and not the other. And Select read `options` in its server
 * script, so a list that arrives with the page's data -- most of them -- was
 * not there to read, and the select rendered its placeholder alone.
 *
 * Driven through the real runtime: the page is rendered by processDirectives,
 * loaded into a DOM with the signals runtime, and operated the way a person
 * operates it, by setting the control's value and firing its event.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'
import { markup, parse, render } from './utils/render-component'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')

function component(rel: string): string {
  return readFileSync(path.join(UI, rel), 'utf-8')
}

const COMPONENTS = {
  'components/Select.stx': component('select/Select.stx'),
  'components/Textarea.stx': component('textarea/Textarea.stx'),
  'components/NumberInput.stx': component('input/NumberInput.stx'),
}

afterEach(() => {
  closeBrowser()
})

/** Boot one page whose body is `body`, with the three controls installed. */
async function open(body: string) {
  const app = await renderApp({
    ...COMPONENTS,
    'layouts/app.stx': layout(''),
    'pages/index.stx': page('app', body),
  }, { '/': 'pages/index.stx' })
  // The runtime reports a binding it cannot evaluate through console.error and
  // carries on, so a broken attribute is otherwise silent here.
  const logged: string[] = []
  const original = console.error
  console.error = (...args: unknown[]) => { logged.push(args.map(String).join(' ')) }
  try {
    const browser = await boot(app, '/')
    await settle()
    expect(browser.errors).toEqual([])
    expect(logged.filter(line => line.includes('[STX]'))).toEqual([])
    return browser
  }
  finally {
    console.error = original
  }
}

/** What a person does: put a value in the control, then the event it fires. */
async function operate(browser: any, selector: string, value: string, event: 'input' | 'change'): Promise<void> {
  const control = browser.document.querySelector(selector)
  control.value = value
  control.dispatchEvent(new browser.window.Event(event, { bubbles: true }))
  await settle()
}

async function click(browser: any, selector: string): Promise<void> {
  browser.document.querySelector(selector).dispatchEvent(new browser.window.Event('click', { bubbles: true }))
  await settle()
}

function optionValues(browser: any, selector = 'select'): string[] {
  return Array.from(browser.document.querySelector(selector).querySelectorAll('option') as ArrayLike<any>)
    .map(option => option.getAttribute('value') ?? option.value)
}

describe('Select', () => {
  it('renders options bound from client data, and reflects the chosen one', async () => {
    const browser = await open(`<script client>
  const labOptions = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]
  const lab = state('b')
  window.probe = { lab }
</script>
<Select :options="labOptions" v-model:value="lab" />`)

    // Not the placeholder alone, which is what #2059 measured.
    expect(optionValues(browser)).toEqual(['', 'a', 'b'])
    expect(browser.document.querySelector('select').value).toBe('b')
    const labels = Array.from(browser.document.querySelectorAll('option') as ArrayLike<any>).map(o => o.textContent.trim())
    expect(labels).toEqual(['Select an option', 'Alpha', 'Beta'])
  })

  it('writes a choice back to the page through v-model, and follows the page', async () => {
    const browser = await open(`<script client>
  const lab = state('a')
  const changes = []
  window.probe = { lab, changes }
  function changed(value) { changes.push(value) }
</script>
<Select :options="[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]" v-model:value="lab" @change="changed($event)" />`)

    await operate(browser, 'select', 'b', 'change')
    expect(browser.window.probe.lab()).toBe('b')
    // `change` is still emitted, for the callers that listen for it.
    expect(browser.window.probe.changes).toEqual(['b'])

    browser.window.probe.lab.set('a')
    await settle()
    expect(browser.document.querySelector('select').value).toBe('a')
  })

  it('draws a list that arrives after render, and selects the bound value once it does', async () => {
    const browser = await open(`<script client>
  const rooms = state([])
  const room = state('r2')
  window.probe = { rooms, room }
</script>
<Select :options="rooms()" v-model:value="room" />`)

    expect(optionValues(browser)).toEqual([''])

    browser.window.probe.rooms.set([{ value: 'r1', label: 'Studio' }, { value: 'r2', label: 'Hall' }, 'Pool'])
    await settle()

    expect(optionValues(browser)).toEqual(['', 'r1', 'r2', 'Pool'])
    // The value was set before its option existed; it has to land when it does.
    expect(browser.document.querySelector('select').value).toBe('r2')
  })

  it('does not duplicate server-rendered options when the live list takes over', async () => {
    const browser = await open(`<Select :options="['S', 'M', 'L']" value="M" />`)

    expect(optionValues(browser)).toEqual(['', 'S', 'M', 'L'])
    expect(browser.document.querySelector('select').value).toBe('M')
    // And the ones left are the LIVE list's, not the served copies: those
    // carry the cloak opt-out, and nothing about them would follow the prop.
    const served = Array.from(browser.document.querySelectorAll('option') as ArrayLike<any>)
      .filter(option => option.hasAttribute('x-no-cloak') || option.hasAttribute('no-cloak'))
    expect(served).toEqual([])
  })

  it('takes <option> children, including a client :for, with v-model', async () => {
    const browser = await open(`<script client>
  const list = [{ id: 7, name: 'Ada' }, { id: 9, name: 'Grace' }]
  const athlete = state('9')
  window.probe = { athlete }
</script>
<Select v-model:value="athlete" placeholder="">
  <option :for="o in list" :value="o.id">{{ o.name }}</option>
</Select>`)

    expect(optionValues(browser)).toEqual(['7', '9'])
    expect(browser.document.querySelector('select').value).toBe('9')

    await operate(browser, 'select', '7', 'change')
    expect(browser.window.probe.athlete()).toBe('7')
  })
})

describe('Textarea', () => {
  it('binds both ways through v-model, and still emits input', async () => {
    const browser = await open(`<script client>
  const bio = state('hello')
  const inputs = []
  window.probe = { bio, inputs }
  function typed(value) { inputs.push(value) }
</script>
<Textarea v-model:value="bio" @input="typed($event)" />`)

    const textarea = browser.document.querySelector('textarea')
    expect(textarea.value).toBe('hello')

    await operate(browser, 'textarea', 'hello there', 'input')
    expect(browser.window.probe.bio()).toBe('hello there')
    expect(browser.window.probe.inputs).toEqual(['hello there'])

    // The direction that had no binding at all: the element had no :value.
    browser.window.probe.bio.set('rewritten')
    await settle()
    expect(textarea.value).toBe('rewritten')
  })

  it('honours .lazy, committing on change rather than on every keystroke', async () => {
    const browser = await open(`<script client>
  const bio = state('')
  window.probe = { bio }
</script>
<Textarea v-model:value.lazy="bio" />`)

    await operate(browser, 'textarea', 'draft', 'input')
    expect(browser.window.probe.bio()).toBe('')
    await operate(browser, 'textarea', 'draft', 'change')
    expect(browser.window.probe.bio()).toBe('draft')
  })
})

describe('NumberInput', () => {
  it('binds both ways through v-model, steppers included', async () => {
    const browser = await open(`<script client>
  const qty = state('3')
  window.probe = { qty }
</script>
<NumberInput v-model:value="qty" step="2" />`)

    const input = browser.document.querySelector('input')
    expect(input.value).toBe('3')

    await operate(browser, 'input', '10', 'input')
    expect(browser.window.probe.qty()).toBe('10')

    await click(browser, 'button[aria-label="Increment"]')
    expect(browser.window.probe.qty()).toBe('12')

    browser.window.probe.qty.set('1')
    await settle()
    expect(input.value).toBe('1')
  })

  it('applies .number, so the page holds a number', async () => {
    const browser = await open(`<script client>
  const qty = state(0)
  window.probe = { qty }
</script>
<NumberInput v-model:value.number="qty" />`)

    await operate(browser, 'input', '42', 'input')
    expect(browser.window.probe.qty()).toBe(42)
  })
})

describe('the served markup', () => {
  it('serves a select\'s static options for first paint, with the choice selected', async () => {
    const html = markup(await render(`<Select name="size" :options="['S', { value: 0, label: 'Zero' }]" :value="0" />`))
    const select = parse(html).querySelector('select')!

    // The live list's <template> is inert until the runtime expands it.
    const served = Array.from(select.querySelectorAll('option'))
      .filter(o => o.parentNode === select)
      .map(o => [o.getAttribute('value'), o.hasAttribute('selected')])
    // 0 is a value, not "nothing": `||` used to serve it as unselected.
    expect(served).toEqual([['', false], ['S', false], ['0', true]])
  })

  it('carries no empty aria-describedby when there is no helper text', async () => {
    const html = markup(await render('<Select label="P" />'))
    expect(html).not.toContain('aria-describedby=""')
  })
})

/**
 * TextInput is no longer always `type="text"` (stacksjs/stx#2059), so a form
 * with a date, a time or a phone number in it stays inside the library.
 */
describe('TextInput type and constraints', () => {
  async function input(usage: string): Promise<Element> {
    const element = parse(markup(await render(usage))).querySelector('input')
    expect(element, usage).not.toBeNull()
    return element!
  }

  for (const type of ['date', 'time', 'datetime-local', 'month', 'week', 'url', 'tel', 'color', 'search', 'email', 'number', 'password']) {
    it(`renders type="${type}"`, async () => {
      expect((await input(`<TextInput type="${type}" />`)).getAttribute('type')).toBe(type)
    })
  }

  it('stays text by default, and for a type that is not a text field', async () => {
    expect((await input('<TextInput />')).getAttribute('type')).toBe('text')
    expect((await input('<TextInput type="checkbox" />')).getAttribute('type')).toBe('text')
  })

  it('passes min, max and step to the types they bound', async () => {
    const date = await input('<TextInput type="date" min="2026-01-01" max="2026-12-31" step="7" />')

    expect(date.getAttribute('min')).toBe('2026-01-01')
    expect(date.getAttribute('max')).toBe('2026-12-31')
    expect(date.getAttribute('step')).toBe('7')
  })

  it('passes pattern, minlength, maxlength and size to the free-text types', async () => {
    const tel = await input('<TextInput type="tel" pattern="[0-9 ]+" minlength="6" maxlength="15" htmlSize="20" />')

    expect(tel.getAttribute('pattern')).toBe('[0-9 ]+')
    expect(tel.getAttribute('minlength')).toBe('6')
    expect(tel.getAttribute('maxlength')).toBe('15')
    expect(tel.getAttribute('size')).toBe('20')
    // The camelCase spellings reach the same attributes.
    const camel = await input('<TextInput minLength="2" maxLength="9" />')
    expect(camel.getAttribute('minlength')).toBe('2')
    expect(camel.getAttribute('maxlength')).toBe('9')
  })

  it('passes list and autofocus, and readonly as before', async () => {
    const field = await input('<TextInput type="url" list="sites" autofocus readonly />')

    expect(field.getAttribute('list')).toBe('sites')
    expect(field.hasAttribute('autofocus')).toBe(true)
    expect(field.hasAttribute('readonly')).toBe(true)
  })

  /*
   * Emitted only when given, and only where HTML applies them, so a control
   * that passes none renders exactly the markup it did before and a stray
   * constraint cannot land on a type that would ignore or misread it.
   */
  it('emits none of them unless given, and none where they do not apply', async () => {
    const plain = await input('<TextInput />')
    for (const name of ['min', 'max', 'step', 'pattern', 'minlength', 'maxlength', 'size', 'list', 'autofocus'])
      expect(plain.hasAttribute(name), name).toBe(false)

    const text = await input('<TextInput min="1" max="9" step="2" />')
    for (const name of ['min', 'max', 'step'])
      expect(text.hasAttribute(name), `${name} on text`).toBe(false)

    const date = await input('<TextInput type="date" pattern="x" maxlength="4" htmlSize="3" />')
    for (const name of ['pattern', 'maxlength', 'size'])
      expect(date.hasAttribute(name), `${name} on date`).toBe(false)

    expect((await input('<TextInput type="password" list="x" />')).hasAttribute('list')).toBe(false)
  })

  it('serves EmailInput as an email field', async () => {
    expect((await input('<EmailInput name="email" />')).getAttribute('type')).toBe('email')
  })

  it('keeps v-model on a date field', async () => {
    const app = await renderApp({
      'components/TextInput.stx': component('input/TextInput.stx'),
      'layouts/app.stx': layout(''),
      'pages/index.stx': page('app', `<script client>
  const day = state('2026-10-11')
  window.probe = { day }
</script>
<TextInput type="date" v-model:value="day" />`),
    }, { '/': 'pages/index.stx' })
    const browser = await boot(app, '/')
    await settle()

    const field = browser.document.querySelector('input')
    expect(field.getAttribute('type')).toBe('date')
    expect(field.value).toBe('2026-10-11')
    await operate(browser, 'input', '2026-12-25', 'input')
    expect(browser.window.probe.day()).toBe('2026-12-25')
  })
})
