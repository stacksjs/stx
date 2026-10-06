import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

async function render(variable: string): Promise<string> {
  const id = `__stx_setup_for_${variable}`
  window[id] = () => ({ items: window.stx.state([{ key: 'app', port: 22 }]) })
  document.body.innerHTML = `
    <main data-stx="${id}">
      <ul><template :for="${variable} in items()"><li>{{ ${variable}.key }}:{{ ${variable}.port }}</li></template></ul>
    </main>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await new Promise(resolve => setTimeout(resolve, 20))
  return document.querySelector('li')?.textContent ?? ''
}

describe(':for loop variable names', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  for (const variable of ['entry', 'host', 'name', 'location', 'status', 'top', 'parent', 'length'])
    it(`renders {{ ${variable}.field }}`, async () => {
      expect(await render(variable)).toBe('app:22')
    })
})
