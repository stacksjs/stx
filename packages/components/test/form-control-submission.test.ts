/**
 * The form controls are form controls (stacksjs/stx#2043).
 *
 * Eight of the ten emitted their native element with no `name`, and none of
 * the ten accepted `autocomplete`. A control without a name is not a form
 * control in the HTML sense: it is left out of FormData, out of
 * form.elements.namedItem(), and out of an ordinary non-JS POST. So a form
 * built from these components submitted NOTHING for every one of those
 * fields, silently -- and six apps read their forms exactly that way, across
 * 175 input sites.
 *
 * `autocomplete` is a separate loss and just as load-bearing: it is how the
 * browser and a password manager identify a field, so a PasswordInput with no
 * `autocomplete="current-password"` is never offered for autofill and is not
 * recognised as part of a sign-in form at all.
 *
 * Asserted through FormData rather than by matching the markup, because
 * FormData is the thing that was empty.
 */
import { describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { markup, render } from './utils/render-component'

/** Render controls inside a real <form> and hand back that form's FormData. */
async function submit(controls: string): Promise<FormData> {
  const html = markup(await render(`<form id="probe">${controls}</form>`))
  const window = new Window()
  window.document.body.innerHTML = html
  const form = window.document.querySelector('form')
  return new window.FormData(form) as unknown as FormData
}

/** The rendered markup of one control, for attribute-level questions. */
async function one(usage: string): Promise<string> {
  return markup(await render(usage))
}

describe('every control reaches FormData under its name', () => {
  it('carries a text field and its value', async () => {
    const data = await submit('<TextInput label="Email" name="email" value="a@b.c" />')
    expect(data.get('email')).toBe('a@b.c')
  })

  it('carries values from the wrappers too', async () => {
    // EmailInput and SearchInput render a TextInput; a wrapper that does not
    // forward the prop is as unsubmittable as one that never accepted it.
    const data = await submit(`
      <EmailInput label="Email" name="work_email" value="a@b.c" />
      <SearchInput label="Find" name="q" value="widgets" />
    `)
    expect(data.get('work_email')).toBe('a@b.c')
    expect(data.get('q')).toBe('widgets')
  })

  it('carries a password, a number, a textarea and a select', async () => {
    const data = await submit(`
      <PasswordInput label="Password" name="password" value="hunter2" />
      <NumberInput label="Qty" name="qty" value="3" />
      <Textarea label="Bio" name="bio" value="hello" />
      <Select label="Pick" name="pick" />
    `)
    expect(data.get('password')).toBe('hunter2')
    expect(data.get('qty')).toBe('3')
    expect(data.get('bio')).toBe('hello')
    expect([...data.keys()]).toContain('pick')
  })

  it('carries a switch, which is a button and could never be submitted', async () => {
    // The control the user operates is a <button role="switch">, and a button
    // is never submitted by name. A hidden input carries the state instead.
    const on = await submit('<Switch label="Wifi" name="wifi" checked />')
    expect(on.get('wifi')).toBe('true')

    const off = await submit('<Switch label="Wifi" name="wifi" />')
    expect(off.get('wifi')).toBe('false')
  })

  it('reports an off switch as false rather than as a missing field', async () => {
    // Not a checkbox's present-or-absent convention: a reader gets an explicit
    // "false" instead of a missing key, which is the difference between
    // "switched off" and "the field was never in the form".
    const off = await submit('<Switch label="Wifi" name="wifi" />')
    expect([...off.keys()]).toContain('wifi')
  })

  it('still carries the two that already had a name', async () => {
    const data = await submit(`
      <Checkbox label="Agree" name="agree" value="yes" checked />
      <Radio label="One" name="choice" value="1" checked />
    `)
    expect(data.get('agree')).toBe('yes')
    expect(data.get('choice')).toBe('1')
  })

  it('adds nothing to a control given no name', async () => {
    // A control used outside a form must render exactly as it did before.
    const data = await submit('<TextInput label="Email" value="a@b.c" />')
    expect([...data.keys()]).toEqual([])
  })
})

describe('autocomplete reaches the native element', () => {
  it('marks a password field as a sign-in password', async () => {
    const html = await one('<PasswordInput label="Password" name="password" autocomplete="current-password" />')
    expect(html).toContain('autocomplete="current-password"')
  })

  it('marks an email field', async () => {
    const html = await one('<EmailInput label="Email" name="email" autocomplete="email" />')
    expect(html).toContain('autocomplete="email"')
  })

  it('emits none when none was given', async () => {
    // An empty autocomplete is not the same as no autocomplete.
    const html = await one('<TextInput label="Email" name="email" />')
    expect(html).not.toContain('autocomplete=""')
  })
})

describe('the native element is well formed', () => {
  /*
   * The tag used to close as `/ />`. The server-side `:attr` resolver matched
   * a tag with a greedy attribute class that also matches `/`, so the trailing
   * slash was already inside the captured attributes and rebuilding the tag
   * appended a second one. Every control carrying a server-resolved binding --
   * which is all of them, through `:aria-invalid` -- shipped malformed.
   */
  const USAGES = [
    '<TextInput label="Email" name="email" />',
    '<EmailInput label="Email" name="email" />',
    '<PasswordInput label="Password" name="password" />',
    '<NumberInput label="Qty" name="qty" />',
    '<SearchInput label="Find" name="q" />',
    '<Checkbox label="Agree" name="agree" />',
    '<Radio label="One" name="choice" value="1" />',
  ]

  for (const usage of USAGES) {
    const tag = /<(\w+)/.exec(usage)![1]
    it(`${tag} closes its tag once`, async () => {
      expect(await one(usage)).not.toMatch(/\/\s+\/>/)
    })
  }
})

/**
 * A server-rendered value survives a POST with no JavaScript.
 *
 * The controls bound `value` and `checked` only reactively -- `:value`,
 * `:checked` -- with no static attribute. An HTML `value` attribute is the
 * DEFAULT value: it is what the field shows on first paint and what an
 * ordinary form POST submits, while the runtime drives the live property
 * afterwards. The two are different things and do not fight.
 *
 * So the field arrived under its name carrying nothing, which is the same
 * silent shape the missing name had: a form that looks right and submits
 * emptiness. `checked` was worse, because an unchecked box is not submitted at
 * all -- a server-rendered checked control was absent from the POST entirely,
 * not merely empty.
 */
describe('a server-rendered value survives without JavaScript', () => {
  it('posts the value every text-like control was given', async () => {
    const data = await submit(`
      <TextInput label="E" name="text" value="a@b.c" />
      <EmailInput label="E" name="email" value="a@b.c" />
      <PasswordInput label="P" name="password" value="hunter2" />
      <NumberInput label="Q" name="qty" value="3" />
      <SearchInput label="S" name="q" value="widgets" />
      <Textarea label="B" name="bio" value="hello" />
    `)
    expect(data.get('text')).toBe('a@b.c')
    expect(data.get('email')).toBe('a@b.c')
    expect(data.get('password')).toBe('hunter2')
    expect(data.get('qty')).toBe('3')
    expect(data.get('q')).toBe('widgets')
    expect(data.get('bio')).toBe('hello')
  })

  it('posts a checked box and a chosen radio', async () => {
    const data = await submit(`
      <Checkbox label="A" name="agree" value="yes" checked />
      <Radio label="R" name="choice" value="1" checked />
    `)
    expect(data.get('agree')).toBe('yes')
    expect(data.get('choice')).toBe('1')
  })

  it('posts the selected option rather than the first one', async () => {
    // `selected` is defaultSelected: without it a select posts whatever option
    // happens to be first, regardless of what `value` said.
    const data = await submit(
      `<Select label="P" name="pick" :options="[{value:'a',label:'A'},{value:'b',label:'B'}]" value="b" />`,
    )
    expect(data.get('pick')).toBe('b')
  })

  it('invents nothing for an empty or unchecked control', async () => {
    const data = await submit(`
      <TextInput label="E" name="text" />
      <Checkbox label="A" name="agree" value="yes" />
      <Radio label="R" name="choice" value="1" />
    `)
    // Present but empty, which is what an empty text field submits.
    expect(data.get('text')).toBe('')
    // Absent, which is what an unchecked box submits.
    expect(data.get('agree')).toBeNull()
    expect(data.get('choice')).toBeNull()
  })
})
