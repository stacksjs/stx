/**
 * A `derived()` in an event handler reads as its value, as a `state()` does.
 *
 * Bindings unwrap both (createAutoUnwrapProxy checks `_isDerived`), but inline
 * handlers only unwrapped `_isSignal`, so `@change="pick(selectedPackage)"`
 * handed `pick` the derived's getter: `selectedPackage.trainer_id` was
 * undefined and the handler quietly did the wrong thing. A handler that calls
 * the derived, `pick(selectedPackage())`, still gets the function to call.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 30))

let booted = 0
async function boot(markup: string, scope: Record<string, unknown>): Promise<void> {
  const name = `derived_handler_${++booted}`
  window[`__stx_setup_${name}`] = () => scope
  document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${markup}</main>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()
}

describe('a derived value in an event handler', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('passes the derived value, with a state signal in scope', async () => {
    const packageId = window.stx.state(2)
    const packages = [{ id: 1, trainer_id: 7 }, { id: 2, trainer_id: 9 }]
    const selectedPackage = window.stx.derived(() => packages.find(item => item.id === packageId()))
    const picked: unknown[] = []
    const pick = (value: unknown) => picked.push(value)
    await boot('<button data-pick @click="pick(selectedPackage && selectedPackage.trainer_id)">pick</button>', { packageId, selectedPackage, pick })
    document.querySelector('[data-pick]').click()
    expect(picked).toEqual([9])
  })

  it('passes the derived value when no state signal is in scope', async () => {
    const base = window.stx.state(3)
    const doubled = window.stx.derived(() => base() * 2)
    const picked: unknown[] = []
    await boot('<button data-pick @click="pick(doubled)">pick</button>', { doubled, pick: (value: unknown) => picked.push(value) })
    document.querySelector('[data-pick]').click()
    expect(picked).toEqual([6])
  })

  it('keeps the function for a handler that calls it', async () => {
    const base = window.stx.state(4)
    const doubled = window.stx.derived(() => base() * 2)
    const picked: unknown[] = []
    await boot('<button data-pick @click="pick(doubled())">pick</button>', { base, doubled, pick: (value: unknown) => picked.push(value) })
    document.querySelector('[data-pick]').click()
    expect(picked).toEqual([8])
  })
})
