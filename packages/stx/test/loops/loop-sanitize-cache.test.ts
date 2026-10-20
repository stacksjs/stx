/**
 * A loop copies the objects its rows share once, not once per row.
 *
 * Every condition builds a safe context, and building one deep-copies each
 * object in scope. An `@if` per row of a 2,287-file commit copied the commit,
 * files and all, once per row: quadratic, and eight seconds of a production
 * server for one page (ReviewOS, 2026-10-20). See SANITIZE_CACHE.
 *
 * Counted rather than timed, through a getter that the copy has to read.
 */
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { createSafeContext, SANITIZE_CACHE } from '../../src/safe-evaluator'

function render(template: string, context: Record<string, unknown>): Promise<string> {
  return processDirectives(template, context, '/tmp/loop-sanitize-cache.stx', { ...defaultConfig }, new Set())
}

describe('sanitized copies inside @foreach', () => {
  it('copies a shared object once for the whole loop', async () => {
    const files = Array.from({ length: 200 }, (_, i) => ({ path: `f${i}.ts`, binary: i % 2 === 0 }))
    let reads = 0
    const commit = {
      sha: 'abc',
      get files() {
        reads++
        return files
      },
    }

    const html = await render(
      '@foreach (files as file)@if (file.binary)<b>{{ file.path }}</b>@else<i>{{ commit.sha }}</i>@endif@endforeach',
      { files, commit },
    )

    expect(html.match(/<b>/g)?.length).toBe(100)
    expect(html.match(/<i>abc<\/i>/g)?.length).toBe(100)
    // Once per row was 400 here: a condition and an expression on each of 200.
    expect(reads).toBeLessThanOrEqual(2)
  })

  it('shares the copies with a nested loop', async () => {
    let reads = 0
    // Counted on a property nothing prints, so only a copy reads it.
    const settings = {
      label: 'x',
      get theme() {
        reads++
        return 'dark'
      },
    }
    const groups = Array.from({ length: 20 }, (_, g) => ({ items: Array.from({ length: 10 }, (_, i) => g * 10 + i) }))

    const html = await render(
      '@foreach (groups as group)@foreach (group.items as item)@if (item % 2 === 0){{ settings.label }}@endif@endforeach@endforeach',
      { groups, settings },
    )

    expect(html.replace(/\s/g, '')).toBe('x'.repeat(100))
    expect(reads).toBeLessThanOrEqual(3)
  })

  it('still strips what it always stripped', () => {
    const cache = new WeakMap<object, unknown>()
    const user = { name: 'a', __secret: 's', nested: { __hidden: 1, ok: 2 } }
    const context = { user, [SANITIZE_CACHE]: cache } as Record<string, unknown>

    const first = createSafeContext(context).user as Record<string, any>
    const second = createSafeContext(context).user as Record<string, any>

    expect(first).toBe(second)
    expect(first.__secret).toBeUndefined()
    expect(first.nested.__hidden).toBeUndefined()
    expect(first.nested.ok).toBe(2)
    // The cache itself never reaches a template.
    expect(Object.keys(createSafeContext(context))).not.toContain(String(SANITIZE_CACHE))
  })

  it('outside a loop, copies afresh each time as before', () => {
    const user = { name: 'a' }
    expect(createSafeContext({ user }).user).not.toBe(createSafeContext({ user }).user)
  })
})
