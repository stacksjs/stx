/**
 * A component with a client script can opt into render caching (stacksjs/stx#1945).
 *
 * `<script server cache>` has always been an author's promise that a fragment
 * is a pure function of its props and slots. The gate that read it also
 * required every script in the file to be a server script, so the components
 * the promise would have been worth most on -- the ones carrying a client
 * island, which is the expensive half of an SSR render -- could not make it at
 * all. #1945 measures a page with one such component at roughly twice the cost
 * of the same page without it.
 *
 * Lifting that restriction is only safe because returning a cached string
 * skips what the render would also have DONE. The load-bearing one is the
 * client-factory registry: `registerComponentClientFactory` counts instances,
 * and `injectComponentClientFactories` inlines a factory's definition over its
 * call when the count is one. A hit that does not register leaves the count at
 * zero, the definition is never inlined, and the page ships a call to a factory
 * nothing defines -- the component silently does not hydrate, and the page
 * stops being byte-identical between renders, which is the property #1945
 * exists to establish. These pin that it is replayed, and so are the scope-id
 * sequence and the expressions a render hands back to its caller.
 */

import { afterEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { renderView } from '../../src/build-views'
import { clearDevCaches } from '../../src/caching'

const made: string[] = []

afterEach(() => {
  clearDevCaches()
  for (const dir of made.splice(0))
    fs.rmSync(dir, { recursive: true, force: true })
})

function app(): { dir: string, componentsDir: string, options: Record<string, unknown> } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-cached-client-'))
  made.push(dir)
  const componentsDir = path.join(dir, 'components')
  fs.mkdirSync(componentsDir, { recursive: true })
  return { dir, componentsDir, options: { componentsDir } }
}

/**
 * A cache opt-in plus a client island, with no per-render state of its own.
 *
 * The identity tests below have to be able to fail for one reason only. A
 * component that counted its own renders would differ between two renders
 * whether or not the cache worked, which would make those tests pass on a
 * build with no cache at all and prove nothing about this one.
 */
function pureWidget(): string {
  return `<script server cache>
const label = $props.label || 'widget'
</script>
<script client>
  const open = state(false)
  function toggle() { open.set(!open()) }
</script>
<div class="widget" @click="toggle()">{{ label }}</div>
`
}

/** The same shape, but counting renders, for the tests that count them. */
function widget(counterName: string): string {
  return `<script server cache>
globalThis.${counterName} = (globalThis.${counterName} || 0) + 1
const renders = globalThis.${counterName}
const label = $props.label || 'widget'
</script>
<script client>
  const open = state(false)
  function toggle() { open.set(!open()) }
</script>
<div class="widget" @click="toggle()">{{ label }}-{{ renders }}</div>
`
}

