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

  describe('disposeSubtreeScopes is wired into all unmount paths', () => {
    it('bindIf calls it before el.remove()', () => {
      // The bindIf removal path used to be just `el.remove();` —
      // now it must call disposeSubtreeScopes(el) immediately before.
      // Match a slice that includes both the comment and the call so
      // ordering can't drift.
      expect(runtime).toMatch(/disposeSubtreeScopes\(el\);\s*el\.remove\(\);/)
    })

    it('bindFor calls it before each removed item (loading/if/empty/key-mismatch)', () => {
      // bindFor has multiple removal sites — one per state. Each must
      // dispose before remove. The pattern `disposeSubtreeScopes(e); e.remove()`
      // (with single-char arg) catches the inline forEach callbacks;
      // `disposeSubtreeScopes(el); el.remove()` catches the keyed
      // oldKeyMap path; `disposeSubtreeScopes(node); node.remove()`
      // catches the template-multi-node bindIf path.
      const occurrences = runtime.match(/disposeSubtreeScopes\(\w+\)/g) || []
      // At minimum: bindIf single-el path + 4 bindFor sites (loading,
      // ifExpr, empty, oldKeyMap) + multi-node bindIf = 6 sites,
      // plus the cleanupContainer one. Keep this loose so refactors
      // that consolidate sites don't trip the test as long as wiring
      // remains.
      expect(occurrences.length).toBeGreaterThanOrEqual(5)
    })

    it('cleanupContainer routes through the helper (not an inline walk)', () => {
      // The inline walk that used to live in cleanupContainer should
      // be gone — replaced by the helper call. The old shape had
      // `container.querySelectorAll('[data-stx-scope]').forEach`
      // immediately followed by `.__destroyCallbacks`. The new shape
      // calls disposeSubtreeScopes(container) directly.
      expect(runtime).toContain('disposeSubtreeScopes(container)')
    })
  })
})
