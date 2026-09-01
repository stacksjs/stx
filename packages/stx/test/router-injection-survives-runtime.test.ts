import { describe, expect, it } from 'bun:test'
import { hasRouterScript, injectRouterScript } from '../src/runtime-injection'

/**
 * The signals runtime is inlined into every reactive page before the router is
 * injected, and it carries its own container selector — `[data-stx-router-
 * container]`. The guard that skips injection when the router is already there
 * used to test `template.includes('data-stx-router')`, which that selector
 * satisfies as a prefix.
 *
 * So the router was injected into a static page and silently skipped for an
 * interactive one: adding an `x-data` to a working page took its SPA
 * navigation away and put full document loads back, re-rendering the nav and
 * the head on every click.
 */
describe('router injection vs. the inlined signals runtime', () => {
  const RUNTIME_SELECTOR = 'document.querySelector("[data-stx-router-container]")'

  it('does not mistake the runtime\'s container selector for an injected router', () => {
    expect(hasRouterScript(`<script>var c=${RUNTIME_SELECTOR};</script>`)).toBe(false)
  })

  it('still injects into a page that carries the runtime', async () => {
    const page = `<html><body><main data-stx-content>hi</main>`
      + `<script data-stx-runtime>var c=${RUNTIME_SELECTOR};</script></body></html>`

    const out = await injectRouterScript(page)

    expect(out).toMatch(/<script[^>]*\sdata-stx-router[\s=>]/)
  })

  it('recognises a real router tag and injects only once', async () => {
    const page = `<html><body><script data-stx-router src="/_stx/router.js"></script></body></html>`

    expect(hasRouterScript(page)).toBe(true)
    expect(await injectRouterScript(page)).toBe(page)
  })

  it('recognises the inline router form', () => {
    expect(hasRouterScript('<html><body><script data-stx-router>;(function(){})()</script></body></html>')).toBe(true)
  })

  it('keeps recognising the router client by its own guard when the attribute is absent', () => {
    expect(hasRouterScript('<script>if(window.__stxRouter)return;</script>')).toBe(true)
  })
})
