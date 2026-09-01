import { describe, expect, it, beforeEach } from 'bun:test'

/**
 * mount() must not adopt an x-data root the reactive runtime has not claimed.
 *
 * After an SPA navigation a layout component's script re-executes inside the
 * content container, right next to the incoming page. `previousElementSibling`
 * then resolves to the *page's* x-data root, and mount() adopted it: it ran
 * processElement over that whole subtree carrying the layout's scope. Every
 * :for template inside was consumed against a scope holding none of the page's
 * data, and bindFor swaps each template for its stx-for anchor on that single
 * pass — so the markup a retry would need was gone, and the effect had read no
 * signal to re-run on. Lists rendered empty for the life of the page while
 * their state sat fully populated beside them.
 *
 * The distinguishing fact is registration, not the attribute: an id in
 * `stx._scopes` means initScope has already run and the element is initialised.
 * Unregistered means it is still waiting, and its subtree is not ours to bind.
 */
function loadRuntime(): void {
  const { generateSignalsRuntimeDev } = require('../../src/signals')
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
}

/** mount() reads `document.currentScript`, which only a real parse sets. */
function withCurrentScript(script: Element | null, run: () => void): void {
  const descriptor = Object.getOwnPropertyDescriptor(document, 'currentScript')
  Object.defineProperty(document, 'currentScript', { value: script, configurable: true })
  try {
    run()
  }
  finally {
    if (descriptor)
      Object.defineProperty(document, 'currentScript', descriptor)
    else
      delete (document as any).currentScript
  }
}

describe('mount() and unclaimed x-data roots', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    ;(window as any).stx = undefined
    if (!window.addEventListener)
      (window as any).addEventListener = function () {}
    if (!document.addEventListener)
      (document as any).addEventListener = function () {}
  })

  it('does not adopt the page root when a layout script sits beside it', () => {
    document.body.innerHTML = `
      <main data-stx-content>
        <div id="page" data-stx-scope="page-scope" data-stx-xdata="{ rows: [1, 2, 3] }">
          <template :for="r in rows"><span></span></template>
        </div>
        <script id="layout-script"></script>
      </main>
    `
    loadRuntime()

    const page = document.getElementById('page')!
    const script = document.getElementById('layout-script')!

    withCurrentScript(script, () => {
      ;(window as any).stx.mount(() => ({ sidebarOnly: true }))
    })

    // The page root is the reactive runtime's; the layout's setup must not land
    // on it, and its loop template must survive for initScope to bind properly.
    expect((page as any).__stx_scope).toBeUndefined()
    expect(page.querySelector('template')).not.toBeNull()
  })

  it('does not adopt it through the container fallback either', () => {
    document.body.innerHTML = `
      <main data-stx-content>
        <aside id="mounted"></aside>
        <div id="page" data-stx-scope="page-scope" data-stx-xdata="{ rows: [1] }">
          <template :for="r in rows"><span></span></template>
        </div>
      </main>
    `
    loadRuntime()

    // A already-mounted sibling is what sends the fallback looking for the
    // "first unmounted child" — which is the page root.
    ;(document.getElementById('mounted') as any).__stx_scope = { mounted: true }
    const page = document.getElementById('page')!

    withCurrentScript(null, () => {
      ;(window as any).stx.mount(() => ({ sidebarOnly: true }))
    })

    expect((page as any).__stx_scope).toBeUndefined()
    expect(page.querySelector('template')).not.toBeNull()
  })

  it('still adopts an x-data root the reactive runtime has already claimed', () => {
    document.body.innerHTML = `
      <main data-stx-content>
        <div id="page" data-stx-scope="page-scope" data-stx-xdata="{ rows: [] }"></div>
        <script id="page-script"></script>
      </main>
    `
    loadRuntime()

    // Registered: initScope has run, so the element is initialised and mount
    // behaves as it always did. Guarding on the attribute alone would have
    // changed this case too.
    ;(window as any).stx._scopes = { 'page-scope': { rows: [] } }

    const page = document.getElementById('page')!
    const script = document.getElementById('page-script')!

    withCurrentScript(script, () => {
      ;(window as any).stx.mount(() => ({ ownScope: true }))
    })

    expect((page as any).__stx_scope).toBeDefined()
  })
})
