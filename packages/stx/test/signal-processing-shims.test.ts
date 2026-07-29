/**
 * Tests that the client-side signal-setup function exposes shims for
 * server-only APIs that users can reasonably call from shared (server-
 * or client-side) code paths.
 *
 * Specifically: `definePageMeta(...)` is a SSR/SSG-only marker that
 * registers route middleware / validation. If a page puts it inside a
 * bare `<script>` or `<script client>` block (intentionally or via
 * shared composables), the client-side setup function would otherwise
 * hit ReferenceError on hydration:
 *
 *   Uncaught ReferenceError: definePageMeta is not defined
 *     at __stx_setup_<ts>_<idx>
 *
 * Reported in the field, see commit context for trace. Fix: include
 * a no-op `definePageMeta` in the window.stx destructure list so the
 * client setup function resolves it safely.
 */
import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { STX_RUNTIME_GLOBALS, buildRuntimeGlobalsDestructure } from '../src/runtime-globals'

const ROOT = path.resolve(__dirname, '..', 'src')

describe('client signal-setup shims — definePageMeta', () => {
  it('the setup destructure includes definePageMeta', () => {
    // Was: scrape signal-processing.ts for a literal `const { … } = window.stx`.
    // Since #1785 all three call sites generate that line from one shared list,
    // so assert the list itself — the scrape had nothing left to match, and this
    // covers every site at once rather than one file's copy.
    expect(STX_RUNTIME_GLOBALS).toContain('definePageMeta')
    expect(buildRuntimeGlobalsDestructure('const')).toContain('definePageMeta')
  })

  it('partial-signal scripts get the same shim', () => {
    // Partials use the `var` form (the wrapper reassigns onDestroy), but the
    // name set is identical, so partials and merged setups behave the same.
    expect(buildRuntimeGlobalsDestructure('var')).toContain('definePageMeta')
  })

  it('signals.ts window.stx assignment exposes definePageMeta', () => {
    const source = readFileSync(path.join(ROOT, 'signals.ts'), 'utf8')
    // Loose check: somewhere in the window.stx object literal there's a
    // `definePageMeta:` field. The runtime string is enormous so we
    // anchor on the literal property name.
    expect(source).toMatch(/\bdefinePageMeta\s*:\s*function/)
  })
})
