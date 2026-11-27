import { beforeAll, describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

async function render(variable: string): Promise<string> {
  // Keep rendered rows and runtime listeners out of the suite's shared DOM.
  const window = new Window({ url: 'http://localhost/' })
  const { document } = window
  // eslint-disable-next-line no-new-func
  new Function('window', 'document', 'MutationObserver', generateSignalsRuntimeDev())(window, document, window.MutationObserver)
  const id = `__stx_setup_for_${variable}`
  const stx = Reflect.get(window, 'stx')
  Reflect.set(window, id, () => ({ items: stx.state([{ key: 'app', port: 22 }]) }))
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
  beforeAll(installNodeConstants)

  for (const variable of ['entry', 'host', 'name', 'location', 'status', 'top', 'parent', 'length'])
    it(`renders {{ ${variable}.field }}`, async () => {
      expect(await render(variable)).toBe('app:22')
    })
})
