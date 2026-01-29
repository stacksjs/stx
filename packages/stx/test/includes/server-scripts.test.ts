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

      // Server script variables are used within the include's scope, not added to parent context
      // The @foreach should process and render the items
      expect(result).toContain('<li>Apple</li>')
      expect(result).toContain('<li>Banana</li>')
      expect(result).toContain('<li>Cherry</li>')
      expect(result).toContain('Fruits')
    })

    it('should render server script variables in included content', async () => {
      const partialPath = await createTempFile('server-script.stx', `
<script server>
const serverVar = 'from server'
</script>
<div>Server: {{ serverVar }}</div>
`)

      const template = `@include('server-script.stx')`
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

      // Server var should be rendered in output
      expect(result).toContain('from server')
      expect(result).toContain('Server:')
    })

    it('should handle arrays in server scripts', async () => {
      const partialPath = await createTempFile('array-partial.stx', `
<script server>
const items = [1, 2, 3]
const name = 'Test'
</script>
<div>{{ name }}</div>
@foreach(items as item)
<span>{{ item }}</span>
@endforeach
`)

      const template = `@include('array-partial.stx')`
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

      expect(result).toContain('Test')
      expect(result).toContain('<span>1</span>')
      expect(result).toContain('<span>2</span>')
      expect(result).toContain('<span>3</span>')
    })

    it('should handle context props passed to includes', async () => {
      const partialPath = await createTempFile('props-partial.stx', `
<h1>{{ title }}</h1>
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

      // Should render with props from context
      expect(result).toContain('My List')
      expect(result).toContain('<div>A</div>')
      expect(result).toContain('<div>B</div>')
      expect(result).toContain('<div>C</div>')
    })

    it('should use extracted variables for rendering include content', async () => {
      // Variables from server script are used within the include but don't
      // propagate to parent context
      const partialPath = await createTempFile('top-level.stx', `
<script server>
const topLevel = 'visible'
</script>
<div>{{ topLevel }}</div>
`)

      const template = `@include('top-level.stx')`
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

      // The variable should be rendered in the output
      expect(result).toContain('visible')
    })
  })

  describe('Context merging', () => {
    it('should use parent context variables in includes', async () => {
      const partialPath = await createTempFile('use-parent.stx', `
<div>{{ parentVar }}</div>
`)

      const template = `@include('use-parent.stx')`
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

      // Parent context variables should be accessible
      expect(result).toContain('from parent')
      expect(context.parentVar).toBe('from parent')
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
    it('should render server script variables in include output', async () => {
      const partialPath = await createTempFile('simple-partial.stx', `
<script server>
const message = 'Hello'
</script>
<div>{{ message }}</div>
`)

      const template = `@include('simple-partial.stx')`
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

      // The variable value should be rendered
      expect(result).toContain('Hello')
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
