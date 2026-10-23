import { beforeAll, describe, expect, it, spyOn } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 30))

async function boot(key: string, scope: Record<string, unknown>): Promise<void> {
  window.__stx_setup_helper_keys = () => scope
  document.body.innerHTML = `<main data-stx="__stx_setup_helper_keys"><input :for="row in rows" :key="${key}" :data-row="row.id" :placeholder="row.label" /></main>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()
}

describe('scoped list keys', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('keeps a helper-keyed person attached to its own input after insertion and reorder', async () => {
    const rows = window.stx.state([{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }])
    await boot('profileKey(row)', { rows, profileKey: (row: { id: string }) => `person:${row.id}` })
    const alpha = document.querySelector('[data-row=a]')
    const beta = document.querySelector('[data-row=b]')
    alpha.focus()
    alpha.value = 'Unsent draft'
    rows.set([{ id: 'c', label: 'New' }, { id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }])
    await settle()
    expect(document.querySelector('[data-row=a]')).toBe(alpha)
    expect(document.querySelector('[data-row=b]')).toBe(beta)
    expect(document.activeElement).toBe(alpha)
    expect(alpha.value).toBe('Unsent draft')
    rows.set([{ id: 'b', label: 'Beta' }, { id: 'c', label: 'New' }, { id: 'a', label: 'Alpha' }])
    await settle()
    expect(document.querySelector('[data-row=a]')).toBe(alpha)
    expect(document.querySelector('[data-row=b]')).toBe(beta)
  })

  it.each(['prefix + row.id', 'prefix() + row.id'])('tracks the signal named by %s', async (key) => {
    const rows = window.stx.state([{ id: 'a', label: 'Alpha' }])
    const prefix = window.stx.state('person:')
    await boot(key, { rows, prefix })
    const before = document.querySelector('[data-row=a]')
    prefix.set('coach:')
    await settle()
    expect(document.querySelector('[data-row=a]')).not.toBe(before)
    expect(document.querySelectorAll('[data-row]')).toHaveLength(1)
  })

  it.each(['missingHelper(row)', 'row.missing'])('warns once for an unusable explicit key %s while retaining every row', async (key) => {
    const warn = spyOn(console, 'warn')
    try {
      const rows = window.stx.state([{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }])
      await boot(key, { rows })
      rows.set([{ id: 'b', label: 'Updated' }, { id: 'a', label: 'Last' }])
      await settle()
      expect([...document.querySelectorAll('[data-row]')].map(input => input.placeholder)).toEqual(['Updated', 'Last'])
      const warnings = warn.mock.calls.filter(call => String(call[0]).includes('could not evaluate :key'))
      expect(warnings).toHaveLength(1)
      expect(String(warnings[0]![0])).toContain(key)
      expect(String(warnings[0]![0])).toContain('item positions')
    }
    finally {
      warn.mockRestore()
    }
  })
})
