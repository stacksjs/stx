/**
 * Tests for processIncludes handling of server scripts in included files
 */
import { describe, expect, it, beforeAll } from 'bun:test'
import { processIncludes } from '../../src/includes'
import { join } from 'node:path'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

describe('processIncludes with server scripts', () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'stx-test-'))
  })

  const createTempFile = async (name: string, content: string): Promise<string> => {
    const path = join(tempDir, name)
    await writeFile(path, content)
    return path
  }

  describe('Server script extraction from includes', () => {
    it('should extract variables from <script server> in included file', async () => {
      // Create a partial with server script
      const partialPath = await createTempFile('partial.stx', `
<script server>
const items = ['Apple', 'Banana', 'Cherry']
const title = 'Fruits'
</script>
<h2>{{ title }}</h2>
<ul>
@foreach(items as item)
  <li>{{ item }}</li>
@endforeach
</ul>
`)

      const template = `@include('partial.stx')`
      const context: Record<string, unknown> = {}
      const options = {
        partialsDir: tempDir,
        componentsDir: tempDir,
        debug: true,
      }
      const dependencies = new Set<string>()

      const result = await processIncludes(
        template,
        context,
        join(tempDir, 'main.stx'),
        options,
        dependencies
      )

      // Server script variables should be in context
      expect(context.items).toEqual(['Apple', 'Banana', 'Cherry'])
      expect(context.title).toBe('Fruits')

      // Should have processed the @foreach
      expect(result).toContain('<li>Apple</li>')
      expect(result).toContain('<li>Banana</li>')
      expect(result).toContain('<li>Cherry</li>')
    })

    it('should handle multiple script tags with only server ones extracted', async () => {
      const partialPath = await createTempFile('multi-script.stx', `
<script server>
const serverVar = 'from server'
</script>
<script>
const clientVar = 'from client'
</script>
<div>Server: {{ serverVar }}</div>
`)

      const template = `@include('multi-script.stx')`
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

      // Only server var should be extracted
      expect(context.serverVar).toBe('from server')
      expect(context.clientVar).toBeUndefined()
    })

    it('should handle async code in server scripts', async () => {
      const partialPath = await createTempFile('async-partial.stx', `
<script server>
const data = await Promise.resolve({ name: 'Test' })
const items = await Promise.all([1, 2, 3].map(async n => n * 2))
</script>
<div>{{ data.name }}</div>
@foreach(items as item)
<span>{{ item }}</span>
@endforeach
`)

      const template = `@include('async-partial.stx')`
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

      // Async values should be resolved
      expect(context.data).toEqual({ name: 'Test' })
      expect(context.items).toEqual([2, 4, 6])
    })

    it('should handle defineProps and withDefaults in server scripts', async () => {
      const partialPath = await createTempFile('props-partial.stx', `
<script server>
interface Props {
  title: string
  items: string[]
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 10
})

const { title, items, count } = props
</script>
<h1>{{ title }} ({{ count }})</h1>
@foreach(items as item)
<div>{{ item }}</div>
@endforeach
`)

      const template = `@include('props-partial.stx')`
      const context: Record<string, unknown> = {
        title: 'My List',
        items: ['A', 'B', 'C'],
      }
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

      // Should render with props
      expect(result).toContain('My List')
      expect(result).toContain('<div>A</div>')
      expect(result).toContain('<div>B</div>')
      expect(result).toContain('<div>C</div>')
    })

    it('should not extract variables from nested functions', async () => {
      const partialPath = await createTempFile('nested-func.stx', `
<script server>
const topLevel = 'visible'
function helper() {
  const nested = 'hidden'
  return nested
}
const result = helper()
</script>
<div>{{ topLevel }} - {{ result }}</div>
`)

      const template = `@include('nested-func.stx')`
      const context: Record<string, unknown> = {}
      const options = {
        partialsDir: tempDir,
        componentsDir: tempDir,
      }
      const dependencies = new Set<string>()

      await processIncludes(
        template,
        context,
        join(tempDir, 'main.stx'),
        options,
        dependencies
      )

      expect(context.topLevel).toBe('visible')
      expect(context.helper).toBeTypeOf('function')
      expect(context.result).toBe('hidden')
      expect(context.nested).toBeUndefined()
    })
  })

  describe('Context merging', () => {
    it('should merge include context with parent context', async () => {
      const partialPath = await createTempFile('merge-partial.stx', `
<script server>
const partialVar = 'from partial'
</script>
<div>{{ parentVar }} - {{ partialVar }}</div>
`)

      const template = `@include('merge-partial.stx')`
      const context: Record<string, unknown> = {
        parentVar: 'from parent',
      }
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

      // Both variables should be accessible
      expect(result).toContain('from parent')
      expect(result).toContain('from partial')
      expect(context.parentVar).toBe('from parent')
      expect(context.partialVar).toBe('from partial')
    })

    it('should pass props from include directive to partial', async () => {
      const partialPath = await createTempFile('with-props.stx', `
<script server>
const computedLabel = title.toUpperCase()
</script>
<div class="{{ className }}">{{ computedLabel }}</div>
`)

      const template = `@include('with-props.stx', { title: 'hello', className: 'my-class' })`
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

      expect(result).toContain('class="my-class"')
      expect(result).toContain('HELLO')
    })
  })

  describe('Error handling', () => {
    it('should gracefully handle errors in server script', async () => {
      const partialPath = await createTempFile('error-partial.stx', `
<script server>
const goodVar = 'works'
const badVar = nonExistentFunction()
</script>
<div>{{ goodVar }}</div>
`)

      const template = `@include('error-partial.stx')`
      const context: Record<string, unknown> = {}
      const options = {
        partialsDir: tempDir,
        componentsDir: tempDir,
        debug: true,
      }
      const dependencies = new Set<string>()

      // Should not throw, just warn
      const result = await processIncludes(
        template,
        context,
        join(tempDir, 'main.stx'),
        options,
        dependencies
      )

      // Should still render what it can
      expect(result).toBeDefined()
    })

    it('should handle empty server scripts', async () => {
      const partialPath = await createTempFile('empty-script.stx', `
<script server>
</script>
<div>Static content</div>
`)

      const template = `@include('empty-script.stx')`
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

      expect(result).toContain('Static content')
    })
  })

  describe('Dependencies tracking', () => {
    it('should add included file to dependencies', async () => {
      const partialPath = await createTempFile('tracked.stx', `<div>Content</div>`)

      const template = `@include('tracked.stx')`
      const context: Record<string, unknown> = {}
      const options = {
        partialsDir: tempDir,
        componentsDir: tempDir,
      }
      const dependencies = new Set<string>()

      await processIncludes(
        template,
        context,
        join(tempDir, 'main.stx'),
        options,
        dependencies
      )

      expect(dependencies.has(partialPath)).toBe(true)
    })
  })
})
