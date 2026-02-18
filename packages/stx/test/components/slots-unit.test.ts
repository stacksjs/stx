import { describe, expect, it } from 'bun:test'
import { parseSlots, renderSlot, processSlots, applySlots, parseSlotElement } from '../../src/slots'
import type { SlotDefinition, ParsedSlots } from '../../src/slots'

describe('parseSlots', () => {
  it('should extract default slot content', () => {
    const result = parseSlots('<p>Default content</p>')

    expect(result.default).toBe('<p>Default content</p>')
    expect(result.named.size).toBe(0)
  })

  it('should extract named slots with # syntax', () => {
    const result = parseSlots(`
      <template #header>
        <h1>Header Content</h1>
      </template>
      <p>Default content</p>
      <template #footer>
        <footer>Footer Content</footer>
      </template>
    `)

    expect(result.named.size).toBe(2)
    expect(result.named.get('header')?.content).toContain('<h1>Header Content</h1>')
    expect(result.named.get('footer')?.content).toContain('<footer>Footer Content</footer>')
    expect(result.default).toContain('<p>Default content</p>')
    expect(result.default).not.toContain('Header Content')
    expect(result.default).not.toContain('Footer Content')
  })

  it('should extract named slots with v-slot syntax', () => {
    const result = parseSlots(`
      <template v-slot:sidebar>
        <nav>Sidebar</nav>
      </template>
      <p>Main content</p>
    `)

    expect(result.named.size).toBe(1)
    expect(result.named.get('sidebar')?.content).toContain('<nav>Sidebar</nav>')
    expect(result.default).toContain('<p>Main content</p>')
  })

  it('should extract named slots with slot attribute syntax', () => {
    const result = parseSlots(`
      <template slot="actions">
        <button>Save</button>
      </template>
      <p>Body content</p>
    `)

    expect(result.named.size).toBe(1)
    expect(result.named.get('actions')?.content).toContain('<button>Save</button>')
    expect(result.default).toContain('<p>Body content</p>')
  })

  it('should extract scoped slot bindings', () => {
    const result = parseSlots(`
      <template #row="{ item, index }">
        <td>{{ index }}: {{ item.name }}</td>
      </template>
    `)

    expect(result.named.size).toBe(1)
    const rowSlot = result.named.get('row')
    expect(rowSlot).toBeDefined()
    expect(rowSlot?.propsBinding).toBe('{ item, index }')
    expect(rowSlot?.content).toContain('{{ index }}: {{ item.name }}')
  })

  it('should handle empty content', () => {
    const result = parseSlots('')
    expect(result.default).toBe('')
    expect(result.named.size).toBe(0)
  })

  it('should handle content with no named slots', () => {
    const result = parseSlots('<div><p>Just default</p><span>More default</span></div>')
    expect(result.default).toContain('<p>Just default</p>')
    expect(result.named.size).toBe(0)
  })

  it('should handle nested template tags', () => {
    const result = parseSlots(`
      <template #content>
        <div>
          <template v-if="show">Inner template</template>
        </div>
      </template>
    `)

    expect(result.named.size).toBe(1)
    expect(result.named.get('content')?.content).toContain('Inner template')
  })
})

describe('parseSlotElement', () => {
  it('should parse named slot element', () => {
    const result = parseSlotElement('<slot name="header" />')
    expect(result.name).toBe('header')
    expect(result.defaultContent).toBe('')
  })

  it('should parse slot with props', () => {
    const result = parseSlotElement('<slot name="row" :item="currentItem" :index="idx" />')
    expect(result.name).toBe('row')
    expect(result.props.item).toBe('currentItem')
    expect(result.props.index).toBe('idx')
  })

  it('should parse slot with default content', () => {
    const result = parseSlotElement('<slot name="footer">Default footer</slot>')
    expect(result.name).toBe('footer')
    expect(result.defaultContent).toBe('Default footer')
  })

  it('should parse unnamed slot', () => {
    const result = parseSlotElement('<slot />')
    expect(result.name).toBe('')
  })
})

