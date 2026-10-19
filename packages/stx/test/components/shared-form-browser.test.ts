import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'

it('submits, validates and resets the actual shared Form and controls in a browser (#2088)', async () => {
  const dir = createTempDir('stx-shared-form-browser-')
  const view = new WebView({ headless: true })
  try {
    for (const [name, source] of Object.entries({ SharedForm: 'form/Form', SharedInput: 'input/TextInput', SharedButton: 'button/Button' })) {
      await Bun.write(join(dir, `${name}.stx`), Bun.file(resolve(import.meta.dir, '../../../components/src/ui', `${source}.stx`)))
    }
    const html = await processDirectives(`<!doctype html><html><head></head><body>
<script client>
window.submissions = []
window.failures = []
window.clientErrors = []
window.addEventListener('error', e => { if (e instanceof ErrorEvent) window.clientErrors.push(e.message) })
console.error = (...args) => window.clientErrors.push(args.map(String).join(' '))
console.warn = (...args) => window.clientErrors.push(args.map(String).join(' '))
const schema = { name: { required: true, validate: value => value === 'blocked' ? 'Reserved name' : null } }
function captureSubmission(values, helpers) { window.submissions.push(values); window.helpers = helpers }
</script>
<SharedForm :initialValues="{ source: 'profile' }" :validationSchema="schema" validateOnChange validateOnBlur @submit="captureSubmission" @error="window.failures.push($event)">
  <SharedInput name="name" value="Ada" showCount maxLength="40" />
  <input type="hidden" name="token" value="saved-token" />
  <SharedButton type="submit">Save</SharedButton>
  <SharedButton type="reset">Reset</SharedButton>
</SharedForm>
</body></html>`, {}, join(dir, 'page.stx'), { componentsDir: dir, cache: false, debug: false }, new Set())
    await Bun.write(join(dir, 'page.html'), html)
    await view.navigate(`file://${join(dir, 'page.html')}`)
    for (let i = 0; i < 100; i++) {
      if (await view.evaluate(`!!window.submissions && !!document.querySelector('form')?.['__stx_evt_input_onFieldInput($event)']`)) break
      await Bun.sleep(20)
    }
    expect(await view.evaluate(`document.querySelector('input[name="name"]').value`)).toBe('Ada')
    await view.evaluate(`window.formApi = document.querySelector('form').closest('[data-stx-scope]').__stx_exposed`)
    expect(await view.evaluate(`typeof window.formApi.validateForm`)).toBe('function')
    const edit = async (value: string) => {
      await view.evaluate(`(() => { const input = document.querySelector('input[name="name"]'); input.value = ${JSON.stringify(value)}; input.dispatchEvent(new Event('input', { bubbles: true })); })()`)
      await Bun.sleep(10)
    }
    await edit('')
    expect(await view.evaluate(`formApi.errors().name`)).toBe('name is required')
    await view.evaluate(`document.querySelector('button[type="submit"]').click()`)
    expect(await view.evaluate(`window.submissions.length`)).toBe(0)
    expect(await view.evaluate(`window.failures[0].name`)).toBe('name is required')
    await edit('blocked')
    expect(await view.evaluate(`formApi.errors().name`)).toBe('Reserved name')
    await view.evaluate(`(() => { formApi.errors.set({}); document.querySelector('input[name="name"]').dispatchEvent(new FocusEvent('focusout', { bubbles: true })); })()`)
    expect(await view.evaluate(`formApi.errors().name`)).toBe('Reserved name')
    await edit('Grace')
    expect(await view.evaluate(`formApi.errors().name || null`)).toBeNull()
    await view.evaluate(`(() => { window.submitting = []; document.querySelector('form').closest('[data-stx-scope]').addEventListener('submit', event => { if (event instanceof CustomEvent) submitting.push(formApi.isSubmitting()) }); document.querySelector('button[type="submit"]').click(); })()`)
    expect(await view.evaluate(`window.submissions`)).toEqual([{ name: 'Grace', token: 'saved-token', source: 'profile' }])
    expect(await view.evaluate(`window.submitting`)).toEqual([true])
    expect(await view.evaluate(`formApi.isSubmitting()`)).toBe(false)
    expect(await view.evaluate(`typeof window.helpers.resetForm`)).toBe('function')
    await view.evaluate(`window.helpers.resetForm()`)
    await Bun.sleep(20)
    expect(await view.evaluate(`document.querySelector('input[name="name"]').value`)).toBe('Ada')
    expect(await view.evaluate(`document.querySelector('input[name="name"]').closest('[data-stx-scope]').__stx_exposed.value()`)).toBe('Ada')
    expect(await view.evaluate(`formApi.values()`)).toEqual({ source: 'profile' })
    expect(await view.evaluate(`window.clientErrors`)).toEqual([])
    expect(await view.evaluate(`formApi.submitCount()`)).toBe(0)
    await edit('another')
    await view.evaluate(`document.querySelector('form').addEventListener('reset', event => event.preventDefault(), { once: true })`)
    await view.evaluate(`document.querySelector('button[type="reset"]').click()`)
    await Bun.sleep(20)
    expect(await view.evaluate(`document.querySelector('input[name="name"]').value`)).toBe('another')
    expect(await view.evaluate(`formApi.values().name`)).toBe('another')
    await view.evaluate(`document.querySelector('button[type="reset"]').click()`)
    await Bun.sleep(20)
    expect(await view.evaluate(`document.querySelector('input[name="name"]').value`)).toBe('Ada')
    expect(await view.evaluate(`formApi.values()`)).toEqual({ source: 'profile' })
  }
  finally {
    view.close()
    rmSync(dir, { recursive: true, force: true })
  }
}, 30_000)
