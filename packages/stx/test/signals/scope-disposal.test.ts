/**
 * Tests for the dynamic-unmount scope-disposal fix (stacksjs/stx#1727).
 *
 * Pre-fix, `cleanupContainer` (SPA-navigation teardown) was the only
 * site that walked the departing subtree to fire `__destroyCallbacks`
 * and delete entries from `window.stx._scopes`. `bindIf` and `bindFor`'s
 * `el.remove()` paths did not — so toggling a component off via
 * `:if="false"` or filtering an item out of a `:for` list leaked the
 * scope indefinitely (along with any user-registered `onDestroy`
 * hooks captured in `__destroyCallbacks`).
 *
 * Fix: factor the walk into a shared `disposeSubtreeScopes(root)`
 * helper called from all three sites. These tests pin the structural
 * shape so a future refactor that drops one of the call sites trips
 * the suite.
 *
 * Behavioral end-to-end testing (mount a real `:if` element, flip the
 * condition, assert `window.stx._scopes` shrinks) requires standing
 * up the full signals runtime + a real component scope, which is
 * brittle and not what we're trying to guard against. The string-
 * match assertions below are intentional regression nets, not
 * behavior contracts.
 */
import { describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('disposeSubtreeScopes (#1727)', () => {
  const runtime = generateSignalsRuntimeDev()

  describe('helper exists with the right shape', () => {
    it('defines disposeSubtreeScopes(root) at runtime scope', () => {
      expect(runtime).toContain('function disposeSubtreeScopes(root)')
    })

    it('walks root + descendants matching [data-stx-scope]', () => {
      // The walk must include the root itself, not just descendants —
      // a :if directly on a data-stx-scope element would otherwise
      // leak the root's own scope.
      expect(runtime).toContain("root.getAttribute('data-stx-scope')")
      expect(runtime).toContain("root.querySelectorAll('[data-stx-scope]')")
    })

    it('fires __destroyCallbacks before deleting the scope entry', () => {
      // The fix preserves the existing cleanupContainer contract: run
      // any user-registered onDestroy hooks first, then drop the
      // registry entry so it can't be re-invoked.
      expect(runtime).toContain('__destroyCallbacks[')
      expect(runtime).toContain('delete window.stx._scopes[scopeId]')
    })

    it('guards against a missing window.stx._scopes registry', () => {
      // Defensive: if the runtime IIFE is partially initialized
      // (early-mount queue draining, etc.) the helper must be safe to
      // call before the registry exists.
      expect(runtime).toContain('if (!root || !window.stx || !window.stx._scopes) return')
    })
  })

  describe('disposeSubtreeScopes is wired into the PERMANENT-removal paths only', () => {
    // #1737 correction: :if / bindIfChain are TOGGLES (the element is re-shown
    // when its condition flips back), not permanent unmounts. Disposing a
    // nested data-stx-scope on every toggle deleted its window.stx._scopes
    // entry, which the setup IIFE can't recreate — breaking re-show. So
    // dispose runs ONLY for genuinely-permanent removals: bindFor item
    // removal and cleanupContainer (SPA nav).

    it('bindFor disposes each removed item (loading/if/empty/key-mismatch)', () => {
      // bindFor's removal sites: `disposeSubtreeScopes(e); e.remove()` for the
      // inline forEach callbacks and `disposeSubtreeScopes(el); el.remove()`
      // for the keyed oldKeyMap path.
      const occurrences = runtime.match(/disposeSubtreeScopes\(\w+\)/g) || []
      // 4 bindFor sites (loading, ifExpr, empty, oldKeyMap) + cleanupContainer.
      expect(occurrences.length).toBeGreaterThanOrEqual(4)
      expect(runtime).toMatch(/disposeSubtreeScopes\(e\);\s*e\.remove\(\);/)
    })

    it('cleanupContainer routes through the helper (SPA-nav teardown)', () => {
      expect(runtime).toContain('disposeSubtreeScopes(container)')
    })

    it('bindIf / bindIfChain do NOT dispose on toggle (#1737)', () => {
      // bindIfChain's branch removal used `disposeSubtreeScopes(prev)` and
      // bindIf's <template> multi-node path used `disposeSubtreeScopes(node)`;
      // both are gone. (We can't assert on `(el)` because bindFor's keyed
      // oldKeyMap removal legitimately names its loop var `el` — that one
      // stays.)
      expect(runtime).not.toContain('disposeSubtreeScopes(prev)')
      expect(runtime).not.toContain('disposeSubtreeScopes(node)')
      // The bindIf single-element removal carries an explicit marker that it
      // intentionally does not dispose (it's a toggle, not a teardown).
      expect(runtime).toContain(':if is a TOGGLE')
    })
  })
})
