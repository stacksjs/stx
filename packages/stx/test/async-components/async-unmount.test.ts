/**
 * Tests for the @async component unmount race fix (stacksjs/stx#1720).
 *
 * Pre-fix, the generated client script unconditionally wrote
 * `contentEl.innerHTML = html` once the fetch resolved. If the user
 * SPA-navigated away (or `:if` toggled the component off) while the fetch
 * was in flight, the script would still:
 *   - write into a detached container,
 *   - fire `stx:async:loaded` from a node no longer in the document,
 *   - run all loaded scripts in stale-context.
 *
 * Post-fix, three guards apply: AbortController-cancelled fetch on
 * `stx:navigate`, an `isConnected` check before any DOM write, and
 * suppression of AbortError → no spurious retries.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { processAsyncDirectives } from '../../src/async-components'

// Pull the generated script body out of the rendered HTML so we can run
// it inside a controlled closure. The output of processAsyncDirectives is
// the placeholder div + a <script>...</script>. Everything between the
// tags is the IIFE we want to execute.
function extractScript(generated: string): string {
  const m = generated.match(/<script>([\s\S]*?)<\/script>/)
  if (!m) throw new Error('no <script> in @async output')
  return m[1]
}

interface FetchHandle {
  resolve: (body: string, ok?: boolean) => void
  reject: (err: Error) => void
  isAborted: () => boolean
  wasCalled: () => boolean
}

// A controllable fetch: each call records the pending resolvers + abort
// state into the shared `handle`. The handle is read after the test
// dispatches navigation / detach to assert the contract.
function createMockFetch(): { fetch: typeof globalThis.fetch, handle: FetchHandle } {
  let pendingResolve: ((resp: Response) => void) | null = null
  let pendingReject: ((err: Error) => void) | null = null
  let aborted = false
  let called = false

  // eslint-disable-next-line ts/no-explicit-any
  const fetch = ((_url: string, init?: RequestInit): Promise<Response> => {
    called = true
    aborted = false
    return new Promise<Response>((res, rej) => {
      pendingResolve = res
      pendingReject = rej
      if (init?.signal) {
        init.signal.addEventListener('abort', () => {
          aborted = true
          rej(Object.assign(new Error('aborted'), { name: 'AbortError' }))
        })
      }
    })
    // eslint-disable-next-line ts/no-explicit-any
  }) as any

  const handle: FetchHandle = {
    resolve: (body, ok = true) => {
      if (!pendingResolve)
        throw new Error('fetch was never called — nothing to resolve')
      pendingResolve(new Response(body, { status: ok ? 200 : 500 }))
    },
    reject: (err) => {
      if (!pendingReject)
        throw new Error('fetch was never called — nothing to reject')
      pendingReject(err)
    },
    isAborted: () => aborted,
    wasCalled: () => called,
  }

  return { fetch, handle }
}

describe('async component unmount race (#1720)', () => {
  let originalFetch: typeof globalThis.fetch
  let mockFetch: ReturnType<typeof createMockFetch>

  beforeEach(() => {
    originalFetch = globalThis.fetch
    mockFetch = createMockFetch()
    // The script is executed via `new Function(...)()` which evaluates in
    // the global scope, so its bare `fetch` reference resolves to
    // globalThis.fetch (NOT window.fetch). Replace the global hook.
    // eslint-disable-next-line ts/no-explicit-any
    ;(globalThis as any).fetch = mockFetch.fetch
    document.body.innerHTML = ''
  })

  afterEach(() => {
    // eslint-disable-next-line ts/no-explicit-any
    ;(globalThis as any).fetch = originalFetch
    document.body.innerHTML = ''
  })

  function setupComponent(): { script: string, container: Element } {
    const generated = processAsyncDirectives(
      `@async(component: 'Demo', timeout: 10000, delay: 0, suspensible: false, retries: 0)
        <div class="loading">L</div>
      @error
        <div class="error">E</div>
      @endasync`,
    )

    // Split out the html and script so we can inject them in order.
    const scriptStart = generated.indexOf('<script>')
    const html = generated.slice(0, scriptStart)
    const script = extractScript(generated)

    document.body.innerHTML = html
    const container = document.querySelector('[data-async-id]') as Element
    if (!container) throw new Error('container not found after inject')
    return { script, container }
  }

  function runScript(script: string): Promise<void> {
    // Execute the IIFE in a context with window/document/fetch in scope.
    // The script is wrapped in (function() { … })(); so it self-invokes.
    // Returns a microtask so the initial `fetch` call has a chance to run.
    // eslint-disable-next-line no-new-func
    new Function(script)()
    return new Promise(r => setTimeout(r, 0))
  }

  it('writes innerHTML when the load completes while still connected', async () => {
    const { script, container } = setupComponent()
    await runScript(script)

    mockFetch.handle.resolve('<p>loaded</p>')
    // Give the IIFE microtasks a chance to settle.
    await new Promise(r => setTimeout(r, 0))
    await new Promise(r => setTimeout(r, 0))

    const content = container.querySelector('[data-async-content]') as Element
    expect(content.innerHTML).toContain('<p>loaded</p>')
    expect(container.getAttribute('data-status')).toBe('resolved')
  })

  it('aborts the fetch when stx:navigate fires (router-driven unmount)', async () => {
    const { script } = setupComponent()
    await runScript(script)

    // Simulate SPA navigation BEFORE the fetch resolves.
    window.dispatchEvent(new Event('stx:navigate'))
    await new Promise(r => setTimeout(r, 0))

    expect(mockFetch.handle.isAborted()).toBe(true)
  })

  it('does not write innerHTML if the container was detached mid-flight', async () => {
    const { script, container } = setupComponent()
    await runScript(script)

    // Remove the container from the document while fetch is pending.
    container.remove()
    expect(container.isConnected).toBe(false)

    // Now let the fetch resolve. The post-fetch isConnected check must
    // bail before writing.
    mockFetch.handle.resolve('<p>should-not-appear</p>')
    await new Promise(r => setTimeout(r, 0))
    await new Promise(r => setTimeout(r, 0))

    const content = container.querySelector('[data-async-content]') as Element
    // contentEl exists (we have a reference) but its innerHTML must be untouched.
    expect(content.innerHTML).not.toContain('should-not-appear')
    // status should NOT have flipped to 'resolved'.
    expect(container.getAttribute('data-status')).not.toBe('resolved')
  })

  it('does not flip to rejected after a navigate-driven abort (no spurious error state)', async () => {
    const { script, container } = setupComponent()
    await runScript(script)

    window.dispatchEvent(new Event('stx:navigate'))
    await new Promise(r => setTimeout(r, 0))
    await new Promise(r => setTimeout(r, 0))

    // Even though the fetch rejected with AbortError, the catch handler
    // sees `aborted === true` (or error.name === 'AbortError') and bails
    // before setting status to 'rejected' or dispatching stx:async:error.
    expect(container.getAttribute('data-status')).not.toBe('rejected')
  })
})
