/**
 * The framework's browser-only composables reach the browser
 * (stacksjs/stx#1805).
 *
 * `src/composables/` exports 149 functions and 120 of them had no counterpart
 * in the client runtime. They are exported from the package, they type-check,
 * they autocomplete — and they were unreachable from the only environment where
 * their underlying API exists. `useClipboard`, `useGeolocation`,
 * `useFullscreen`, `useBattery` and the observer family all wrap browser APIs
 * and all threw `ReferenceError` from a `<script client>` block.
 *
 * They are bundled from the real modules rather than hand-ported into the
 * runtime's template literal: 120 duplicated implementations would drift the
 * same way the auto-import list did (#1804).
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { defaultConfig } from '../src/config'
import {
  __setRuntimeOwnedForTest,
  clearFrameworkComposableCache,
  getFrameworkComposableScript,
  referencedFrameworkComposables,
} from '../src/framework-composables'
import { processDirectives } from '../src/process'

afterEach(() => {
  __setRuntimeOwnedForTest([])
  clearFrameworkComposableCache()
})

describe('referencedFrameworkComposables', () => {
  it('finds a composable that is called', () => {
    expect(referencedFrameworkComposables('const c = useClipboard()')).toEqual(['useClipboard'])
  })

  it('ignores a mention that is not a call', () => {
    // A bare word could be a property, a string, or prose.
    expect(referencedFrameworkComposables('// useClipboard is nice\nconst o = { useClipboard: 1 }')).toEqual([])
  })

  it('ignores a method call on an object', () => {
    expect(referencedFrameworkComposables('lib.useClipboard()')).toEqual([])
  })

  it('ignores composables the runtime already provides', () => {
    // Dragging in a module copy of a runtime-provided name would shadow the
    // signal-based version, which is a regression rather than a fix.
    expect(referencedFrameworkComposables('useLocalStorage("k", 1)')).toEqual([])
  })

  it('never offers a name the runtime owns, even if asked', () => {
    __setRuntimeOwnedForTest(['useClipboard'])
    expect(referencedFrameworkComposables('useClipboard()')).toEqual([])
  })

  it('finds several at once, sorted', () => {
    const found = referencedFrameworkComposables('useGeolocation(); useClipboard();')
    expect(found).toEqual(['useClipboard', 'useGeolocation'])
  })
})

describe('getFrameworkComposableScript', () => {
  it('emits nothing when nothing is referenced', async () => {
    expect(await getFrameworkComposableScript('const n = state(0)')).toBeNull()
  })

  it('defines the requested composable', async () => {
    const script = await getFrameworkComposableScript('useClipboard()')
    expect(script).toContain('function useClipboard')
  })

  it('merges onto window.stx rather than replacing it', async () => {
    // Replacing is the bug #1804 was about; this bundle must not reintroduce it.
    const script = await getFrameworkComposableScript('useClipboard()')
    expect(script).toContain('window.stx = window.stx || {}')
  })

  it('skips rather than clobbers a name already present', async () => {
    const script = await getFrameworkComposableScript('useClipboard()')
    expect(script).toContain('in __s')
  })

  it('is demand-driven, not a whole-tree dump', async () => {
    // The point of filtering: a page calling one composable should not carry
    // the other 119.
    const one = await getFrameworkComposableScript('useClipboard()')
    expect(one!.length).toBeLessThan(20000)
    expect(one).not.toContain('function useGeolocation')
  })

  it('grows when more are referenced', async () => {
    const one = await getFrameworkComposableScript('useClipboard()')
    const two = await getFrameworkComposableScript('useClipboard(); useGeolocation();')
    expect(two!.length).toBeGreaterThan(one!.length)
    expect(two).toContain('function useGeolocation')
  })

  it('produces parseable JavaScript', async () => {
    // The bundle is assembled by stripping imports and transpiling, so a
    // malformed result would be a runtime syntax error on a real page.
    const script = await getFrameworkComposableScript('useClipboard(); useGeolocation();')
    const body = script!.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '')
    // eslint-disable-next-line no-new-func
    expect(() => new Function(body)).not.toThrow()
  })
})

describe('through the render pipeline', () => {
  it('ships the composable on a page that calls it', async () => {
    const template = `<script client>
const kind = state('start')
const c = useClipboard()
kind.set('resolved:' + typeof c)
</script>
<main><p>{{ kind() }}</p></main>`

    const out = await processDirectives(template, {}, '/app/copy.stx', {
      ...defaultConfig,
      partialsDir: '/tmp',
      componentsDir: '/tmp',
      autoShell: true,
    } as never, new Set<string>())

    expect(out).toContain('data-stx-framework-composables')
    expect(out).toContain('function useClipboard')
  })

  it('ships nothing extra on a page that calls none', async () => {
    const template = `<script client>
const n = state(0)
</script>
<main><p>{{ n() }}</p></main>`

    const out = await processDirectives(template, {}, '/app/plain.stx', {
      ...defaultConfig,
      partialsDir: '/tmp',
      componentsDir: '/tmp',
      autoShell: true,
    } as never, new Set<string>())

    expect(out).not.toContain('data-stx-framework-composables')
  })
})
