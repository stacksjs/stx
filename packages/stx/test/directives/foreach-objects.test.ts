import { describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'

const defaultOptions = {
  partialsDir: '/tmp',
  componentsDir: '/tmp',
}

async function processTemplate(template: string, context: Record<string, unknown> = {}) {
  return processDirectives(template, context, '/test.stx', defaultOptions, new Set<string>())
}

describe('@foreach with objects containing multiple properties', () => {
  it('should access all object properties in @foreach loop', async () => {
    const icons = [
      { id: 'welcome', icon: '📃', label: 'Welcome.pdf', type: 'window', section: 'welcome', left: '20px', top: '20px' },
      { id: 'about', icon: '📄', label: 'About', type: 'window', section: 'about', left: '140px', top: '20px' },
      { id: 'docs', icon: '📚', label: 'Documentation', type: 'link', url: 'https://stacksjs.com/docs', left: '140px', top: '260px' },
    ]

    const result = await processTemplate(
      `@foreach(icons as iconData)
<button
  data-id="{{ iconData.id }}"
  data-icon="{{ iconData.icon }}"
  data-label="{{ iconData.label }}"
  data-type="{{ iconData.type }}"
  data-section="{{ iconData.section }}"
  data-url="{{ iconData.url }}"
  style="left: {{ iconData.left }}; top: {{ iconData.top }};"
></button>
@endforeach`,
      { icons }
    )

    // Check first icon properties
    expect(result).toContain('data-id="welcome"')
    expect(result).toContain('data-icon="📃"')
    expect(result).toContain('data-label="Welcome.pdf"')
    expect(result).toContain('data-type="window"')
    expect(result).toContain('data-section="welcome"')
    expect(result).toContain('left: 20px')
    expect(result).toContain('top: 20px')

    // Check second icon properties
    expect(result).toContain('data-id="about"')
    expect(result).toContain('data-section="about"')
    expect(result).toContain('left: 140px')

    // Check third icon (link type with url)
    expect(result).toContain('data-id="docs"')
    expect(result).toContain('data-url="https://stacksjs.com/docs"')
  })

  it('should handle objects with 6+ properties', async () => {
    const items = [
      { a: '1', b: '2', c: '3', d: '4', e: '5', f: '6', g: '7', h: '8' },
    ]

    const result = await processTemplate(
      `@foreach(items as item)
{{ item.a }}-{{ item.b }}-{{ item.c }}-{{ item.d }}-{{ item.e }}-{{ item.f }}-{{ item.g }}-{{ item.h }}
@endforeach`,
      { items }
    )

    expect(result).toContain('1-2-3-4-5-6-7-8')
  })
})
