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

const ROOT = path.resolve(__dirname, '..', 'src')

describe('client signal-setup shims — definePageMeta', () => {
  it('signal-processing.ts merges definePageMeta into the setup destructure', () => {
    const source = readFileSync(path.join(ROOT, 'signal-processing.ts'), 'utf8')
    // The merged setup function literally destructures the symbol list from
    // window.stx. We can't easily run the emitted setup in isolation
    // because it expects a real window.stx in scope; assert the symbol is
    // present in the destructure line directly.
    const destructureMatch = source.match(
      /const\s*\{[\s\S]*?\}\s*=\s*window\.stx;?/,
    )
    expect(destructureMatch).not.toBeNull()
    expect(destructureMatch![0]).toContain('definePageMeta')
  })

  it('includes.ts partial-signal scripts also destructure definePageMeta', () => {
    const source = readFileSync(path.join(ROOT, 'includes.ts'), 'utf8')
    // The partial scope transformer has its own destructure; both paths
    // need the shim so partials and merged setups behave the same.
    const destructureMatch = source.match(
      /var\s*\{[\s\S]*?\}\s*=\s*window\.stx;?/,
    )
    expect(destructureMatch).not.toBeNull()
    expect(destructureMatch![0]).toContain('definePageMeta')
  })

  it('signals.ts window.stx assignment exposes definePageMeta', () => {
    const source = readFileSync(path.join(ROOT, 'signals.ts'), 'utf8')
    // Loose check: somewhere in the window.stx object literal there's a
    // `definePageMeta:` field. The runtime string is enormous so we
    // anchor on the literal property name.
    expect(source).toMatch(/\bdefinePageMeta\s*:\s*function/)
  })
})
