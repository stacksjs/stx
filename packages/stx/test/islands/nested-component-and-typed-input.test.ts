/**
 * Two things an island must get right when it hydrates after the page was
 * already in use, as it does on a page that loads the runtime lazily.
 *
 * A component nested in the island belongs to it. The page walk used to bind
 * every registered scope it found, the nested one included, before the island
 * had run: the nested component's forwarded props and slotted content were
 * evaluated against a caller that did not exist yet.
 *
 * And a field the visitor typed into before the island woke keeps its text.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { flushEffects, setupStxTestDom, shimAttributes } from '../../src/testing'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('an island that hydrates late', () => {
  beforeAll(() => {
    setupStxTestDom()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('leaves a nested component to the island, then binds and mounts it with the island', async () => {
    let nestedMounted = 0
    // The nested component's own script has run (its scope is registered); the
    // island's has not, as at page load.
    window.stx._scopes = { tip: { hint: window.stx.state('nested'), __mountCallbacks: [() => { nestedMounted++ }] } }
    document.body.innerHTML = '<section data-stx-scope="isle" stx-hydrate="interaction"><b class="label" :text="label"></b><span data-stx-scope="tip"><i class="hint" :text="hint"></i></span></section><script type="stx/island" data-stx-island="isle">window.stx._scopes.isle = window.__lateIsle</script>'
    shimAttributes(document.body)

    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await flushEffects()
    // Nothing inside the island is bound or mounted at page load.
    expect(nestedMounted).toBe(0)
    expect(document.querySelector('.hint').textContent).toBe('')

    // The island's setup registers its scope on the trigger.
    window.__lateIsle = { label: window.stx.state('from the island') }
    document.querySelector('[data-stx-scope="isle"]').dispatchEvent(new window.Event('click'))
    await flushEffects()
    expect(document.querySelector('.label').textContent).toBe('from the island')
    expect(document.querySelector('.hint').textContent).toBe('nested')
    expect(nestedMounted).toBe(1)
  })

  it('presses a control again when its click was what woke the island', async () => {
    let presses = 0
    window.__lateClick = { press: () => { presses++ } }
    window.stx._scopes = {}
    document.body.innerHTML = '<section data-stx-scope="clicky" stx-hydrate="interaction"><button class="go" @click="press()">Go</button></section><script type="stx/island" data-stx-island="clicky">window.stx._scopes.clicky = window.__lateClick</script>'
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await flushEffects()

    // The first thing the island hears is the click itself, on its button.
    const button = document.querySelector('.go')
    const first = new window.Event('click', { bubbles: true, cancelable: true })
    button.dispatchEvent(first)
    await flushEffects()
    expect(first.defaultPrevented).toBe(true)
    // Pressed again on the next task, never inside the click still in flight.
    await new Promise(resolve => setTimeout(resolve, 5))
    await flushEffects()
    expect(presses).toBe(1)

    // Hydrated: later clicks go straight to the handler, once each.
    button.dispatchEvent(new window.Event('click', { bubbles: true, cancelable: true }))
    await flushEffects()
    expect(presses).toBe(2)
  })

  it('still binds a component that is not inside an island at page load', async () => {
    let mounted = 0
    window.stx._scopes = { plain: { hint: window.stx.state('eager'), __mountCallbacks: [() => { mounted++ }] } }
    document.body.innerHTML = '<span data-stx-scope="plain"><i class="hint" :text="hint"></i></span>'
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await flushEffects()
    expect(document.querySelector('.hint').textContent).toBe('eager')
    expect(mounted).toBe(1)
  })

  it('keeps what was typed into a field before its model bound', async () => {
    const email = window.stx.state('')
    window.stx._scopes = {}
    document.body.innerHTML = '<section data-stx-scope="form" stx-hydrate="interaction"><input class="email" type="email" :model="email"></section><script type="stx/island" data-stx-island="form">window.stx._scopes.form = window.__lateForm</script>'
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await flushEffects()

    // The visitor types while the island is still server HTML.
    // (The DOM shim reflects `value` into the attribute; a browser keeps the
    // server's value as defaultValue, so pin it.)
    const input = document.querySelector('.email')
    Object.defineProperty(input, 'defaultValue', { value: '', configurable: true })
    input.value = 'someone@example.com'

    window.__lateForm = { email }
    document.querySelector('[data-stx-scope="form"]').dispatchEvent(new window.Event('click'))
    await flushEffects()
    expect(input.value).toBe('someone@example.com')
    expect(email()).toBe('someone@example.com')
  })

  it('lets a model that was given a value of its own win over the untouched field', async () => {
    const name = window.stx.state('from the model')
    window.stx._scopes = { form2: { name } }
    document.body.innerHTML = '<section data-stx-scope="form2"><input class="name" type="text" :model="name"></section>'
    shimAttributes(document.body)
    const input = document.querySelector('.name')
    Object.defineProperty(input, 'defaultValue', { value: '', configurable: true })
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await flushEffects()
    expect(input.value).toBe('from the model')
    expect(name()).toBe('from the model')
  })
})
