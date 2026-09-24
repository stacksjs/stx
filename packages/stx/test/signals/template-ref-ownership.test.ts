import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { markProjectedRefs } from '../../src/misc-directives'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { setupStxTestDom } from '../../src/testing'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any

function bootRuntime(): void {
  setupStxTestDom()
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
}

describe('template ref ownership', () => {
  beforeEach(() => {
    bootRuntime()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    window.__STX_CURRENT_ELEMENT__ = null
    window.stx._cleanupContainer(document.body)
    document.body.innerHTML = ''
    delete window.__stx_setup_projected_ref
  })

  it('marks projected refs without claiming existing component or opaque content', () => {
    const template = `<section>
<input ref="page" title="a > b">
<div data-stx-scope="child"><div><input ref="child"></div></div>
<button x-ref='footer'></button>
<!-- <input ref="comment"> -->
<script>const html = '<input ref="script">'</script>
<input ref="forwarded" data-stx-ref-caller="original">
</section>`
    expect(markProjectedRefs(template, 'shell')).toBe(`<section>
<input ref="page" title="a > b" data-stx-ref-caller="shell">
<div data-stx-scope="child"><div><input ref="child"></div></div>
<button x-ref='footer' data-stx-ref-caller="shell"></button>
<!-- <input ref="comment"> -->
<script>const html = '<input ref="script">'</script>
<input ref="forwarded" data-stx-ref-caller="original">
</section>`)
  })

  it('binds a page accessor to its captured map after a shell replaces the compatibility scope', () => {
    document.body.innerHTML = '<main data-stx="__stx_setup_projected_ref"><section data-stx-scope="shell"><button data-stx-ref="control" data-stx-ref-caller="shell">Page</button></section></main>'
    window.__STX_CURRENT_ELEMENT__ = null
    let pageRef: { current: HTMLElement | null } | undefined
    window.__stx_setup_projected_ref = () => {
      pageRef = window.stx.useRef('control')
      return { pageRef }
    }
    window.stx._scopes.shell = { $refs: {} }

    window.__stxDomReadyHandler()

    expect(pageRef?.current).toBe(document.querySelector('button'))
  })

  it('keeps each useRef bound to the component scope that created it', () => {
    const firstRoot = document.createElement('div')
    const secondRoot = document.createElement('div')
    firstRoot.setAttribute('data-stx-scope', 'first')
    secondRoot.setAttribute('data-stx-scope', 'second')
    document.body.append(firstRoot, secondRoot)

    const firstElement = document.createElement('button')
    const secondElement = document.createElement('input')
    const firstScope = { $refs: {} as Record<string, HTMLElement> }
    const secondScope = { $refs: {} as Record<string, HTMLElement> }
    window.stx._scopes = { first: firstScope, second: secondScope }

    window.__STX_CURRENT_ELEMENT__ = firstRoot
    const firstRef = window.stx.useRef('control')
    window.__STX_CURRENT_ELEMENT__ = secondRoot
    const secondRef = window.stx.useRef('control')

    firstScope.$refs.control = firstElement
    secondScope.$refs.control = secondElement

    expect(firstRef.current).toBe(firstElement)
    expect(firstRef.value).toBe(firstElement)
    expect(secondRef.current).toBe(secondElement)
    expect(secondRef.value).toBe(secondElement)
  })

  it('resolves a ref revealed by :if before nextTick completes', async () => {
    const root = document.createElement('section')
    root.setAttribute('data-stx-scope', 'conditional')
    root.innerHTML = '<div :if="show()"><button data-stx-ref="control">Ready</button></div>'
    document.body.append(root)

    const show = window.stx.state(false)
    const scope = { $refs: {} as Record<string, HTMLElement>, show }
    window.stx._scopes = { conditional: scope }
    window.__STX_CURRENT_ELEMENT__ = root
    const control = window.stx.useRef('control')

    window.__stxDomReadyHandler()
    expect(control.current).toBeNull()

    show.set(true)
    await window.stx.nextTick()

    expect(control.current).toBe(root.querySelector('button'))
    expect(control.current?.textContent).toBe('Ready')
  })
})
