import { beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

declare const window: any
declare const document: any

let setupId = 0

beforeEach(() => {
  installNodeConstants()
  delete window.__stx_host
  new Function(generateSignalsRuntimeDev())()
})

async function hydrate(scope: Record<string, unknown>): Promise<string[]> {
  const name = `signal_interpolation_${++setupId}`
  window[`__stx_setup_${name}`] = () => scope
  document.head.innerHTML = '<title id="signal-title">{{ query }}</title>'
    + '<meta id="signal-description" content="for {{ query }}">'
  document.body.innerHTML = `<main data-stx="__stx_setup_${name}">
    <p id="bare">{{ query }}</p>
    <p id="compound">{{ "for " + query }}</p>
    <p id="called-compound">{{ "for " + query() }}</p>
    <p id="called">{{ query() }}</p>
  </main>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await new Promise(resolve => setTimeout(resolve, 30))
  return [
    'bare',
    'compound',
    'called-compound',
    'called',
  ].map(id => document.querySelector(`#${id}`).textContent)
    .concat(document.title, document.querySelector('#signal-description').getAttribute('content'))
}

describe('signal interpolation', () => {
  it('unwraps signals in bare and compound expressions', async () => {
    const query = window.stx.state('Ada')
    expect(await hydrate({ query })).toEqual(['Ada', 'for Ada', 'for Ada', 'Ada', 'Ada', 'for Ada'])
  })

  it('keeps every interpolation reactive after the signal changes', async () => {
    const query = window.stx.state('Ada')
    expect(await hydrate({ query })).toEqual(['Ada', 'for Ada', 'for Ada', 'Ada', 'Ada', 'for Ada'])
    query.set('Grace')
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(['bare', 'compound', 'called-compound', 'called'].map(id => document.querySelector(`#${id}`).textContent)
      .concat(document.title, document.querySelector('#signal-description').getAttribute('content')))
      .toEqual(['Grace', 'for Grace', 'for Grace', 'Grace', 'Grace', 'for Grace'])
  })
})
