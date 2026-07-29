import { describe, expect, it } from 'bun:test'
import { processClientScript } from '../src/client-script'
import { hasUserImports } from '../src/client-script-bundler'

/**
 * `@stacksjs/browser` used to be treated as external on the grounds that its
 * symbols are auto-imported off `window.StacksBrowser`. That conflated the
 * auto-import path (no import statement at all) with an explicit import, so an
 * explicit import was dropped and the page called a function nothing defined -
 * silently, and only for bindings the runtime global did not happen to expose.
 */
describe('hasUserImports', () => {
  it('bundles an explicit @stacksjs/browser import', () => {
    expect(hasUserImports(`import { describeThrownError } from '@stacksjs/browser'`)).toBe(true)
  })

  it('leaves the stx runtime external', () => {
    expect(hasUserImports(`import { state } from 'stx'`)).toBe(false)
    expect(hasUserImports(`import { state } from '@stacksjs/stx'`)).toBe(false)
  })

  it('leaves stores and composables to their own transforms', () => {
    expect(hasUserImports(`import { store } from '@stores'`)).toBe(false)
    expect(hasUserImports(`import { thing } from '@composables'`)).toBe(false)
  })

  it('still bundles ordinary relative imports', () => {
    expect(hasUserImports(`import { auth } from '../scripts/auth'`)).toBe(true)
  })

  it('ignores type-only imports, which the transpiler strips', () => {
    expect(hasUserImports(`import type { Foo } from '@stacksjs/browser'`)).toBe(false)
  })

  it('rewrites canonical @stacksjs/stx imports for classic client scripts', async () => {
    const output = await processClientScript(
      `import { onMount, state } from '@stacksjs/stx'\nconst ready = state(false)\nonMount(() => ready.set(true))`,
    )

    expect(output).not.toContain(`from '@stacksjs/stx'`)
    expect(output).not.toContain(`from "@stacksjs/stx"`)
    expect(output).toMatch(/var \{ (?:onMount, state|state, onMount) \} = window\.stx \|\| window/)
  })
})
