import type { VariableUsage, VisualEditorDirectiveUsage } from '../../src/visual-editor'
import { describe, expect, it } from 'bun:test'
import { analyzeTemplateContent as analyzeTemplate } from '../../src/visual-editor'

describe('analyzeTemplate', () => {
  describe('variable extraction', () => {
    it('should extract variables from expressions', () => {
      const analysis = analyzeTemplate('<p>{{ message }}</p>')
      expect(analysis.variables.length).toBeGreaterThan(0)
      expect(analysis.variables[0].name).toBe('message')
      expect(analysis.variables[0].context).toBe('expression')
    })

    it('should extract multiple variables', () => {
      const analysis = analyzeTemplate('{{ title }} - {{ subtitle }}')
      const names = analysis.variables.map((v: VariableUsage) => v.name)
      expect(names).toContain('title')
      expect(names).toContain('subtitle')
    })

    it('should track line numbers', () => {
      const analysis = analyzeTemplate('<p>{{ first }}</p>\n<p>{{ second }}</p>')
      const first = analysis.variables.find((v: VariableUsage) => v.name === 'first')
      const second = analysis.variables.find((v: VariableUsage) => v.name === 'second')
      expect(first!.line).toBe(1)
      expect(second!.line).toBe(2)
    })
  })

  describe('directive extraction', () => {
    it('should extract directives', () => {
      const analysis = analyzeTemplate('@if(condition)\n  Content\n@endif')
      expect(analysis.directives.length).toBeGreaterThan(0)
      const ifDir = analysis.directives.find((d: VisualEditorDirectiveUsage) => d.name === 'if')
      expect(ifDir).toBeDefined()
      expect(ifDir!.category).toBe('control-flow')
    })

    it('should detect hasEndTag correctly', () => {
      const analysis = analyzeTemplate('@if(x)\n@endif\n@csrf')
      const ifDir = analysis.directives.find((d: VisualEditorDirectiveUsage) => d.name === 'if')
      const csrf = analysis.directives.find((d: VisualEditorDirectiveUsage) => d.name === 'csrf')
      expect(ifDir!.hasEndTag).toBe(true)
      expect(csrf!.hasEndTag).toBe(false)
    })

    it('should extract directive parameters', () => {
      const analysis = analyzeTemplate('@include(\'header\')')
      const include = analysis.directives.find((d: VisualEditorDirectiveUsage) => d.name === 'include')
      expect(include!.params).toBe('\'header\'')
    })
  })

  describe('component extraction', () => {
    it('should extract PascalCase components', () => {
      const analysis = analyzeTemplate('<UserCard name="John"></UserCard>')
      expect(analysis.components.length).toBeGreaterThan(0)
      expect(analysis.components[0].name).toBe('UserCard')
    })

    it('should extract component props', () => {
      const analysis = analyzeTemplate('<Card title="Hello" :count="5"></Card>')
      const card = analysis.components[0]
      expect(card.props.title).toBe('Hello')
      expect(card.props[':count']).toBe('5')
    })

    it('should detect slot content', () => {
      const analysis = analyzeTemplate('<Card>Content</Card>')
      expect(analysis.components[0].hasSlot).toBe(true)
    })

    it('should detect no slot content', () => {
      const analysis = analyzeTemplate('<Card></Card>')
      expect(analysis.components[0].hasSlot).toBe(false)
    })

    it('should extract @component directives', () => {
      const analysis = analyzeTemplate('@component(\'header\')\n@endcomponent')
      const componentDirs = analysis.directives.filter((d: VisualEditorDirectiveUsage) => d.name === 'component')
      expect(componentDirs.length).toBeGreaterThan(0)
    })
  })

  describe('slot extraction', () => {
    it('should extract default slot', () => {
      const analysis = analyzeTemplate('@slot\n  Content\n@endslot')
      expect(analysis.slots.length).toBeGreaterThan(0)
      expect(analysis.slots[0].name).toBe('default')
      expect(analysis.slots[0].isNamed).toBe(false)
    })

    it('should extract named slots', () => {
      const analysis = analyzeTemplate('@slot(\'header\')\n  Header\n@endslot')
      expect(analysis.slots[0].name).toBe('header')
      expect(analysis.slots[0].isNamed).toBe(true)
    })
  })

  describe('section extraction', () => {
    it('should extract sections', () => {
      const analysis = analyzeTemplate('@section(\'content\')\n  Main\n@endsection')
      expect(analysis.sections.length).toBeGreaterThan(0)
      expect(analysis.sections[0].name).toBe('content')
    })
  })

  describe('layout extraction', () => {
    it('should extract layout extends', () => {
      const analysis = analyzeTemplate('@extends(\'layouts/main\')\n@section(\'content\')\n@endsection')
      expect(analysis.layout).toBeDefined()
      expect(analysis.layout!.extends).toBe('layouts/main')
    })

    it('should track sections used in layout', () => {
      const analysis = analyzeTemplate('@extends(\'base\')\n@section(\'header\')\n@endsection\n@section(\'footer\')\n@endsection')
      expect(analysis.layout!.sections).toContain('header')
      expect(analysis.layout!.sections).toContain('footer')
    })
  })

  describe('script extraction', () => {
    it('should extract script blocks', () => {
      const analysis = analyzeTemplate('<script>\nconst x = 1\n</script>')
      expect(analysis.scripts.length).toBe(1)
      expect(analysis.scripts[0].type).toBe('javascript')
    })

    it('should detect TypeScript scripts', () => {
      const analysis = analyzeTemplate('<script lang="ts">\nconst x: number = 1\n</script>')
      expect(analysis.scripts[0].type).toBe('typescript')
    })

    it('should extract exports from scripts', () => {
      const analysis = analyzeTemplate('<script>\nexport const title = "Hello"\nexport function greet() {}\n</script>')
      expect(analysis.scripts[0].exports).toContain('title')
      expect(analysis.scripts[0].exports).toContain('greet')
    })
  })

  describe('style extraction', () => {
    it('should extract style blocks', () => {
      const analysis = analyzeTemplate('<style>\n.class { color: red }\n</style>')
      expect(analysis.styles.length).toBe(1)
      expect(analysis.styles[0].type).toBe('css')
    })

    it('should detect SCSS styles', () => {
      const analysis = analyzeTemplate('<style lang="scss">\n.class { &:hover {} }\n</style>')
      expect(analysis.styles[0].type).toBe('scss')
    })

    it('should detect scoped styles', () => {
      const analysis = analyzeTemplate('<style scoped>\n.class {}\n</style>')
      expect(analysis.styles[0].scoped).toBe(true)
    })
  })

  describe('metrics', () => {
    it('should calculate line count', () => {
      const analysis = analyzeTemplate('Line 1\nLine 2\nLine 3')
      expect(analysis.metrics.lines).toBe(3)
    })

    it('should calculate character count', () => {
      const analysis = analyzeTemplate('Hello')
      expect(analysis.metrics.characters).toBe(5)
    })

    it('should calculate directive count', () => {
      const analysis = analyzeTemplate('@if(x)\n@endif\n@foreach(y as z)\n@endforeach')
      expect(analysis.metrics.directiveCount).toBe(4)
    })

    it('should calculate component count', () => {
      const analysis = analyzeTemplate('<Card></Card><Button></Button>')
      expect(analysis.metrics.componentCount).toBe(2)
    })

    it('should calculate nesting depth', () => {
      const analysis = analyzeTemplate('@if(a)\n  @if(b)\n    @if(c)\n    @endif\n  @endif\n@endif')
      expect(analysis.metrics.maxNestingDepth).toBe(3)
    })

    it('should calculate complexity', () => {
      const analysis = analyzeTemplate('@if(x)\n@endif\n@foreach(y as z)\n@endforeach')
      // 1 base + 2 control flow directives (if, foreach)
      expect(analysis.metrics.complexity).toBeGreaterThanOrEqual(2)
    })
  })
})
