import path from 'node:path'
import { describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'

const pagePath = path.resolve(__dirname, 'image-fit-page.stx')

function render(template: string, context: Record<string, unknown> = {}): Promise<string> {
  return processDirectives(template, context, pagePath, { debug: false }, new Set<string>())
}

describe('builtin image fitting', () => {
  it.each(['Image', 'StxImage'])('applies %s layout props to the image style', async (component) => {
    const output = await render(`<${component} src="/wordmark.svg" alt="HQ" width="683" height="275" objectFit="contain" objectPosition="left center" priority />`)
    expect(output).toContain('object-fit:contain')
    expect(output).toContain('object-position:left center')
    expect(output).toContain('aspect-ratio:683/275')
    expect(output).toContain('loading="eager"')
    expect(output).not.toMatch(/\sobject(?:Fit|Position)=/i)
  })

  it('resolves server values and keeps author styles and attributes', async () => {
    const output = await render('<Image src="/wordmark.svg" alt="HQ" :objectFit="fitMode" :objectPosition="anchor" style="width:96px;height:36px" data-role="brand" />', { fitMode: 'contain', anchor: 'center' })
    expect(output).toContain('width:96px;height:36px;object-fit:contain;object-position:center')
    expect(output).toContain('data-role="brand"')
    expect(output).not.toMatch(/\sobject(?:Fit|Position)=/i)
  })

  it('accepts the Image component aliases without leaking them to HTML', async () => {
    const output = await render('<Image src="/wordmark.svg" alt="HQ" fit="contain" position="top" />')
    expect(output).toContain('object-fit:contain')
    expect(output).toContain('object-position:top')
    expect(output).not.toMatch(/\s(?:fit|position)=/)
  })

  it('leaves the browser default unchanged when no fit is requested', async () => {
    const output = await render('<StxImage src="/photo.jpg" alt="Training" />')
    expect(output).not.toContain('object-fit:')
    expect(output).not.toContain('object-position:')
  })
})
