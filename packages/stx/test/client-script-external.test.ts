import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { injectBrowserCoreAutoImports, processClientScript } from '../src/client-script'
import { hasUserImports } from '../src/client-script-bundler'
import { processDirectives } from '../src/process'
import { injectBrowserRuntime } from '../src/runtime-injection'

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

  it('bundles multiline named imports', () => {
    expect(hasUserImports(`
import {
  fetchNotificationDeliveries,
  retryNotificationDelivery,
} from '../../../../functions/notifications/deliveries'
`)).toBe(true)
  })

  it('ignores multiline type-only imports', () => {
    expect(hasUserImports(`
import type {
  NotificationDelivery,
  NotificationDeliveryStatus,
} from '../../../../functions/notifications/deliveries'
`)).toBe(false)
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

  it('auto-imports browser utilities and Stacks-only composables as bundle inputs', () => {
    const output = injectBrowserCoreAutoImports(`
const load = debounce(() => {}, 250)
const visibility = useDocumentVisibility()
const controls = useIntervalFn(load, 15000)
`)

    expect(output.imports).toEqual(['debounce', 'useDocumentVisibility', 'useIntervalFn'])
    expect(output.code).toContain(`import { debounce, useDocumentVisibility, useIntervalFn } from '@stacksjs/browser'`)
  })

  it('does not shadow locally declared browser helper names', () => {
    const output = injectBrowserCoreAutoImports(`
function debounce(callback) {
  return callback
}
const load = debounce(() => {})
`)

    expect(output.imports).toEqual([])
    expect(output.code).not.toContain(`from '@stacksjs/browser'`)
  })

  it('loads the browser runtime when a browser utility is auto-imported', () => {
    const output = injectBrowserRuntime(`
<html>
  <head></head>
  <body><script client>const load = debounce(() => {}, 250)</script></body>
</html>
`)

    expect(output).toContain(`import '@stacksjs/browser'`)
  })

  it('auto-imports browser utilities in signal page setup wrappers', async () => {
    const output = await processDirectives(
      `<script client>
const ready = state(false)
const load = debounce(() => ready.set(true), 250)
const visibility = useDocumentVisibility()
useIntervalFn(load, 15000)
</script>
<button :if="ready()">Ready</button>`,
      {},
      'browser-auto-import-page.stx',
      { debug: false } as any,
      new Set(),
    )

    expect(output).not.toContain('window.StacksBrowser')
  })

  it('auto-imports browser utilities in scoped signal components', async () => {
    const output = await processDirectives(
      `<div><browser-auto-import /></div>`,
      {},
      'browser-auto-import-host.stx',
      {
        componentsDir: path.join(import.meta.dir, 'fixtures', 'runtime-globals'),
        debug: false,
      } as any,
      new Set(),
    )

    expect(output).not.toContain('window.StacksBrowser')
    expect(output).toContain('__scopeVars')
  })
})
