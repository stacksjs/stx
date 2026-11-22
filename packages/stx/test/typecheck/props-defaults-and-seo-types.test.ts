/**
 * Two declarations that told `stx typecheck` less than the runtime does.
 *
 * - `withDefaults` returned the props unchanged, so a prop given a default was
 *   still "possibly undefined" under strictNullChecks, although the runtime
 *   always fills it (#2208). Vue's makes the defaulted keys required.
 * - `useSeoMeta` was checked against a hand-kept `StxSeoMetaConfig` of 16
 *   fields while the runtime's `SeoMeta` has 35, so `ogSiteName` failed every
 *   marketing page that set it (#2209). The global is now that type itself.
 *
 * Each half also checks a mistake is still caught: a declaration that merely
 * stopped erroring would pass the first tests as `any`.
 */

import { afterAll, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { createTempDir } from '../../src/temp-dir'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()

const dir = createTempDir('stx-defaults-seo-')

afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

async function check(name: string, source: string): Promise<string[]> {
  const file = join(dir, name)
  await Bun.write(file, source)
  const result = await typecheckStxFiles([file], { templates: false })
  return (result.diagnostics ?? []).filter(d => d.category === 'error').map(d => d.message)
}

describe('withDefaults (#2208)', () => {
  it('reads a defaulted prop as defined, imported or global', async () => {
    expect(await check('imported.stx', `<script>
import { defineProps, withDefaults } from 'stx'
interface Props { size?: number }
const { size } = withDefaults(defineProps<Props>(), { size: 220 })
const radius: number = size / 2
</script>
<main>x</main>`)).toEqual([])

    expect(await check('global.stx', `<script client>
interface Props { label?: string, items?: string[] }
const props = withDefaults(defineProps<Props>(), { label: 'Go', items: () => [] })
const upper: string = props.label.toUpperCase()
const count: number = props.items.length
</script>
<main>x</main>`)).toEqual([])
  })

  it('still leaves a prop without a default optional', async () => {
    const errors = await check('undefaulted.stx', `<script client>
interface Props { size?: number, title?: string }
const props = withDefaults(defineProps<Props>(), { size: 1 })
const t: string = props.title
</script>
<main>x</main>`)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('undefined')
  })

  it('rejects a default of the wrong type, or for a prop that does not exist', async () => {
    expect(await check('wrong-type.stx', `<script client>
interface Props { size?: number }
withDefaults(defineProps<Props>(), { size: 'big' })
</script>
<main>x</main>`)).toHaveLength(1)

    expect(await check('unknown-key.stx', `<script client>
interface Props { size?: number }
withDefaults(defineProps<Props>(), { sise: 1 })
</script>
<main>x</main>`)).toHaveLength(1)
  })
})

describe('useSeoMeta (#2209)', () => {
  it('accepts every field the runtime writes a tag for', async () => {
    expect(await check('seo.stx', `<script server>
useSeoMeta({
  title: 'x',
  titleTemplate: '%s | Site',
  ogSiteName: 'ReportsHQ',
  ogLocale: 'en_US',
  ogImageAlt: 'A chart',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageType: 'image/png',
  twitterSite: '@site',
  twitterCreator: '@me',
  twitterImageAlt: 'A chart',
  articleAuthor: 'Me',
  articlePublishedTime: '2026-11-22',
  articleTags: ['a'],
  profileUsername: 'me',
})
</script>
<main>x</main>`)).toEqual([])
  })

  it('is the runtime type, so a typo is still an error', async () => {
    const errors = await check('seo-typo.stx', `<script server>
useSeoMeta({ ogSitename: 'x' })
</script>
<main>x</main>`)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('ogSitename')
  })
})