describe('a component with a client script that opts into caching', () => {
  it('is memoised, which the all-server gate used to prevent', async () => {
    const { dir, componentsDir, options } = app()
    ;(globalThis as any).__cachedClientA = 0
    fs.writeFileSync(path.join(componentsDir, 'Widget.stx'), widget('__cachedClientA'))
    const page = path.join(dir, 'page.stx')
    fs.writeFileSync(page, `<html><body><Widget label="one" /></body></html>`)

    const first = await renderView(page, {}, options as any)
    const second = await renderView(page, {}, options as any)

    // The server script ran once across two renders: the second was served.
    expect((globalThis as any).__cachedClientA).toBe(1)
    expect(first).toContain('one-1')
    expect(second).toContain('one-1')
    delete (globalThis as any).__cachedClientA
  })

  it('serves a page byte-identical to the one it rendered', async () => {
    // The whole point of #1945: a caller cannot tell two renders are the same
    // answer unless they are the same bytes. A hit that skipped the factory
    // registration produced a page 17KB shorter than the render it claimed to
    // repeat, and that is the shape this would regress back into.
    const { dir, componentsDir, options } = app()
    fs.writeFileSync(path.join(componentsDir, 'Widget.stx'), pureWidget())
    const page = path.join(dir, 'page.stx')
    fs.writeFileSync(page, `<html><body><Widget label="two" /></body></html>`)

    const cold = await renderView(page, {}, options as any)
    const warm = await renderView(page, {}, options as any)

    expect(warm).toBe(cold)
  })

  it('registers its factory on a hit, so the definition still reaches the page', async () => {
    const { dir, componentsDir, options } = app()
    fs.writeFileSync(path.join(componentsDir, 'Widget.stx'), pureWidget())
    const page = path.join(dir, 'page.stx')
    fs.writeFileSync(page, `<html><body><Widget label="three" /></body></html>`)

    await renderView(page, {}, options as any)
    const warm = await renderView(page, {}, options as any)

    // At one instance the definition is inlined over the call. If the hit had
    // not registered, the call would survive with nothing defining it.
    expect(warm).not.toMatch(/window\.__stxComponentFactories\[[^\]]+\]\("[^"]+"\);/)
  })

  it('repeats a page whose cached component contains another component', async () => {
    // Nesting and repetition together: the subtree is skipped on a hit, and the
    // second instance must still be numbered as though it had not been. The
    // sequence accounting this leans on is reasoned rather than observed --
    // see `uidsConsumed` in utils.ts -- so this stands as an identity guard
    // over the shape it applies to, not as a proof that the counter moved.
    const { dir, componentsDir, options } = app()
    fs.writeFileSync(
      path.join(componentsDir, 'Widget.stx'),
      `<script server cache>\nconst label = $props.label || 'widget'\n</script>\n<script client>\n  const open = state(false)\n</script>\n<div class="widget"><Inner /></div>\n`,
    )
    fs.writeFileSync(
      path.join(componentsDir, 'Inner.stx'),
      `<script client>\n  const inner = state(0)\n</script>\n<span class="inner">inner</span>\n`,
    )
    const page = path.join(dir, 'page.stx')
    fs.writeFileSync(page, `<html><body><Widget label="one" /><Widget label="two" /></body></html>`)

    const cold = await renderView(page, {}, options as any)
    const warm = await renderView(page, {}, options as any)

    const scopeOf = (html: string) =>
      [...html.matchAll(/data-stx-scope="(stx_[^"]+)"/g)].map(m => m[1])
    expect(scopeOf(warm)).toEqual(scopeOf(cold))
    expect(warm).toBe(cold)
  })

  it('does not hand one instance the scope id of another', async () => {
    // Two instances differ only by scope id, so an entry keyed without it would
    // give the second the first's id and the two would share a scope.
    const { dir, componentsDir, options } = app()
    fs.writeFileSync(path.join(componentsDir, 'Widget.stx'), pureWidget())
    const page = path.join(dir, 'page.stx')
    fs.writeFileSync(page, `<html><body><Widget label="a" /><Widget label="b" /></body></html>`)

    const html = await renderView(page, {}, options as any)
    const scopes = [...html.matchAll(/data-stx-scope="([^"]+)"/g)].map(m => m[1])

    expect(scopes.length).toBeGreaterThanOrEqual(2)
    expect(new Set(scopes).size).toBe(scopes.length)
  })

  it('still re-renders a component that did not opt in', async () => {
    // The opt-in is the whole contract: an ordinary <script server> may read a
    // clock or a request, and must not be answered from a cache.
    const { dir, componentsDir, options } = app()
    ;(globalThis as any).__cachedClientF = 0
    fs.writeFileSync(
      path.join(componentsDir, 'Plain.stx'),
      `<script server>\nglobalThis.__cachedClientF = (globalThis.__cachedClientF || 0) + 1\nconst renders = globalThis.__cachedClientF\n</script>\n<script client>\n  const open = state(false)\n</script>\n<div>{{ renders }}</div>\n`,
    )
    const page = path.join(dir, 'page.stx')
    fs.writeFileSync(page, `<html><body><Plain /></body></html>`)

    await renderView(page, {}, options as any)
    await renderView(page, {}, options as any)

    expect((globalThis as any).__cachedClientF).toBe(2)
    delete (globalThis as any).__cachedClientF
  })
})
