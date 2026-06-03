/**
 * Islands Phase 1 (stacksjs/stx#1746): the per-component `client="<trigger>"`
 * directive defers a component's hydration to a trigger by stamping the existing
 * `stx-hydrate` attribute on its scope wrapper — so the reactive binding
 * (processElement) is held back until visible/idle/interaction/media instead of
 * running eagerly at page load. `client="load"` is the eager default.
 *
 * This pins the SERVER-SIDE plumbing (attribute → wrapper) + the directive being
 * consumed (not leaked into the component's props). The runtime deferral itself
 * is the existing, separately-tested stx-hydrate/deferHydration behavior.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { processDirectives } from '../../src/process'
import { isHydrateTrigger } from '../../src/utils'

describe('islands: client="<trigger>" component directive (#1746)', () => {
  let dir: string
  let componentsDir: string

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'stx-islands-'))
    componentsDir = join(dir, 'components')
    await mkdir(componentsDir, { recursive: true })
    // An interactive component (has <script client> with signals → gets a scope).
    await writeFile(
      join(componentsDir, 'counter.stx'),
      `<script client>\nconst count = state(0)\n</script>\n<div class="counter"><button @click="count.set(count() + 1)">+</button><span x-text="count()"></span></div>`,
    )
    // A static component (no client script → no scope wrapper).
    await writeFile(
      join(componentsDir, 'static-badge.stx'),
      `<span class="badge">{{ label }}</span>`,
    )
  })

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  const render = (tpl: string) =>
    processDirectives(tpl, {}, join(dir, 'page.stx'), { componentsDir, partialsDir: componentsDir } as any, new Set<string>())

  // Read stx-hydrate off the scope wrapper specifically (the injected runtime
  // source also contains the string "stx-hydrate", so a global search lies).
  function wrapperTrigger(out: string): string | null {
    const m = out.match(/<div data-stx-scope="[^"]*"[^>]*>/)
    if (!m)
      return '__no-wrapper__'
    const h = m[0].match(/stx-hydrate="([^"]*)"/)
    return h ? h[1] : null
  }

  it('defers on visible / idle / interaction / media:', async () => {
    expect(wrapperTrigger(await render('<counter client="visible" />'))).toBe('visible')
    expect(wrapperTrigger(await render('<counter client="idle" />'))).toBe('idle')
    expect(wrapperTrigger(await render('<counter client="interaction" />'))).toBe('interaction')
    expect(wrapperTrigger(await render('<counter client="media:(min-width: 768px)" />'))).toBe('media:(min-width: 768px)')
  })

  it('treats client="load" as eager (no stx-hydrate)', async () => {
    const out = await render('<counter client="load" />')
    expect(wrapperTrigger(out)).toBeNull()
    expect(out).toContain('data-stx-scope') // still hydrates, just eagerly
  })

  it('ignores an unknown trigger', async () => {
    expect(wrapperTrigger(await render('<counter client="whenever" />'))).toBeNull()
  })

  it('leaves a component with no client attribute unchanged', async () => {
    const out = await render('<counter />')
    expect(wrapperTrigger(out)).toBeNull()
    expect(out).toContain('data-stx-scope')
  })

  it('does NOT leak the client directive into the component props (data-stx-props)', async () => {
    const out = await render('<counter client="visible" title="hi" />')
    const m = out.match(/data-stx-props="([^"]*)"/)
    // title should serialize; client must not.
    if (m) {
      expect(m[1]).not.toContain('client')
      expect(m[1]).toContain('title')
    }
  })

  it('is a no-op on a static (non-interactive) component — no scope, no crash', async () => {
    const out = await render('<static-badge label="New" client="visible" />')
    expect(out).toContain('class="badge"')
    expect(out).not.toContain('data-stx-scope')
  })
})

describe('isHydrateTrigger', () => {
  it('accepts the runtime triggers, rejects everything else', () => {
    for (const t of ['visible', 'idle', 'interaction', 'media:(min-width: 1px)'])
      expect(isHydrateTrigger(t)).toBe(true)
    for (const t of ['load', 'eager', '', 'always', 'visibleish'])
      expect(isHydrateTrigger(t)).toBe(false)
  })
})
