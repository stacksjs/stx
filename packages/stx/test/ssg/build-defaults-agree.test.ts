/**
 * The SSG's inline defaults agree with `defaultConfig.build`.
 *
 * Found while fixing an island-size assertion that went red after `b952e80c65`,
 * not from a filed report — there is no issue number to cite.
 *
 * `generateStaticSite` resolves each setting as
 * `options.x ?? buildConfig.x ?? <literal>`. `buildConfig` comes from
 * `loadStxConfig`, which merges `defaultConfig` — so the third operand is
 * unreachable in practice and its literal is a second, silent statement of the
 * same default.
 *
 * That is how `minify` broke. `defaultConfig.build.minify` was `true` and the
 * ssg literal was `NODE_ENV === 'production'`; they disagreed for as long as the
 * ssg literal was the one being read, and the day `buildConfig` was layered in,
 * every build started minifying. No option changed and no test named minify,
 * so what surfaced was an unrelated island-size assertion going red.
 *
 * A dead default nobody can reach is not harmless: it is what the file tells
 * the next reader the default is. This reads the literals out of the source and
 * compares them to the real defaults, so the two cannot drift apart again
 * without saying so.
 *
 * `cacheDir` is deliberately absent — its ssg fallback is a `stateDir(...)`
 * call rather than a literal, and `applyStateDir` rewrites the config's copy at
 * load, so the two are not comparable as written.
 */

import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'

/**
 * Every `options.x ?? buildConfig.x ?? <literal>` fallback in the SSG config
 * block, as `{ key: literalValue }`.
 *
 * Throws when it matches nothing. An extractor that returns an empty map on a
 * miss turns every assertion below into a test that passes against nothing,
 * which is the failure this file exists to catch in the first place.
 */
async function ssgInlineDefaults(): Promise<Map<string, unknown>> {
  const source = await Bun.file(join(import.meta.dir, '..', '..', 'src', 'ssg.ts')).text()

  const re = /(\w+): options\.\w+ (?:\?\?|\|\|) buildConfig\.\w+ (?:\?\?|\|\|) (true|false|'[^']*'|\d+),/g
  const found = new Map<string, unknown>()

  for (const m of source.matchAll(re)) {
    const [, key, raw] = m
    let value: unknown
    if (raw === 'true')
      value = true
    else if (raw === 'false')
      value = false
    else if (raw.startsWith('\''))
      value = raw.slice(1, -1)
    else value = Number(raw)
    found.set(key, value)
  }

  if (found.size === 0)
    throw new Error('found no `options.x ?? buildConfig.x ?? literal` fallbacks in ssg.ts — the config block was restructured and this guard is no longer reading it')

  return found
}

describe('generateStaticSite defaults', () => {
  it('match defaultConfig.build wherever both state one', async () => {
    const inline = await ssgInlineDefaults()
    const build = defaultConfig.build as Record<string, unknown>

    const disagreements: string[] = []
    for (const [key, value] of inline) {
      if (!(key in build))
        continue
      if (build[key] !== value)
        disagreements.push(`${key}: ssg.ts says ${JSON.stringify(value)}, defaultConfig.build says ${JSON.stringify(build[key])}`)
    }

    // Named rather than counted, so a failure says which setting drifted.
    expect(disagreements).toEqual([])
  })

  it('reads enough of the block to be meaningful', async () => {
    const inline = await ssgInlineDefaults()
    const build = defaultConfig.build as Record<string, unknown>
    const overlapping = [...inline.keys()].filter(k => k in build)

    // Ten of the twelve keys in BuildConfig resolve this way. If this drops
    // off, the extractor stopped matching the block rather than the block
    // having genuinely shrunk.
    expect(overlapping.length).toBeGreaterThanOrEqual(8)
    expect(overlapping).toContain('minify')
  })

  it('states minify as true, which is what the config reference documents', async () => {
    const inline = await ssgInlineDefaults()

    expect(inline.get('minify')).toBe(true)
    expect(defaultConfig.build.minify).toBe(true)
  })
})
