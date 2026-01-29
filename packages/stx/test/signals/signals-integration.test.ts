import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs } from '../utils'

describe('STX Signals - Template Integration', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  describe('Signal Detection', () => {
    it('should detect state() usage and inject runtime', async () => {
      const testFile = await createTestFile('signal-detection.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>Signal Detection Test</title></head>
        <body>
          <script>
            const count = state(0)
          </script>
          <div id="app">{{ count() }}</div>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)

      // Should inject signals runtime
      expect(outputHtml).toContain('window.stx')
    })

    it('should detect derived() usage and inject runtime', async () => {
      const testFile = await createTestFile('derived-detection.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>Derived Detection Test</title></head>
        <body>
          <script>
            const count = state(0)
            const doubled = derived(() => count() * 2)
          </script>
          <div>{{ doubled() }}</div>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)
      expect(outputHtml).toContain('window.stx')
    })

    it('should detect effect() usage and inject runtime', async () => {
      const testFile = await createTestFile('effect-detection.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>Effect Detection Test</title></head>
        <body>
          <script>
            const count = state(0)
            effect(() => console.log(count()))
          </script>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)
      expect(outputHtml).toContain('window.stx')
    })
  })

  describe('@if Directive', () => {
    it('should include @if directive in output for client-side processing', async () => {
      const testFile = await createTestFile('client-if.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>Client @if Test</title></head>
        <body>
          <script>
            const isVisible = state(true)
          </script>
          <div @if="isVisible()">Visible content</div>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)

      // Client-side @if should remain for runtime processing
      expect(outputHtml).toContain('@if')
      expect(outputHtml).toContain('window.stx')
    })
  })

  describe('@for Directive', () => {
    it('should include @for directive in output for client-side processing', async () => {
      const testFile = await createTestFile('client-for.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>Client @for Test</title></head>
        <body>
          <script>
            const items = state(['a', 'b', 'c'])
          </script>
          <ul>
            <li @for="item in items()">{{ item }}</li>
          </ul>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)

      expect(outputHtml).toContain('@for')
      expect(outputHtml).toContain('window.stx')
    })
  })

  describe('@show Directive', () => {
    it('should include @show directive in output', async () => {
      const testFile = await createTestFile('show-directive.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>@show Test</title></head>
        <body>
          <script>
            const visible = state(true)
          </script>
          <div @show="visible()">Toggle visibility</div>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)

      expect(outputHtml).toContain('@show')
      expect(outputHtml).toContain('window.stx')
    })
  })

  describe('@model Directive', () => {
    it('should include @model directive in output', async () => {
      const testFile = await createTestFile('model-directive.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>@model Test</title></head>
        <body>
          <script>
            const username = state('')
          </script>
          <input @model="username">
          <p>Hello, {{ username() }}</p>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)

      expect(outputHtml).toContain('@model')
      expect(outputHtml).toContain('window.stx')
    })
  })

  describe('@class Directive', () => {
    it('should include @class directive in output', async () => {
      const testFile = await createTestFile('class-directive.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>@class Test</title></head>
        <body>
          <script>
            const isActive = state(true)
          </script>
          <div @class="{ active: isActive(), hidden: !isActive() }">Dynamic classes</div>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)

      expect(outputHtml).toContain('@class')
      expect(outputHtml).toContain('window.stx')
    })
  })

  describe('@style Directive', () => {
    it('should include @style directive in output', async () => {
      const testFile = await createTestFile('style-directive.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>@style Test</title></head>
        <body>
          <script>
            const color = state('red')
          </script>
          <div @style="{ color: color() }">Styled content</div>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)

      expect(outputHtml).toContain('@style')
      expect(outputHtml).toContain('window.stx')
    })
  })

  describe('@bind Directive', () => {
    it('should include @bind:attr directive in output', async () => {
      const testFile = await createTestFile('bind-directive.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>@bind Test</title></head>
        <body>
          <script>
            const imgSrc = state('/image.png')
            const isDisabled = state(false)
          </script>
          <img @bind:src="imgSrc()">
          <button @bind:disabled="isDisabled()">Click</button>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)

      expect(outputHtml).toContain('@bind:src')
      expect(outputHtml).toContain('@bind:disabled')
      expect(outputHtml).toContain('window.stx')
    })
  })

  describe('Event Handling', () => {
    it('should preserve @click handlers', async () => {
      const testFile = await createTestFile('click-handler.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>@click Test</title></head>
        <body>
          <script>
            const count = state(0)
            function increment() {
              count.update(n => n + 1)
            }
          </script>
          <button @click="increment">Count: {{ count() }}</button>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)

      expect(outputHtml).toContain('@click')
      expect(outputHtml).toContain('window.stx')
    })

    it('should preserve event modifiers', async () => {
      const testFile = await createTestFile('event-modifiers.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>Event Modifiers Test</title></head>
        <body>
          <script>
            const submitted = state(false)
            function handleSubmit() { submitted.set(true) }
            function handleClick() {}
          </script>
          <form @submit.prevent="handleSubmit">
            <button @click.stop="handleClick">Submit</button>
          </form>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)

      expect(outputHtml).toContain('@submit.prevent')
      expect(outputHtml).toContain('@click.stop')
    })
  })

  describe('Text Interpolation', () => {
    it('should preserve mustache syntax for client-side rendering', async () => {
      const testFile = await createTestFile('interpolation.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>Interpolation Test</title></head>
        <body>
          <script>
            const message = state('Hello')
            const count = state(42)
          </script>
          <p>{{ message() }}</p>
          <p>Count: {{ count() }}</p>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)

      // Mustache syntax should remain for client-side processing
      expect(outputHtml).toContain('{{')
      expect(outputHtml).toContain('}}')
      expect(outputHtml).toContain('window.stx')
    })
  })

  describe('@text and @html Directives', () => {
    it('should include @text directive in output', async () => {
      const testFile = await createTestFile('text-directive.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>@text Test</title></head>
        <body>
          <script>
            const message = state('Hello World')
          </script>
          <span @text="message()"></span>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)

      expect(outputHtml).toContain('@text')
      expect(outputHtml).toContain('window.stx')
    })

    it('should include @html directive in output', async () => {
      const testFile = await createTestFile('html-directive.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>@html Test</title></head>
        <body>
          <script>
            const content = state('<strong>Bold</strong>')
          </script>
          <div @html="content()"></div>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)

      expect(outputHtml).toContain('@html')
      expect(outputHtml).toContain('window.stx')
    })
  })

  describe('Combined Example', () => {
    it('should handle a complete reactive component', async () => {
      const testFile = await createTestFile('complete-component.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>Complete Component Test</title></head>
        <body>
          <script>
            const todos = state([
              { id: 1, text: 'Learn STX', done: false },
              { id: 2, text: 'Build app', done: false }
            ])
            const newTodo = state('')
            const filter = state('all')

            const filteredTodos = derived(() => {
              const f = filter()
              const all = todos()
              if (f === 'active') return all.filter(t => !t.done)
              if (f === 'done') return all.filter(t => t.done)
              return all
            })

            function addTodo() {
              if (!newTodo()) return
              todos.update(list => [...list, { id: Date.now(), text: newTodo(), done: false }])
              newTodo.set('')
            }

            function toggleTodo(id) {
              todos.update(list => list.map(t =>
                t.id === id ? { ...t, done: !t.done } : t
              ))
            }
          </script>

          <div id="todo-app">
            <h1>Todo List</h1>

            <form @submit.prevent="addTodo">
              <input @model="newTodo" placeholder="Add todo...">
              <button type="submit">Add</button>
            </form>

            <div class="filters">
              <button @click="filter.set('all')" @class="{ active: filter() === 'all' }">All</button>
              <button @click="filter.set('active')" @class="{ active: filter() === 'active' }">Active</button>
              <button @click="filter.set('done')" @class="{ active: filter() === 'done' }">Done</button>
            </div>

            <ul @show="filteredTodos().length > 0">
              <li @for="todo in filteredTodos()">
                <input type="checkbox" @bind:checked="todo.done" @click="toggleTodo(todo.id)">
                <span @class="{ done: todo.done }">{{ todo.text }}</span>
              </li>
            </ul>

            <p @show="filteredTodos().length === 0">No todos to show</p>

            <p>{{ filteredTodos().length }} items</p>
          </div>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)

      // Should contain all reactive directives
      expect(outputHtml).toContain('@submit.prevent')
      expect(outputHtml).toContain('@model')
      expect(outputHtml).toContain('@click')
      expect(outputHtml).toContain('@class')
      expect(outputHtml).toContain('@show')
      expect(outputHtml).toContain('@for')
      expect(outputHtml).toContain('@bind:checked')

      // Should inject runtime
      expect(outputHtml).toContain('window.stx')

      // Should preserve mustache syntax
      expect(outputHtml).toContain('{{')
      expect(outputHtml).toContain('}}')
    })
  })
})
