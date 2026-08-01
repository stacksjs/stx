import { describe, expect, it } from 'bun:test'
import { buildDynamicRouteRegexes } from '../src/serve'

/**
 * The plugin's dev server compiles file routes itself. Catch-alls were turned
 * into `([^/]+)`, which cannot span a separator, so any multi-segment URL was a
 * 404 - and the route looked simply absent rather than misconfigured.
 */
describe('buildDynamicRouteRegexes', () => {
  const base = '[owner]/[repository]/tree/[ref]/[...path]'

  it('lets a catch-all span separators', () => {
    const [regex] = buildDynamicRouteRegexes(base)
    expect('stacks/stacks/tree/main/storage/framework'.match(regex!)).not.toBeNull()
  })

  it('still matches a single segment', () => {
    const [regex] = buildDynamicRouteRegexes(base)
    const m = 'stacks/stacks/tree/main/app'.match(regex!)
    expect(m![4]).toBe('app')
  })

  it('captures the whole remainder in the catch-all group', () => {
    const [regex] = buildDynamicRouteRegexes(base)
    const m = 'stacks/stacks/tree/main/storage/framework'.match(regex!)
    expect(m![4]).toBe('storage/framework')
  })

  it('keeps ordinary params to one segment', () => {
    const [regex] = buildDynamicRouteRegexes('[owner]/[repository]')
    expect('a/b/c'.match(regex!)).toBeNull()
    expect('a/b'.match(regex!)).not.toBeNull()
  })
})
