/**
 * Every script that sets up one component instance is marked as such
 * (stacksjs/stx#1958), and nothing else is.
 *
 * Outside the router's container such a script belongs to the layout's chrome,
 * whose instance a same-layout navigation leaves running, so fragments leave
 * it out and the router's full-document path skips it. The mark takes two
 * forms: data-stx-owner names the scope root the script binds (the router
 * checks that root), and data-stx-instance marks a component with no scope
 * root, a component with no signals, whose script only its position can place.
 *
 * A page's own script, the shared factory prelude and the runtime must run for
 * every page, so they are never marked.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { processDirectives } from '../../src/process'

let dir = ''

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-instance-stamp-'))
  const components: Record<string, string> = {
    // No signals, nothing in the template reads it: a plain IIFE.
    'Plain.stx': `<script client>\n  window.__plainRuns = (window.__plainRuns || 0) + 1\n</script>\n<div class="plain">plain</div>\n`,
    // No signals, but the template binds a declaration: wrapped in stx.mount.
    'Mounted.stx': `<script client>\n  function label() { return 'x' }\n</script>\n<div class="mounted" :text="label()"></div>\n`,
    // Signals, deferred until visible: an island.
    'Island.stx': `<script client>\n  const seen = state(false)\n</script>\n<div class="island">{{ seen() }}</div>\n`,
    // Signals, used twice: the calls go through the shared factory prelude.
    'Pair.stx': `<script client>\n  const pairOpen = state(false)\n</script>\n<div class="pair">{{ pairOpen() }}</div>\n`,
  }
  for (const [file, source] of Object.entries(components))
    await Bun.write(path.join(dir, 'components', file), source)
})

afterAll(async () => {
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

async function render(template: string): Promise<string> {
  const file = path.join(dir, 'page.stx')
  return processDirectives(template, { __filename: file }, file, {
    componentsDir: path.join(dir, 'components'),
    root: dir,
    buildMode: 'serve',
  } as any, new Set<string>())
}

/** Every generated script's opening tag, with the runtime left out. */
function openingTags(html: string): string[] {
  return [...html.matchAll(/<script\b[^>]*>/g)].map(m => m[0]).filter(tag => !/\bdata-stx-runtime\b/.test(tag))
}

describe('component instance scripts are marked (#1958)', () => {
  it('a component with no signals is marked data-stx-instance, as a plain script', async () => {
    const html = await render('<Plain />')
    const tag = openingTags(html).find(t => /\bdata-stx-scoped\b/.test(t))!
    expect(tag).toMatch(/^<script data-stx-scoped data-stx-run="always" data-stx-instance="stx_plain_1_[a-z0-9]+">$/)
    expect(html).not.toContain('data-stx-owner')
  })

  it('a component with no signals is marked data-stx-instance, wrapped in stx.mount', async () => {
    const html = await render('<Mounted />')
    expect(html).toMatch(/<script data-stx-scoped data-stx-run="always" data-stx-instance="stx_mounted_1_[a-z0-9]+">\s*window\.stx\.mount\(/)
  })

  it('an island names the root it binds, like the eager form', async () => {
    const html = await render('<Island client="visible" />')
    const root = /<div data-stx-scope="([^"]+)"[^>]*stx-hydrate="visible"/.exec(html)?.[1]
    expect(root).toBeTruthy()
    expect(html).toContain(`<script type="stx/island" data-stx-island="${root}" data-stx-scoped data-stx-owner="${root}"`)
  })

  it('leaves the factory prelude and the page\'s own script unmarked', async () => {
    const html = await render(`<Pair />\n<Pair />\n<script client>\n  window.__pageRuns = (window.__pageRuns || 0) + 1\n</script>\n`)
    const tags = openingTags(html)
    const prelude = tags.filter(t => /\bdata-stx-component-factories\b/.test(t))
    expect(prelude).toHaveLength(1)
    expect(prelude[0]).not.toMatch(/data-stx-(?:owner|instance)=/)
    // Two instances, two owned calls; nothing else is marked.
    expect(tags.filter(t => /data-stx-(?:owner|instance)=/.test(t))).toHaveLength(2)
    expect(html).toContain('window.__pageRuns')
  })
})
