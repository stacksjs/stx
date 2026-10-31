/**
 * x-model binds any signal-valued expression, a store's property included.
 *
 * `x-model="store.draft"` used to work only for a bare local signal, so every
 * form field needed a local signal plus an effect pushing it into the store.
 */
import { beforeEach, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

beforeEach(() => {
  installNodeConstants()
  globalThis.MutationObserver = window.MutationObserver
  delete window.__stx_host
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

let booted = 0
async function hydrate(markup: string, scope: Record<string, unknown>): Promise<void> {
  window[`__stx_setup_modelstore_${++booted}`] = () => scope
  document.body.innerHTML = `<main data-stx="__stx_setup_modelstore_${booted}">${markup}</main>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await new Promise(resolve => setTimeout(resolve, 30))
}

it('writes a typed value into a defineStore signal, and reads it back into the field', async () => {
  window.stx.defineStore('draftbox', () => ({ draft: window.stx.state('hi'), count: window.stx.state(1) }))
  const store = window.stx.useStore('draftbox')
  await hydrate('<input id="a" x-model="store.draft"><textarea id="b" x-model="store.draft"></textarea><span id="s" :text="store.draft"></span><input id="n" type="number" x-model.number="store.count">', { store })

  expect(document.querySelector('#b').value).toBe('hi')
  const input = document.querySelector('#a')
  input.value = 'typed'
  input.dispatchEvent(new window.Event('input'))
  await new Promise(resolve => setTimeout(resolve, 20))
  expect(store.draft()).toBe('typed')
  expect(document.querySelector('#s').textContent).toBe('typed')
  expect(document.querySelector('#b').value).toBe('typed')

  const number = document.querySelector('#n')
  number.value = '5'
  number.dispatchEvent(new window.Event('input'))
  await new Promise(resolve => setTimeout(resolve, 20))
  expect(store.count()).toBe(5)
})
