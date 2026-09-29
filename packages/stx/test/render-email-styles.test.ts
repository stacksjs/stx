import { afterAll, describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { renderEmail } from '../src/build-views'

// renderEmail stripped every <style> block on the grounds that utility CSS had
// been inlined. That also removed the template author's own rules, and `@media`
// cannot be inlined - so no email could have a dark mode or a phone layout, and
// a caller's own CSS inliner (Stacks runs one) received nothing.

const dir = mkdtempSync(join(tmpdir(), 'stx-render-email-'))
afterAll(() => rmSync(dir, { recursive: true, force: true }))

async function render(body: string) {
  const file = join(dir, `t${Math.random().toString(36).slice(2)}.stx`)
  writeFileSync(file, body)
  return (await renderEmail(file, {})).html
}

describe('renderEmail <style> blocks', () => {
  it('keeps the author\'s rules, @media included', async () => {
    const html = await render(`<html><head><style>@media (prefers-color-scheme: dark) { .card { background: #111 } }</style></head><body><p class="card">hi</p></body></html>`)
    expect(html).toContain('@media (prefers-color-scheme: dark)')
  })

  it('drops the stylesheets stx generated itself', async () => {
    const html = await render(`<html><head></head><body><p class="text-red-500">hi</p></body></html>`)
    expect(html).not.toContain('data-css="generated"')
    expect(html).not.toContain('data-stx-cloak')
    expect(html).not.toContain('--stx-fg')
  })

  it('still inlines utility classes', async () => {
    const html = await render(`<html><head></head><body><p class="font-bold">hi</p></body></html>`)
    expect(html).toMatch(/<p[^>]*style="[^"]*font-weight/)
  })

  it('still strips scripts', async () => {
    const html = await render(`<html><head></head><body><script>alert(1)</script><p>hi</p></body></html>`)
    expect(html).not.toContain('<script')
  })
})

describe('renderEmail plain text', () => {
  it('leaves out what a reader never sees: styles, the head and a hidden preheader', async () => {
    const file = join(dir, 'text.stx')
    writeFileSync(file, `<html><head><title>Subject line</title><style>@media (prefers-color-scheme: dark) { .x { color: red } }</style></head><body><div style="display:none;max-height:0;">Preview text</div><p>Hello there.</p></body></html>`)
    const { text } = await renderEmail(file, {})
    expect(text).toBe('Hello there.')
  })
})
