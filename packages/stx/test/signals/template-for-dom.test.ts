import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('template for DOM binding', () => {
  beforeAll(() => {
    installNodeConstants()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('binds structural directives after each template child is inserted', async () => {
    const pages = window.stx.state([1])
    window.__stx_setup_template_for = () => ({
      pages,
    })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_template_for">
        <nav>
          <template :for="page in pages">
            <button :if="page !== 2">{{ page }}</button>
            <span :if="page === 2">{{ page }}</span>
          </template>
        </nav>
      </main>
    `
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    pages.set([1, 2])
    await new Promise(resolve => setTimeout(resolve, 20))

    const nav = document.querySelector('nav')
    const liveElements = Array.from(nav.childNodes).filter((node: any) => node.nodeType === 1)
    const buttons = liveElements.filter((node: any) => node.tagName === 'BUTTON')
    const spans = liveElements.filter((node: any) => node.tagName === 'SPAN')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]?.textContent).toBe('1')
    expect(spans).toHaveLength(1)
    expect(spans[0]?.textContent).toBe('2')
    expect(nav.textContent).not.toContain('{{ page }}')
  })
})
