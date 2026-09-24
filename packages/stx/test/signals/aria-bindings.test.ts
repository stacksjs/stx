import { afterEach, beforeAll, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any

beforeAll(() => {
  installNodeConstants()
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

afterEach(() => {
  window.stx._cleanupContainer(document.body)
  document.body.innerHTML = ''
  delete window.__stx_setup_aria
})

it('keeps ARIA tokens and removes only nullish ARIA values', async () => {
  const value = window.stx.state(false)
  window.__stx_setup_aria = () => ({ value })
  document.body.innerHTML = '<main data-stx="__stx_setup_aria"><button :aria-checked="value">State</button></main>'
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await Bun.sleep(20)
  const button = document.querySelector('button')!
  for (const [input, output] of [[false, 'false'], [true, 'true'], ['mixed', 'mixed'], ['false', 'false'], [null, null], [undefined, null], [false, 'false']]) {
    value.set(input)
    await Bun.sleep(0)
    expect(button.getAttribute('aria-checked')).toBe(output)
  }
})
