/**
 * An @include's script names the root it binds (stacksjs/stx#1958).
 *
 * The router skips a script stamped data-stx-owner whose root stayed on the
 * page, which is how a component the layout renders avoids being set up again
 * on every navigation. Component tags carried the stamp; a partial's script
 * did not, so a partial the layout @includes was still re-run, and a re-run
 * whose hooks landed on the global queues left the component frozen.
 *
 * Exactly one script may carry it: the one whose id the root carries. A
 * partial with two client scripts gets two ids and one root, and the script
 * whose id is on no element must keep running as it always has.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { processDirectives } from '../../src/process'

let dir = ''

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-include-owner-'))
  const partials: Record<string, string> = {
    'signal.stx': `<script client>\n  const open = state(false)\n</script>\n<div class="signal">{{ open() }}</div>\n`,
    'plain.stx': `<script client>\n  function ping() { return 'pong' }\n</script>\n<div class="plain" :text="ping()"></div>\n`,
    'merged.stx': `<script client>\n  const hits = state(0)\n</script>\n<div data-stx-scope="shared_root">{{ hits() }}</div>\n`,
    'two.stx': `<script client>\n  const first = state(1)\n</script>\n<script client>\n  const second = state(2)\n</script>\n<div class="two">{{ second() }}</div>\n`,
    'rootless.stx': `<script client>\n  const hits = state(0)\n</script>\njust text\n`,
  }
  for (const [file, source] of Object.entries(partials))
    await Bun.write(path.join(dir, 'partials', file), source)
})

afterAll(async () => {
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

async function render(name: string): Promise<string> {
  const file = path.join(dir, 'page.stx')
  return processDirectives(`<section>@include('${name}')</section>`, {}, file, {
    partialsDir: path.join(dir, 'partials'),
    componentsDir: path.join(dir, 'components'),
  } as any, new Set<string>())
}

function owners(html: string): string[] {
  return [...html.matchAll(/<script\b[^>]*\bdata-stx-owner="([^"]*)"/g)].map(m => m[1])
}

function roots(html: string): string[] {
  return [...html.matchAll(/<(?!script)[a-z]+\b[^>]*\bdata-stx-scope="([^"]*)"/g)].map(m => m[1])
}

describe('an @include\'s script names the root it binds (#1958)', () => {
  for (const [shape, name] of [['with signals', 'signal'], ['without signals', 'plain']] as const) {
    it(`stamps the root's id, ${shape}`, async () => {
      const html = await render(name)
      expect(roots(html)).toHaveLength(1)
      expect(owners(html)).toEqual(roots(html))
    })
  }

  it('stamps the id it merged into', async () => {
    const html = await render('merged')
    expect(owners(html)).toEqual(['shared_root'])
    expect(html).not.toMatch(/stx_scope_merged_\d+/)
  })

  it('stamps only the script whose id the root carries', async () => {
    const html = await render('two')
    // The partial's two, not the runtime the page also gets.
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
      .filter(m => /\bdata-stx-run="always"/.test(m[1]))
    expect(scripts).toHaveLength(2)
    const stamped = scripts.filter(m => /\bdata-stx-owner=/.test(m[1]))
    expect(stamped).toHaveLength(1)
    expect(stamped[0][2]).toContain('const second = state(2)')
    expect(owners(html)).toEqual(roots(html))
  })

  it('stamps nothing when there is no root', async () => {
    const html = await render('rootless')
    expect(roots(html)).toEqual([])
    expect(owners(html)).toEqual([])
  })
})
