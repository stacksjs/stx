/**
 * @async components must re-resolve after arriving via SPA navigation (#1829).
 *
 * The router re-runs a swapped fragment's inline <script>s, but dedups them by
 * content hash so layout-level scripts don't redeclare. An @async loader must
 * NOT be deduped across navigations, or the destination page's component would
 * stay stuck in its loading state. That holds because every server render mints
 * a fresh asyncId (`async-<counter>-<ts>`), so the loader body — and therefore
 * its hash — is unique per render and the dedup never skips it.
 *
 * These pin (a) that per-render uniqueness, and (b) that an independently
 * rendered loader resolves on arrival and on a revisit without colliding — which
 * is exactly the SPA path: render on the destination, swap in, run, resolve.
 *
 * (This also corrects the original #1829 diagnosis: the loader is emitted inline
 * per-component, not in the shared signals runtime, so async components already
 * work on both initial load and SPA nav.)
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { processAsyncDirectives } from '../../src/async-components'

const ASYNC = [
  '@async(component: \'Demo\', timeout: 10000, delay: 0, suspensible: false, retries: 0)',
  '  <div class="loading">L</div>',
  '@error',
  '  <div class="error">E</div>',
  '@endasync',
].join('\n')

function extractScript(generated: string): string {
  const m = generated.match(/<script>([\s\S]*?)<\/script>/)
  if (!m)
    throw new Error('no <script> in @async output')
  return m[1]
}

function asyncIdOf(generated: string): string {
  const m = generated.match(/data-async-id="([^"]+)"/)
  if (!m)
    throw new Error('no data-async-id in @async output')
  return m[1]
}

// A minimal controllable fetch — one pending call, resolved on demand.
function createMockFetch(): { fetch: typeof globalThis.fetch, resolve: (body: string) => void, called: () => boolean } {
  let pending: ((r: Response) => void) | null = null
  let called = false
  // eslint-disable-next-line ts/no-explicit-any
  const fetch = ((): Promise<Response> => {
    called = true
    return new Promise<Response>((res) => { pending = res })
    // eslint-disable-next-line ts/no-explicit-any
  }) as any
  return {
    fetch,
    resolve: (body) => {
      if (!pending)
        throw new Error('fetch was never called')
      pending(new Response(body, { status: 200 }))
    },
    called: () => called,
  }
}

// Inject a rendered @async component's placeholder, run its inline loader, and
// resolve the fetch — the destination-page-after-swap sequence.
async function mountAndResolve(generated: string, body: string): Promise<Element> {
  document.body.innerHTML = generated.slice(0, generated.indexOf('<script>'))
  const container = document.querySelector('[data-async-id]') as Element
  if (!container)
    throw new Error('container not found')
  // eslint-disable-next-line no-new-func
  new Function(extractScript(generated))()
  await new Promise(r => setTimeout(r, 0))
  return container
}

describe('async component re-resolves after SPA navigation (#1829)', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
    document.body.innerHTML = ''
  })

  afterEach(() => {
    // eslint-disable-next-line ts/no-explicit-any
    ;(globalThis as any).fetch = originalFetch
    document.body.innerHTML = ''
  })

  it('mints a unique asyncId per render, so the router cannot hash-dedup the loader', () => {
    const a = processAsyncDirectives(ASYNC)
    const b = processAsyncDirectives(ASYNC)
    expect(asyncIdOf(a)).not.toBe(asyncIdOf(b))
    // Different id → different script body → different hash → the router's
    // executedScriptHashes dedup never skips it on the next navigation.
    expect(extractScript(a)).not.toBe(extractScript(b))
  })

  it('a freshly-rendered loader (SPA arrival) fetches and injects the component', async () => {
    const mock = createMockFetch()
    // eslint-disable-next-line ts/no-explicit-any
    ;(globalThis as any).fetch = mock.fetch

    const container = await mountAndResolve(processAsyncDirectives(ASYNC), '')
    expect(mock.called()).toBe(true)

    mock.resolve('<p>arrived</p>')
    await new Promise(r => setTimeout(r, 0))
    await new Promise(r => setTimeout(r, 0))

    expect((container.querySelector('[data-async-content]') as Element).innerHTML).toContain('<p>arrived</p>')
    expect(container.getAttribute('data-status')).toBe('resolved')
  })

  it('resolves independently on a revisit (render → run → resolve, twice, no collision)', async () => {
    for (let visit = 0; visit < 2; visit++) {
      const mock = createMockFetch()
      // eslint-disable-next-line ts/no-explicit-any
      ;(globalThis as any).fetch = mock.fetch

      const container = await mountAndResolve(processAsyncDirectives(ASYNC), '')
      mock.resolve(`<p>visit-${visit}</p>`)
      await new Promise(r => setTimeout(r, 0))
      await new Promise(r => setTimeout(r, 0))

      expect(container.getAttribute('data-status')).toBe('resolved')
      expect((container.querySelector('[data-async-content]') as Element).innerHTML).toContain(`visit-${visit}`)
    }
  })
})
