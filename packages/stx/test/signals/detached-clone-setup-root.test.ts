/**
 * A cloned component's setup finds its root even before the root is in the
 * document.
 *
 * A component's compiled setup looked its root up with
 * `document.querySelector('[data-stx-scope="…"]')`. Rows that a `:for` builds
 * inside a component's closed `:if` are set up while still detached, so the
 * lookup found nothing: the row ran with no root and read none of its props,
 * bound or static. hq.training's exercise bank (behind `:if="bankOpen"` in a
 * StrengthEditor) drew every picture blank. The runtime now hands the root
 * over in `__STX_SETUP_ROOT__`, and the setup prefers it.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { processDirectives } from '../../src/process'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('cloned component setup root', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('hands each loop row its own root while its setup runs', async () => {
    const rows = window.stx.state(['a', 'b'])
    window.__stx_setup_setup_root = () => ({ rows })
    window.__setupRoots = []
    document.body.innerHTML = `
      <main data-stx="__stx_setup_setup_root">
        <section>
          <template :for="row in rows()">
            <div data-stx-scope="setup_root_leaf"><span>leaf</span></div>
            <script data-stx-scoped>
              window.__setupRoots.push(window.__STX_SETUP_ROOT__);
              window.stx._scopes.setup_root_leaf = { __mountCallbacks: [], __destroyCallbacks: [] };
            </script>
          </template>
        </section>
      </main>
    `
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    const roots = Array.from(document.querySelectorAll('section > [data-stx-scope]'))
    expect(roots).toHaveLength(2)
    expect(window.__setupRoots).toEqual(roots)
    // Handed over only while a setup runs.
    expect(window.__STX_SETUP_ROOT__).toBeUndefined()
  })

  it('reads the props of a handed-over root that is not in the document', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'stx-setup-root-'))
    writeFileSync(path.join(dir, 'SizedLeaf.stx'), `<script client>
const sizedLeafSize = useReactiveProp('size', 'md')
</script>
<span>{{ sizedLeafSize() }}</span>
`)
    const html = await processDirectives('<SizedLeaf size="lg" />', {}, path.join(dir, 'page.stx'), { componentsDir: dir, root: dir, buildMode: 'serve' }, new Set<string>())
    const scopeId = /data-stx-scope="([^"]+)"/.exec(html)![1]!
    const setup = /<script\b[^>]*data-stx-owner="[^"]+"[^>]*>([\s\S]*?)<\/script>/.exec(html)![1]!

    const root = document.createElement('span')
    root.setAttribute('data-stx-scope', scopeId)
    root.setAttribute('data-stx-props', JSON.stringify({ size: 'lg' }))
    expect(root.isConnected).toBe(false)

    window.__STX_SETUP_ROOT__ = root
    try {
      // eslint-disable-next-line no-new-func
      new Function(setup)()
    }
    finally {
      delete window.__STX_SETUP_ROOT__
    }
    expect(window.stx._scopes[scopeId].sizedLeafSize()).toBe('lg')
  })
})
