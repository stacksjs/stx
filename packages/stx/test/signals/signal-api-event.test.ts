import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('signal API event handlers', () => {
  beforeAll(() => {
    installNodeConstants()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('keeps a signal raw when an inline handler calls update', async () => {
    const open = window.stx.state(false)
    window.__stx_setup_signal_update = () => ({ open })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_signal_update">
        <button type="button">Toggle</button>
      </main>
    `
    document.querySelector('button').setAttribute('@click', 'open.update(value => !value)')
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    document.querySelector('button').dispatchEvent(new window.Event('click', { bubbles: true }))
    expect(open()).toBe(true)
  })

  it('keeps a signal raw when an inline handler assigns its value property', async () => {
    const active = window.stx.state(false)
    window.__stx_setup_signal_value = () => ({ active })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_signal_value">
        <button type="button">Activate</button>
      </main>
    `
    document.querySelector('button').setAttribute('@click', 'active.value = true')
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    document.querySelector('button').dispatchEvent(new window.Event('click', { bubbles: true }))
    expect(active()).toBe(true)
  })
})
