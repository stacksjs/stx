import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { slotContentHasExpressions } from '../src/utils'

/**
 * Slot content belongs to the caller, so `{{ ... }}` inside it names the
 * CALLER's reactive state - which the component's own script knows nothing
 * about. Judged by that script alone the expressions looked unresolvable and
 * not signal-backed, so they were evaluated server-side against a context that
 * never had them and rendered as empty.
 *
 * The visible symptom was a styled, empty box: `<Alert>{{ error }}</Alert>`
 * produced the alert with no message in it, and the only clue that anything
 * was wrong was that the box appeared at all.
 */

let dir: string

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-slot-signals-'))

  await Bun.write(path.join(dir, 'components', 'Callout.stx'), `<template>
  <div class="callout"><slot /></div>
</template>
`)

  // A page whose message lives in a signal, handed to the component as slot
  // content. This is the shape that silently rendered nothing.
  await Bun.write(path.join(dir, 'page.stx'), `<script>
const message = state('')
</script>
<Callout>{{ message }}</Callout>
`)

  // The same page, but the component resolves the expression itself.
  await Bun.write(path.join(dir, 'resolved.stx'), `<script>
const message = state('')
</script>
<Callout>{{ slotOwnedByComponent }}</Callout>
`)
})

afterAll(async () => {
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

async function render(file: string): Promise<string> {
  const { processDirectives } = await import('../src/index')
  const source = await Bun.file(path.join(dir, file)).text()
  return await processDirectives(
    source,
    {},
    path.join(dir, file),
    { componentsDir: path.join(dir, 'components') } as any,
    new Set(),
  )
}

describe('slot content over caller signals', () => {
  it('preserves the expression for the client instead of rendering an empty box', async () => {
    const html = await render('page.stx')

    // The component rendered, and the caller's expression survived to the
    // client runtime rather than being resolved to nothing server-side.
    expect(html).toContain('callout')
    expect(html).toContain('{{ message }}')
  })

  it('leaves an expression the component cannot resolve intact rather than blanking it', async () => {
    const html = await render('resolved.stx')

    expect(html).toContain('{{ slotOwnedByComponent }}')
  })
})

describe('slotContentHasExpressions', () => {
  it('detects the expression forms slot content can carry', () => {
    expect(slotContentHasExpressions('{{ error }}')).toBe(true)
    expect(slotContentHasExpressions('<span>{{ error }}</span>')).toBe(true)
    expect(slotContentHasExpressions('{!! rawHtml !!}')).toBe(true)
  })

  it('is false for plain content, so unrelated components are unaffected', () => {
    expect(slotContentHasExpressions('Save changes')).toBe(false)
    expect(slotContentHasExpressions('<strong>Save</strong>')).toBe(false)
    expect(slotContentHasExpressions('')).toBe(false)
  })

  it('ignores braces inside script and style, which are not template expressions', () => {
    // A regex in a script and a CSS rule both contain brace pairs.
    expect(slotContentHasExpressions('<script>const re = /\\{\\{x\\}\\}/g</script>')).toBe(false)
    expect(slotContentHasExpressions('<style>.a { color: red }</style>')).toBe(false)
  })
})
