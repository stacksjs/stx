import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 30))
let sequence = 0

async function boot(query: unknown): Promise<void> {
  const name = `interpolation_${++sequence}`
  window[`__stx_setup_${name}`] = () => ({ query })
  document.body.innerHTML = `<main data-stx="__stx_setup_${name}">`
    + '<p id="bare">{{ query }}</p>'
    + '<p id="called">{{ query() }}</p>'
    + '<p id="combined">{{ "for " + query() }}</p>'
    + '</main>'
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()
}

describe('signals in text interpolation', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('unwraps bare, called, and concatenated signals', async () => {
    const query = window.stx.state('Ada')
    await boot(query)

    expect(document.querySelector('#bare').textContent).toBe('Ada')
    expect(document.querySelector('#called').textContent).toBe('Ada')
    expect(document.querySelector('#combined').textContent).toBe('for Ada')

    query.set('Grace')
    await settle()
    expect(document.querySelector('#bare').textContent).toBe('Grace')
    expect(document.querySelector('#called').textContent).toBe('Grace')
    expect(document.querySelector('#combined').textContent).toBe('for Grace')
  })
})
