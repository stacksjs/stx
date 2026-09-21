/**
 * A component's scope script names the root it binds (stacksjs/stx#1958).
 *
 * The router re-runs data-stx-run="always" scripts on every navigation, which
 * rebuilt a layout component that never left the page. It now reads
 * data-stx-owner to skip a script whose root stayed (see the router's
 * client-persistent-owner.test.ts). That only works if every scope script
 * carries the id of the root it binds, in both emitted forms: a component used
 * once is inlined as a call, one used twice goes through a shared factory.
 */
import { describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { processDirectives } from '../../src/process'

function project(files: Record<string, string>): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'stx-1958-'))
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    writeFileSync(path.join(dir, file), content)
  }
  return dir
}

// The label keeps each script distinct: factories are keyed by content, so two
// components with identical scripts would share one and never be inlined.
const component = (label: string): string => `<button @click="open.set(!open())">${label}</button>
<script client>
const open = state(false)
const label = '${label}'
</script>
`

describe('component scope scripts name their root (#1958)', () => {
  it('stamps data-stx-owner with the id of the root the script binds', async () => {
    const dir = project({
      'components/OnceOnly.stx': component('once'),
      'components/TwiceOver.stx': component('twice'),
      'page.stx': '<OnceOnly />\n<TwiceOver />\n<TwiceOver />\n',
    })
    const html = await processDirectives(
      '<OnceOnly />\n<TwiceOver />\n<TwiceOver />\n',
      {},
      path.join(dir, 'page.stx'),
      { componentsDir: path.join(dir, 'components'), root: dir, buildMode: 'serve' },
      new Set<string>(),
    )

    const roots = [...html.matchAll(/<div data-stx-scope="([^"]+)"/g)].map(m => m[1])
    const scripts = [...html.matchAll(/<script\b[^>]*data-stx-owner="([^"]+)"[^>]*>([\s\S]*?)<\/script>/g)]
    expect(roots).toHaveLength(3)
    // One script per root, naming that root, and invoked with that same id.
    expect(scripts.map(m => m[1])).toEqual(roots)
    for (const [, owner, body] of scripts)
      expect(body).toContain(JSON.stringify(owner))
    // Both emitted forms are covered: the inlined call and the shared factory.
    expect(scripts.some(m => m[2].includes('__stxComponentFactories['))).toBe(true)
    expect(scripts.some(m => m[2].trimStart().startsWith('('))).toBe(true)
  })
})
