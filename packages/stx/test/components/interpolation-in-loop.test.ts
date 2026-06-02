import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import { processDirectives } from '../../src/process'
import { usesSignalsInScript } from '../../src/expressions'
import { join } from 'node:path'
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

/**
 * Regression for stacksjs/stx#1748: `{{ loopVar.prop }}` text interpolation
 * inside a client `x-for` rendered EMPTY when the loop lived inside a component,
 * while it worked at the view level and `x-text` worked in both.
 *
 * Root cause: `processExpressions` only preserves `{{ }}` that reference
 * non-context vars (loop/signal vars) when the template is detected as "uses
 * signals". `renderComponentWithSlot` strips the component's `<script client>`
 * before the body's expressions are processed, leaving only a bare
 * `x-for="it in items"` — which the old `usesSignalsInScript` (matching only
 * `@`-prefixed directives with `()` calls) didn't recognize. So `{{ it.name }}`
 * was evaluated server-side (loop var undefined → '') and emptied instead of
 * preserved for the client runtime.
 */
describe('{{ }} interpolation inside a component x-for (#1748)', () => {
  let tempDir: string
  let componentsDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'stx-1748-'))
    componentsDir = join(tempDir, 'components')
    await mkdir(componentsDir, { recursive: true })
    await writeFile(
      join(componentsDir, 'repro-list.stx'),
      `<script client>
const items = state([])
onMount(() => { setTimeout(() => items.set([{ name: 'CompX' }, { name: 'CompY' }]), 0) })
</script>
<ul id="repro-list">
  <li x-for="it in items" class="interp">{{ it.name || 'none' }}</li>
  <li x-for="it in items" class="xt" x-text="it.name || 'none'"></li>
</ul>`,
    )
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  const render = (template: string) =>
    processDirectives(template, {}, join(tempDir, 'page.stx'), { componentsDir, partialsDir: componentsDir } as any, new Set<string>())

  it('preserves {{ loopVar.prop }} inside the component loop for the client runtime', async () => {
    const out = await render(`<repro-list />`)
    // The `{{ it.name || 'none' }}` text must survive to the client (NOT be
    // emptied server-side). Before the fix this shipped as `<li …></li>`.
    expect(out).toContain('{{ it.name || \'none\' }}')
    // The x-for loop and its x-text sibling are intact too.
    expect(out).toContain('x-for="it in items"')
    expect(out).toContain('x-text="it.name || \'none\'"')
  })

  it('does not leave the interpolation <li> empty', async () => {
    const out = await render(`<repro-list />`)
    const interpLi = out.match(/<li[^>]*class="interp"[^>]*>([\s\S]*?)<\/li>/)
    expect(interpLi).not.toBeNull()
    expect(interpLi![1]).toContain('{{ it.name')
  })
})

describe('usesSignalsInScript recognizes client-only directives (#1748)', () => {
  it('treats a bare x-for / :for (no script, no () call) as reactive', () => {
    expect(usesSignalsInScript('<ul><li x-for="it in items">{{ it.name }}</li></ul>')).toBe(true)
    expect(usesSignalsInScript('<ul><li :for="it in items">{{ it.name }}</li></ul>')).toBe(true)
    expect(usesSignalsInScript('<div :if="open">x</div>')).toBe(true)
    expect(usesSignalsInScript('<span x-text="count"></span>')).toBe(true)
  })

  it('does NOT treat plain server templates as reactive', () => {
    expect(usesSignalsInScript('<div>{{ user.name }}</div>')).toBe(false)
    // A server @foreach loop variable is not a client signal.
    expect(usesSignalsInScript('@foreach(rows as r)<td>{{ r.status }}</td>@endforeach')).toBe(false)
  })
})
