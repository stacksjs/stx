/**
 * The documented ways to set a page title actually set it
 * (stacksjs/stx#1792, items 5 and 6).
 *
 * A user had four plausible ways to title a page and two of them silently did
 * nothing:
 *
 *  - `definePageMeta({ title })` is documented in `head.ts` and forwards
 *    correctly there, but the `<script server>` sandbox shadowed it with a
 *    no-op stub — and a server script is the only place it runs.
 *  - `site.seo.title` was unconditionally discarded by the site-builder's SEO
 *    injector, because its "is this already declared?" test asked only whether
 *    a `<title>` existed. The document shell ALWAYS emits one (default
 *    `stx App`), so the answer was always yes.
 *
 * Neither produced a warning. The page rendered, with the wrong title.
 */
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { injectSeo } from '../../src/site-builder/seo'

const base = {
  ...defaultConfig,
  partialsDir: '/tmp',
  componentsDir: '/tmp',
  autoShell: true,
} as never

async function titleOf(template: string): Promise<string> {
  const out = await processDirectives(template, {}, '/app/page.stx', base, new Set<string>())
  return /<title[^>]*>([\s\S]*?)<\/title>/i.exec(out)?.[1]?.trim() ?? ''
}

describe('definePageMeta in a server script', () => {
  it('sets the title', async () => {
    expect(await titleOf(`<script server>
definePageMeta({ title: 'Dashboard' })
</script>
<main>hi</main>`)).toBe('Dashboard')
  })

  it('sets the description too', async () => {
    const out = await processDirectives(`<script server>
definePageMeta({ title: 'T', description: 'A page about things' })
</script>
<main>hi</main>`, {}, '/app/page.stx', base, new Set<string>())
    expect(out).toContain('A page about things')
  })

  it('leaves the default alone when it sets no title', async () => {
    expect(await titleOf(`<script server>
definePageMeta({ layout: 'admin' })
</script>
<main>hi</main>`)).toBe('stx App')
  })

  it('does not fight useHead', async () => {
    // useHead runs later and should win, since it is the more specific call.
    expect(await titleOf(`<script server>
definePageMeta({ title: 'From definePageMeta' })
useHead({ title: 'From useHead' })
</script>
<main>hi</main>`)).toBe('From useHead')
  })
})

describe('site config title', () => {
  const site = { name: 'Site', url: 'https://example.test', seo: { title: 'From site config' } } as never
  const shell = '<!DOCTYPE html><html><head><title>stx App</title></head><body><main>x</main></body></html>'

  it('replaces the shell placeholder', async () => {
    const out = injectSeo(shell, site, {} as never, '/about')
    expect(out).toContain('<title>From site config</title>')
  })

  it('emits exactly one title', async () => {
    // Appending a second is useless — browsers take the first, which is the
    // placeholder we are trying to displace.
    const out = injectSeo(shell, site, {} as never, '/about')
    expect(out.match(/<title[^>]*>/gi) ?? []).toHaveLength(1)
  })

  it('does not overwrite a real page title', async () => {
    const withTitle = '<!DOCTYPE html><html><head><title>The Real Page</title></head><body></body></html>'
    const out = injectSeo(withTitle, site, {} as never, '/about')
    expect(out).toContain('<title>The Real Page</title>')
    expect(out).not.toContain('From site config</title>')
  })

  it('treats an empty title as a placeholder', async () => {
    const empty = '<!DOCTYPE html><html><head><title></title></head><body></body></html>'
    expect(injectSeo(empty, site, {} as never, '/x')).toContain('<title>From site config</title>')
  })
})
