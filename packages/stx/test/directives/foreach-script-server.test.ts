import { describe, expect, it, beforeAll } from 'bun:test'
import { processIncludes } from '../../src/includes'
import { processDirectives } from '../../src/process'
import { extractVariables } from '../../src/variable-extractor'
import { join } from 'node:path'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'

describe('@foreach with objects from script server block', () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'stx-test-'))
  })

  const createTempFile = async (name: string, content: string): Promise<string> => {
    const filePath = join(tempDir, name)
    await writeFile(filePath, content)
    return filePath
  }

  it('should access all object properties from script server', async () => {
    const partialPath = await createTempFile('icons-partial.stx', `
<script server>
const icons = [
  { id: 'welcome', icon: '📃', label: 'Welcome.pdf', type: 'window', section: 'welcome', left: '20px', top: '20px' },
  { id: 'about', icon: '📄', label: 'About', type: 'window', section: 'about', left: '140px', top: '20px' },
  { id: 'docs', icon: '📚', label: 'Documentation', type: 'link', url: 'https://stacksjs.com/docs', left: '140px', top: '260px' },
]
</script>

<div class="icons">
@foreach (icons as iconData)
<button
  data-id="{{ iconData.id }}"
  data-icon="{{ iconData.icon }}"
  data-label="{{ iconData.label }}"
  data-type="{{ iconData.type }}"
  data-section="{{ iconData.section }}"
  data-url="{{ iconData.url }}"
  style="left: {{ iconData.left }}; top: {{ iconData.top }};"
></button>
@endforeach
</div>
`)

    const template = `@include('icons-partial.stx')`
    const context: Record<string, unknown> = {}
    const options = {
      partialsDir: tempDir,
      componentsDir: tempDir,
    }
    const dependencies = new Set<string>()

    const result = await processIncludes(
      template,
      context,
      join(tempDir, 'main.stx'),
      options,
      dependencies
    )

    console.log('Result:', result)

    // Check first icon properties (all 7 properties)
    expect(result).toContain('data-id="welcome"')
    expect(result).toContain('data-icon="📃"')
    expect(result).toContain('data-label="Welcome.pdf"')
    expect(result).toContain('data-type="window"')
    expect(result).toContain('data-section="welcome"')
    expect(result).toContain('left: 20px')
    expect(result).toContain('top: 20px')

    // Check second icon properties
    expect(result).toContain('data-section="about"')
    expect(result).toContain('left: 140px')

    // Check third icon (link type with url)
    expect(result).toContain('data-url="https://stacksjs.com/docs"')
  })

  it('should handle objects with 8 properties in single-line format', async () => {
    const partialPath = await createTempFile('multi-prop.stx', `
<script server>
const items = [
  { a: '1', b: '2', c: '3', d: '4', e: '5', f: '6', g: '7', h: '8' },
]
</script>

@foreach (items as item)
{{ item.a }}-{{ item.b }}-{{ item.c }}-{{ item.d }}-{{ item.e }}-{{ item.f }}-{{ item.g }}-{{ item.h }}
@endforeach
`)

    const template = `@include('multi-prop.stx')`
    const context: Record<string, unknown> = {}
    const options = {
      partialsDir: tempDir,
      componentsDir: tempDir,
    }
    const dependencies = new Set<string>()

    const result = await processIncludes(
      template,
      context,
      join(tempDir, 'main.stx'),
      options,
      dependencies
    )

    console.log('8-prop result:', result)
    expect(result).toContain('1-2-3-4-5-6-7-8')
  })

  it('should extract variables from script correctly', async () => {
    const scriptContent = `
const icons = [
  { id: 'welcome', icon: '📃', label: 'Welcome.pdf', type: 'window', section: 'welcome', left: '20px', top: '20px' },
  { id: 'about', icon: '📄', label: 'About', type: 'window', section: 'about', left: '140px', top: '20px' },
]
`
    const context: Record<string, unknown> = {}
    await extractVariables(scriptContent, context, '/test.stx')

    console.log('Extracted context:', JSON.stringify(context, null, 2))

    // Check the icons array was extracted correctly
    expect(context.icons).toBeDefined()
    expect(Array.isArray(context.icons)).toBe(true)
    const icons = context.icons as any[]

    // Check first icon has all properties
    expect(icons[0].id).toBe('welcome')
    expect(icons[0].icon).toBe('📃')
    expect(icons[0].label).toBe('Welcome.pdf')
    expect(icons[0].type).toBe('window')
    expect(icons[0].section).toBe('welcome')
    expect(icons[0].left).toBe('20px')
    expect(icons[0].top).toBe('20px')

    // Check second icon
    expect(icons[1].section).toBe('about')
  })
})
