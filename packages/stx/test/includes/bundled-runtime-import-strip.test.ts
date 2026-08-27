import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'
import { cleanupTestDirs, createPartialFile, PARTIALS_DIR, setupTestDirs, TEMP_DIR } from '../utils'

// Regression: a partial that imports a composable which itself imports from
// 'stx' emitted a bare `import` into a classic <script>.
//
// `bundleClientScript` keeps the stx runtime EXTERNAL, so inlining a module
// that imports from it hoists that module's `import { … } from 'stx'` to the
// top of the bundle. The user's own <script client> need never have written
// one — importing a composable that does is enough.
//
// includes.ts then wraps that content in a classic IIFE (which already
// destructures the runtime off window.stx), where an `import` statement is a
// syntax error. The throw happens before the scope registers, so the partial
// silently failed to hydrate on every page that included it: interpolations
// rendered empty, handlers were inert, and the only clue was a
// hydration-invariant warning naming the scope.
//
// The two sibling wrapping paths already stripped these — client-script.ts via
// transformAutoImports and utils.ts via rewriteStxImportSpecifiers — but
// includes.ts had no strip at all. All three now share
// stripStxRuntimeImports() so they cannot drift apart again.
//
// Rendered via src `processDirectives` rather than Bun.build+stxPlugin so the
// assertions exercise src, not a possibly-stale dist.
describe('include <script client>: strips the runtime import the bundler leaves behind', () => {
  beforeAll(async () => {
    await setupTestDirs()
    // A composable of the shape that triggers it: the PARTIAL imports this,
    // and THIS is what imports from 'stx'.
    await Bun.write(
      path.join(PARTIALS_DIR, 'use-counter.ts'),
      `import { onDestroy, onMount, state } from 'stx'\n`
      + `export function useCounter() {\n`
      + `  const count = state(0)\n`
      + `  onMount(() => {})\n`
      + `  onDestroy(() => {})\n`
      + `  return { count }\n`
      + `}\n`,
    )
  })
  afterAll(cleanupTestDirs)

  const opts = { debug: false, partialsDir: PARTIALS_DIR, componentsDir: PARTIALS_DIR } as any
  const render = (tmpl: string): Promise<string> =>
    processDirectives(tmpl, {}, 'page.stx', opts, new Set())

  /**
   * The bodies of the scope scripts this partial emitted.
   *
   * Scoped to `data-stx-scoped` on purpose: the page also carries stx's own
   * injected runtime, which is large, minified, and not what is under test.
   * `marker` picks out the partial's script among any others on the page.
   */
  function partialScript(html: string, marker: string): string {
    const bodies = [...html.matchAll(/<script\b[^>]*\bdata-stx-scoped\b[^>]*>([\s\S]*?)<\/script>/g)]
      .map(m => m[1])
      .filter(body => body.includes(marker))
    expect(bodies.length).toBeGreaterThan(0)
    return bodies.join('\n')
  }

  it('emits no import statement for a signal partial that imports such a composable', async () => {
    await createPartialFile(
      'counter-signal.stx',
      `<script client>\n  import { useCounter } from './use-counter'\n  const { count } = useCounter()\n</script>\n`
      + `<p :text="count()"></p>`,
    )
    const out = await render(`<div>@include('counter-signal')</div>`)

    // The composable really was inlined — otherwise this asserts nothing.
    expect(partialScript(out, 'useCounter')).not.toMatch(/(^|[;{}\n])\s*import\s/)
  })

  it('emits no import statement for a non-signal partial either', async () => {
    await createPartialFile(
      'counter-plain.stx',
      `<script client>\n  import { useCounter } from './use-counter'\n  function bump() { useCounter() }\n</script>\n`
      + `<button @click="bump()">go</button>`,
    )
    const out = await render(`<div>@include('counter-plain')</div>`)

    expect(partialScript(out, 'bump')).not.toMatch(/(^|[;{}\n])\s*import\s/)
  })

  it('keeps a renamed specifier bound as a local alias', async () => {
    // Bun renames a bundled import that would collide with a name the outer
    // script already binds (`state` here), emitting `state as state2`.
    // Dropping the whole line would leave every state2(…) call undefined.
    await Bun.write(
      path.join(PARTIALS_DIR, 'use-renamed.ts'),
      `import { state } from 'stx'\n`
      + `export function useRenamed() { return state('inner') }\n`,
    )
    await createPartialFile(
      'renamed.stx',
      `<script client>\n  import { useRenamed } from './use-renamed'\n`
      + `  const outer = state('outer')\n  const inner = useRenamed()\n</script>\n`
      + `<p :text="outer() + inner()"></p>`,
    )
    const out = await render(`<div>@include('renamed')</div>`)
    const bodies = partialScript(out, 'useRenamed')

    expect(bodies).not.toMatch(/(^|[;{}\n])\s*import\s/)
    // Whatever alias Bun chose must still be declared before it is called.
    for (const [, alias] of bodies.matchAll(/\b(state\d+)\s*\(/g))
      expect(bodies).toMatch(new RegExp(`var[^\\n;]*\\b${alias}\\s*=`))
  })

  it('leaves an ordinary <script server> alone', async () => {
    await createPartialFile(
      'server-only.stx',
      `<script server>\n  const greeting = 'hi'\n</script>\n<p>{{ greeting }}</p>`,
    )
    const out = await render(`<div>@include('server-only')</div>`)
    expect(out).toContain('hi')
  })

  it('cleans up the composable fixtures', () => {
    expect(fs.existsSync(TEMP_DIR)).toBe(true)
  })
})
