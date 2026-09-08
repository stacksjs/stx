import { describe, expect, it } from 'bun:test'
import { renderString } from '../../src/render'

describe('renderString options', () => {
  it('does not inject a page stylesheet unless requested', async () => {
    const html = await renderString('<div class="flex">Hello {{ name }}</div>', { name: 'BunPress' }, { templateOnly: true })

    expect(html).toContain('<div class="flex">Hello BunPress</div>')
    expect(html).not.toContain('data-css="generated"')
  })

  it('supports explicit CSS injection for inline documents', async () => {
    const html = await renderString('<div class="flex">Hello</div>', {}, { injectCSS: true, templateOnly: true })

    expect(html).toContain('data-css="generated"')
    expect(html).toContain('<div class="flex">Hello</div>')
  })
})
