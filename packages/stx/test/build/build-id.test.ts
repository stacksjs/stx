/**
 * Build identity stamped on rendered pages (stacksjs/stx#1772).
 *
 * The router uses it to notice that the runtime already loaded in the page came
 * from an older build than the fragment it's being asked to hydrate — the
 * `bun --watch` restart case, where the symptoms (literal `{{ }}`, dead
 * bindings, stale canvas) are sporadic and never reproduce from a clean boot.
 * The router half is covered by `packages/router/test/client-build-skew.test.ts`.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { BUILD_ID_HEADER, BUILD_ID_META, __setBuildIdForTest, getBuildId, injectBuildId } from '../../src/build-id'
import { defaultConfig, processDirectives } from '../../src/index'

afterEach(() => {
  __setBuildIdForTest(null)
})

describe('getBuildId', () => {
  it('is stable within a process', () => {
    expect(getBuildId()).toBe(getBuildId())
  })

  it('is overridable via STX_BUILD_ID', () => {
    // For deployments rendering across several processes, which must agree or
    // every navigation would look like skew.
    __setBuildIdForTest(null)
    const previous = process.env.STX_BUILD_ID
    process.env.STX_BUILD_ID = 'deploy-42'
    try {
      expect(getBuildId()).toBe('deploy-42')
    }
    finally {
      if (previous === undefined)
        delete process.env.STX_BUILD_ID
      else
        process.env.STX_BUILD_ID = previous
    }
  })

  it('produces something URL- and header-safe', () => {
    __setBuildIdForTest(null)
    expect(getBuildId()).toMatch(/^[a-z0-9]+$/)
  })
})

describe('injectBuildId', () => {
  const doc = '<html><head><title>t</title></head><body></body></html>'

  it('adds the meta to <head>', () => {
    expect(injectBuildId(doc, 'abc')).toContain(`<meta name="${BUILD_ID_META}" content="abc">`)
  })

  it('is idempotent', () => {
    const once = injectBuildId(doc, 'abc')
    expect(injectBuildId(once, 'abc')).toBe(once)
    expect(injectBuildId(once, 'different')).toBe(once)
  })

  it('leaves output without a <head> alone', () => {
    // SPA fragments have nowhere to put a meta; they carry the id in a header.
    const fragment = '<section>content</section>'
    expect(injectBuildId(fragment, 'abc')).toBe(fragment)
  })

  it('handles a <head> carrying attributes', () => {
    expect(injectBuildId('<html><head data-x="1"></head></html>', 'abc')).toContain(BUILD_ID_META)
  })
})

describe('through the render pipeline', () => {
  it('stamps a rendered page', async () => {
    __setBuildIdForTest('build-under-test')
    const out = await processDirectives(
      '<h1>Hello</h1>',
      { ...defaultConfig },
      'page.stx',
      { autoShell: true } as any,
      new Set(),
    )
    expect(out).toContain(`<meta name="${BUILD_ID_META}" content="build-under-test">`)
  })

  it('stamps a page that brought its own <head>', async () => {
    __setBuildIdForTest('build-under-test')
    const out = await processDirectives(
      '<!DOCTYPE html><html><head><title>T</title></head><body><h1>Hi</h1></body></html>',
      { ...defaultConfig },
      'page.stx',
      { autoShell: true } as any,
      new Set(),
    )
    expect(out.match(new RegExp(`name="${BUILD_ID_META}"`, 'g'))).toHaveLength(1)
  })
})

describe('header name', () => {
  it('matches what the router reads', () => {
    // The router script hard-codes the string; keep them in step.
    expect(BUILD_ID_HEADER).toBe('X-STX-Build')
    expect(BUILD_ID_META).toBe('stx-build')
  })
})
