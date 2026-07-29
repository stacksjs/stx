import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('local helper precedence', () => {
  beforeAll(() => {
    installNodeConstants()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('lets a component helper override a same-named global helper', async () => {
    window.__stx_setup_helper_collision = () => ({
      formatDate() {
        return 'local date and time'
      },
    })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_helper_collision">
        <span>{{ formatDate('2026-07-29T10:18:29.255Z') }}</span>
      </main>
    `
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(document.querySelector('span').textContent).toBe('local date and time')
  })
})
