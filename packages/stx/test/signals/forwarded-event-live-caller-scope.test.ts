/**
 * A component's forwarded event runs in its caller's scope as it is when the
 * event fires, not as it was when the listener was bound.
 *
 * The listener for `@pick="pickFromBank"` on a component root copied the
 * caller scope once, at binding time. A component inside another component's
 * `:if`, inside a dialog, was bound while its caller was still resolving to
 * the page's scope; it was handed its real caller afterwards, but the listener
 * kept the old copy, so the handler was undefined and a pick did nothing.
 * Found as hq.training's exercise bank in the plan editor's session dialog.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('forwarded component events', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('call the handler of the caller scope the root has when the event fires', async () => {
    const bankOpen = window.stx.state(false)
    window.__stx_setup_live_caller = () => ({ bankOpen })
    document.body.innerHTML = `
      <main data-stx="__stx_setup_live_caller">
        <template :if="bankOpen()">
          <div data-stx-scope="live_caller_bank" data-stx-parent-events="pick" @pick="pickFromBank"><button>Add</button></div>
          <script data-stx-scoped>
            window.stx._scopes.live_caller_bank = { __mountCallbacks: [], __destroyCallbacks: [] };
          </script>
        </template>
      </main>
    `
    document.querySelector('template').content.querySelector('[data-stx-parent-events]')?.setAttribute('@pick', 'pickFromBank')
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))
    bankOpen.set(true)
    await new Promise(resolve => setTimeout(resolve, 30))

    const bank = document.querySelector('[data-stx-scope="live_caller_bank"]')
    expect(bank.__stx_parent_scope).toBeTruthy()
    expect(bank.__stx_parent_scope.pickFromBank).toBeUndefined()

    // The caller the root is handed once its own component resolves.
    const picked: unknown[] = []
    bank.__stx_parent_scope = { ...bank.__stx_parent_scope, pickFromBank: (exercise: unknown) => picked.push(exercise) }
    bank.dispatchEvent(new window.CustomEvent('pick', { detail: { name: 'Back Squat' } }))
    expect(picked).toEqual([{ name: 'Back Squat' }])
  })
})