describe('renderSlot', () => {
  it('should return default content when no slot provided', async () => {
    const result = await renderSlot(undefined, {}, 'Default fallback', {})
    expect(result).toBe('Default fallback')
  })

  it('should return slot content when slot provided', async () => {
    const slotDef: SlotDefinition = {
      name: 'header',
      content: '<h1>Custom Header</h1>',
    }

    const result = await renderSlot(slotDef, {}, 'Default', {})
    expect(result).toBe('<h1>Custom Header</h1>')
  })

  it('should inject scoped slot props with destructured binding', async () => {
    const slotDef: SlotDefinition = {
      name: 'row',
      content: '{{ item.name }} at {{ index }}',
      propsBinding: '{ item, index }',
    }

    const result = await renderSlot(
      slotDef,
      { item: { name: 'Alice' }, index: 0 },
      'Default',
      {},
    )

    expect(result).toContain('Alice')
    expect(result).toContain('0')
  })

  it('should handle renamed bindings', async () => {
    const slotDef: SlotDefinition = {
      name: 'cell',
      content: '{{ myItem }}',
      propsBinding: '{ item: myItem }',
    }

    const result = await renderSlot(
      slotDef,
      { item: 'value' },
      'Default',
      {},
    )

    expect(result).toContain('value')
  })

  it('should handle single binding (non-destructured)', async () => {
    const slotDef: SlotDefinition = {
      name: 'data',
      content: '{{ props.value }}',
      propsBinding: 'props',
    }

    const result = await renderSlot(
      slotDef,
      { value: 42 },
      'Default',
      {},
    )

    expect(result).toContain('42')
  })

  it('should return slot content unchanged when no propsBinding and no slotProps', async () => {
    const slotDef: SlotDefinition = {
      name: 'simple',
      content: '<p>Static content</p>',
    }

    const result = await renderSlot(slotDef, {}, 'Default', {})
    expect(result).toBe('<p>Static content</p>')
  })
})

describe('processSlots', () => {
  it('should replace default slot', async () => {
    const template = '<div><slot /></div>'
    const slots: ParsedSlots = {
      default: '<p>Provided content</p>',
      named: new Map(),
    }

    const result = await processSlots(template, slots, {})
    expect(result).toContain('<p>Provided content</p>')
    expect(result).not.toContain('<slot')
  })

  it('should replace named slots', async () => {
    const template = '<div><slot name="header">Default Header</slot><slot name="footer">Default Footer</slot></div>'
    const namedSlots = new Map<string, SlotDefinition>()
    namedSlots.set('header', { name: 'header', content: '<h1>Custom Header</h1>' })

    const slots: ParsedSlots = {
      default: '',
      named: namedSlots,
    }

    const result = await processSlots(template, slots, {})
    expect(result).toContain('<h1>Custom Header</h1>')
    // Footer should use default since not provided
    expect(result).toContain('Default Footer')
  })

  it('should preserve default fallback when slot not provided', async () => {
    const template = '<div><slot name="sidebar">Default sidebar content</slot></div>'
    const slots: ParsedSlots = {
      default: '',
      named: new Map(),
    }

    const result = await processSlots(template, slots, {})
    expect(result).toContain('Default sidebar content')
  })

  it('should replace self-closing default slot', async () => {
    const template = '<main><slot /></main>'
    const slots: ParsedSlots = {
      default: '<article>Main content</article>',
      named: new Map(),
    }

    const result = await processSlots(template, slots, {})
    expect(result).toContain('<article>Main content</article>')
  })

  it('should handle slot with default content tags', async () => {
    const template = '<div><slot>Fallback</slot></div>'
    const slots: ParsedSlots = {
      default: 'Custom content',
      named: new Map(),
    }

    const result = await processSlots(template, slots, {})
    expect(result).toContain('Custom content')
  })
})

describe('applySlots', () => {
  it('should apply default and named slots to template', async () => {
    const template = '<div><slot name="header" /><slot /><slot name="footer" /></div>'
    const namedSlots = new Map<string, SlotDefinition>()
    namedSlots.set('header', { name: 'header', content: '<h1>Title</h1>' })
    namedSlots.set('footer', { name: 'footer', content: '<p>Footer</p>' })

    const result = await applySlots(template, '<p>Body</p>', namedSlots, {})

    expect(result).toContain('<h1>Title</h1>')
    expect(result).toContain('<p>Body</p>')
    expect(result).toContain('<p>Footer</p>')
  })

  it('should handle template with no slots', async () => {
    const template = '<div><p>Static content</p></div>'
    const result = await applySlots(template, 'slot content', new Map(), {})
    expect(result).toContain('<p>Static content</p>')
  })
})
