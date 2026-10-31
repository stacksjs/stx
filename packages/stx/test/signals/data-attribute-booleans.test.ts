/**
 * `:data-x="true"` rendered `data-x=""`, because a boolean is written as the
 * platform's presence attribute. A selector like `[data-open='true']` never
 * matched, and `false` could not be told from "absent". aria-* already wrote
 * the strings; data-* now does too, as React does. Null and undefined still
 * remove the attribute.
 */
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
  delete window.__stx_setup_databool
})

it('writes the strings "true" and "false" on data-* and removes only nullish values', async () => {
  const open = window.stx.state(true)
  window.__stx_setup_databool = () => ({ open })
  document.body.innerHTML = '<main data-stx="__stx_setup_databool"><div :data-open="open" :data-plain="open" :hidden="open"></div></main>'
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await Bun.sleep(20)
  const el = document.querySelector('div')!
  for (const [input, output] of [[true, 'true'], [false, 'false'], [0, '0'], ['x', 'x'], [null, null], [undefined, null], [true, 'true']] as const) {
    open.set(input)
    await Bun.sleep(0)
    expect(el.getAttribute('data-open')).toBe(output)
    expect(el.getAttribute('data-plain')).toBe(output)
  }
})

it('leaves other boolean attributes as presence', async () => {
  const on = window.stx.state(true)
  window.__stx_setup_databool = () => ({ on })
  document.body.innerHTML = '<main data-stx="__stx_setup_databool"><button :disabled="on">x</button></main>'
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await Bun.sleep(20)
  const button = document.querySelector('button')!
  expect(button.hasAttribute('disabled')).toBe(true)
  on.set(false)
  await Bun.sleep(0)
  expect(button.hasAttribute('disabled')).toBe(false)
})
