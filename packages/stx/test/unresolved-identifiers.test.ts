/**
 * Naming a composable that cannot reach the browser (stacksjs/stx#1805).
 *
 * `composables/` exports 149 functions; 120 of them have no counterpart on
 * `window.stx`. They type-check, they autocomplete, and calling one from a
 * `<script client>` block throws `ReferenceError`.
 *
 * The throw is now contained so it costs one root rather than the document, but
 * the author still has to work out why a documented, exported, type-checking
 * composable is undefined. This turns that into a compile-time message naming
 * the identifier, the file, and the fix.
 *
 * A warning, not a build failure, on purpose: #1810 reports the dev server
 * aborting on one bad view with no filename. Adding a second way to abort the
 * build would answer one complaint by creating another.
 */
import { describe, expect, it } from 'bun:test'
import { STX_RUNTIME_GLOBALS } from '../src/runtime-globals'
import { generateSignalsRuntimeDev } from '../src/signals'
import {
  SERVER_ONLY_COMPOSABLES,
  findUnresolvedIdentifiers,
  reportUnresolvedIdentifiers,
} from '../src/unresolved-identifiers'
import { runtimeWindowStxSurface } from '../test-utils/runtime-surface'

describe('findUnresolvedIdentifiers', () => {
  it('names a server-only composable that is called', () => {
    // The reported case, exactly.
    const found = findUnresolvedIdentifiers('const c = useClipboard()', STX_RUNTIME_GLOBALS)
    expect(found).toHaveLength(1)
    expect(found[0].name).toBe('useClipboard')
  })

  it('explains why it fails and how to fix it', () => {
    // "not defined" is what the browser already says. The value here is the
    // cause and the remedy.
    const [found] = findUnresolvedIdentifiers('useGeolocation()', STX_RUNTIME_GLOBALS)
    expect(found.message).toContain('not available in the browser')
    expect(found.message).toContain('server-only')
    expect(found.message).toContain('@stacksjs/stx/composables')
  })

  it('stays silent for a composable the runtime does provide', () => {
    expect(findUnresolvedIdentifiers('const s = useLocalStorage("k", 1)', STX_RUNTIME_GLOBALS)).toEqual([])
  })

  it('stays silent for names it cannot explain', () => {
    // Restricted to names with a known cause. A broader "looks like a hook and
    // is not in scope" rule would fire on app composables and local helpers,
    // and a warning people learn to ignore is worse than none.
    expect(findUnresolvedIdentifiers('useMyAppThing()', STX_RUNTIME_GLOBALS)).toEqual([])
  })

  it('does not warn when the name is imported explicitly', () => {
    // That IS the documented fix, so warning about it would be wrong.
    const source = `import { useClipboard } from '@stacksjs/stx/composables'\nconst c = useClipboard()`
    expect(findUnresolvedIdentifiers(source, STX_RUNTIME_GLOBALS)).toEqual([])
  })

  it('does not warn when the name is declared locally', () => {
    const source = 'function useClipboard() { return null }\nconst c = useClipboard()'
    expect(findUnresolvedIdentifiers(source, STX_RUNTIME_GLOBALS)).toEqual([])
  })

  it('does not warn for a mention that is not a call', () => {
    // A property, a string or a comment throws nothing.
    const source = 'const map = { useClipboard: 1 }\nconst s = "useClipboard"\n// useClipboard'
    expect(findUnresolvedIdentifiers(source, STX_RUNTIME_GLOBALS)).toEqual([])
  })

  it('reports each name once however often it is called', () => {
    const source = 'useClipboard()\nuseClipboard()\nuseGeolocation()'
    expect(findUnresolvedIdentifiers(source, STX_RUNTIME_GLOBALS).map(f => f.name))
      .toEqual(['useClipboard', 'useGeolocation'])
  })

  it('respects names supplied as in-scope by the caller', () => {
    expect(findUnresolvedIdentifiers('useClipboard()', [...STX_RUNTIME_GLOBALS, 'useClipboard'])).toEqual([])
  })
})

describe('reportUnresolvedIdentifiers', () => {
  it('names the file in the warning', () => {
    // The missing half of #1810's complaint: a diagnostic that points nowhere
    // is barely better than none.
    const warnings: string[] = []
    const real = console.warn
    console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
    try {
      reportUnresolvedIdentifiers('useClipboard()', STX_RUNTIME_GLOBALS, '/app/pages/copy.stx')
    }
    finally {
      console.warn = real
    }
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('/app/pages/copy.stx')
    expect(warnings[0]).toContain('useClipboard')
  })
})

describe('SERVER_ONLY_COMPOSABLES is current', () => {
  it('lists exactly the composable exports the runtime does not provide', async () => {
    // Generated, so it must be regenerated rather than hand-edited. This is the
    // check that stops it rotting the way the auto-import list did (#1804).
    const mod: Record<string, unknown> = await import('../src/composables/index')
    const surface = runtimeWindowStxSurface(generateSignalsRuntimeDev())
    const expected = Object.keys(mod)
      .filter(name => typeof mod[name] === 'function')
      .filter(name => !surface.has(name))
      .sort()

    expect([...SERVER_ONLY_COMPOSABLES].sort()).toEqual(expected)
  })

  it('never lists a name the runtime does provide', () => {
    // Belt and braces: a false entry here warns about working code.
    const surface = runtimeWindowStxSurface(generateSignalsRuntimeDev())
    expect(SERVER_ONLY_COMPOSABLES.filter(name => surface.has(name))).toEqual([])
  })

  it('includes the names the issue reported', () => {
    for (const name of ['useClipboard', 'useGeolocation', 'useBattery', 'useFullscreen', 'useWakeLock'])
      expect(SERVER_ONLY_COMPOSABLES).toContain(name)
  })
})
