import { describe, expect, it } from 'bun:test'
import { extractClassNames, loadCrosswind } from '../../src/dev-server/crosswind'

/**
 * Who extracts the class names.
 *
 * stx carried its own extractor, and it only understood `class=""` plus quoted
 * literals inside `x-class` / `:class`. Every class living in code was
 * invisible to it — a helper returning a class string, an icon keyed by status,
 * anything inside a `<script client>` block that the bundler inlines into the
 * page. Those classes generated no CSS and the element rendered unstyled, with
 * nothing in the build to say so.
 *
 * The fix is to stop keeping a second, weaker copy of Crosswind's rules and
 * defer to Crosswind's own `extractClasses`. The local one stays as a fallback
 * for an installed Crosswind that predates the export.
 */
describe('crosswind class extraction', () => {
  it('forwards crosswind\'s own extractor through the module adapter', async () => {
    const hw = await loadCrosswind()
    // Skipped rather than failed when Crosswind is absent: this package works
    // without it, it just emits no utility CSS.
    if (!hw)
      return

    // The adapter names every export it forwards, so an entry missing there is
    // invisible to callers no matter what the package exports — which is how
    // the improved extractor stayed unreachable for a while after it shipped.
    // What it *finds* is Crosswind's business and is covered by Crosswind's own
    // suite; the contract here is only that it is reachable and usable.
    expect(typeof hw.extractClasses).toBe('function')

    const found = hw.extractClasses!('<div class="flex gap-2"></div>')
    expect(found.has('flex')).toBe(true)
    expect(found.has('gap-2')).toBe(true)
  })

  it('documents what the local fallback cannot see', () => {
    const page = [
      '<div class="flex gap-2"></div>',
      `<script>const cls = 'i-hugeicons-sun-03 bg-blue-500'</script>`,
    ].join('\n')

    const local = extractClassNames(page)

    // Attributes: fine.
    expect(local.has('flex')).toBe(true)
    expect(local.has('gap-2')).toBe(true)
    // Code: not seen. This is the gap that made deferring to Crosswind
    // necessary, and it is asserted so the fallback's limits stay explicit
    // rather than being rediscovered as a styling bug.
    expect(local.has('i-hugeicons-sun-03')).toBe(false)
    expect(local.has('bg-blue-500')).toBe(false)
  })
})
