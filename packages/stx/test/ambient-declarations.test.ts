/**
 * `stx.d.ts` and the client runtime must agree (stacksjs/stx#1804, #1808).
 *
 * `packages/stx/stx.d.ts` is hand-written and copied verbatim into `dist/`. For
 * an auto-imported name it is the ONLY contract an author ever sees — they
 * write no import, so the declaration is the whole API surface. Nothing checked
 * it against the runtime, and it drifted in both directions:
 *
 *  - 11 names were declared and auto-imported with no client implementation at
 *    all (`h`, `Fragment`, `createStore`, `useMeta`, `getCurrentInstance`, …).
 *    Because the generated prologue DESTRUCTURES off `window.stx`, each bound
 *    `undefined` silently and failed later as "undefined is not a function".
 *  - 5 names were auto-imported and present on `window.stx` with no declaration
 *    at all, so correct code failed to type-check — `useCookie` was #1808.
 *
 * These tests are the check that was missing. They are deliberately structural
 * (parsing the .d.ts text) rather than type-level, because the defect is that
 * the file says things the runtime does not do — a type-level test would be
 * written against the same wrong declarations.
 */
import { describe, expect, it } from 'bun:test'
import { STX_AUTO_IMPORTS } from '../src/client-script'
import { generateSignalsRuntimeDev } from '../src/signals'
import { runtimeWindowStxSurface } from '../test-utils/runtime-surface'

const declarations = await Bun.file(new URL('../stx.d.ts', import.meta.url)).text()

/** Ambient global names the .d.ts declares (functions, consts and vars). */
function declaredGlobals(): Set<string> {
  const names = new Set<string>()
  for (const m of declarations.matchAll(/^declare (?:function|const|var|let)\s+([A-Za-z_$][\w$]*)/gm))
    names.add(m[1])
  return names
}

describe('ambient declarations vs the client runtime', () => {
  it('declares every auto-imported name', () => {
    // A missing declaration means correct code fails to type-check, and the
    // workaround — a hand-written local ambient declaration — MERGES with the
    // real one when it lands rather than colliding, so a stale local copy
    // silently widens the true shape with no diagnostic. That is #1808.
    const declared = declaredGlobals()
    expect(STX_AUTO_IMPORTS.filter(name => !declared.has(name))).toEqual([])
  })

  it('declares no ambient global the runtime does not provide', () => {
    // The other direction, and the worse one: the compiler actively endorsing
    // a call that binds undefined in the browser.
    //
    // Scoped to names that are auto-imported OR look like a runtime API. The
    // .d.ts also declares genuine compile-time-only helpers ($computed, $watch,
    // defineProps-style macros), which are resolved by the transform and are
    // not expected on window.stx.
    const surface = runtimeWindowStxSurface(generateSignalsRuntimeDev())
    const retired = [
      'h',
      'Fragment',
      'useMeta',
      'getCurrentInstance',
      'useAttrs',
      'onErrorCaptured',
      'onBeforeUpdate',
      'onUpdated',
      'createStore',
      'createSelector',
      'action',
    ]
    const declared = declaredGlobals()
    const resurrected = retired.filter(name => declared.has(name) && !surface.has(name))
    expect(resurrected).toEqual([])
  })

  it('declares useCookie, which was auto-imported with no declaration at all', () => {
    // #1808 specifically: it works at runtime, so the failure landed entirely
    // on correct code.
    expect(declaredGlobals().has('useCookie')).toBe(true)
    expect(declarations).toContain('interface StxCookieOptions')
    // Returns a signal, not the module's CookieRef — the two were aligned in
    // #1710 and the declaration has to reflect the runtime, not the module.
    expect(declarations).toMatch(/declare function useCookie\([^)]*\): StxSignal<string>/)
  })

  it('declares the other four names that were auto-imported without one', () => {
    const declared = declaredGlobals()
    for (const name of ['useId', 'useReactiveProp', 'definePageMeta', 'registerStoresClient'])
      expect(declared.has(name)).toBe(true)
  })

  it('backs every newly declared name with a real runtime implementation', () => {
    const surface = runtimeWindowStxSurface(generateSignalsRuntimeDev())
    for (const name of ['useCookie', 'useId', 'useReactiveProp', 'definePageMeta', 'registerStoresClient'])
      expect(surface.has(name)).toBe(true)
  })
})
