/**
 * DOM attributes on a component belong to its rendered root, not only to the
 * internal `data-stx-props` transport object (#2063).
 */
import { describe, expect, it } from 'bun:test'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { processDirectives } from '../src/process'
import { createTempDir } from '../src/temp-dir'

describe('#2063 — component attributes fall through to the concrete root', () => {
  it('forwards static and server-bound DOM, data and ARIA attributes', async () => {
    const dir = createTempDir('stx-component-attrs-')
    const components = path.join(dir, 'components')
    mkdirSync(components, { recursive: true })
    writeFileSync(path.join(components, 'Button.stx'), `<script client>
const active = state(true)
</script>
<button class="button" :show="active" type="button">{{ slot }}</button>`)

    const html = await processDirectives(
      '<Button variant="ghost" title="Revoke invite" id="rm" data-row="7" aria-describedby="hint" :aria-label="label" />',
      { label: 'Remove invitation' },
      path.join(dir, 'page.stx'),
      { componentsDir: components, root: dir, buildMode: 'serve', cache: false } as any,
      new Set<string>(),
    )

    const root = html.match(/<button\b[^>]*>/i)?.[0] ?? ''
    expect(root).toContain('title="Revoke invite"')
    expect(root).toContain('id="rm"')
    expect(root).toContain('data-row="7"')
    expect(root).toContain('aria-describedby="hint"')
    expect(root).toContain('aria-label="Remove invitation"')
    expect(root).not.toContain('variant="ghost"')
    expect(html).toContain('data-stx-props=')
  })

  it('does not forward component API props that are not DOM attributes', async () => {
    const dir = createTempDir('stx-component-attrs-')
    const components = path.join(dir, 'components')
    mkdirSync(components, { recursive: true })
    writeFileSync(path.join(components, 'Badge.stx'), '<span class="badge">{{ variant }}</span>')

    const html = await processDirectives(
      '<Badge variant="success" title="Ready" />',
      {},
      path.join(dir, 'page.stx'),
      { componentsDir: components, root: dir, buildMode: 'serve', cache: false } as any,
      new Set<string>(),
    )

    const root = html.match(/<span\b[^>]*>/i)?.[0] ?? ''
    expect(root).toContain('title="Ready"')
    expect(root).not.toContain('variant="success"')
  })
})
