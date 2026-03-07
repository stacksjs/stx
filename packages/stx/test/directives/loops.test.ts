import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'
import { processDirectives } from '../../src/process'
import type { StxOptions } from '../../src/types'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs, TEMP_DIR } from '../utils'

const defaultOptions: StxOptions = { debug: false, componentsDir: 'components' }

async function processTemplate(
  template: string,
  context: Record<string, any> = {},
  filePath: string = 'test.stx',
  options: StxOptions = defaultOptions,
): Promise<string> {
  const dependencies = new Set<string>()
  return processDirectives(template, context, filePath, options, dependencies)
}

describe('stx Loop Directives', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  // Test foreach loops with arrays
  it('should process @foreach loops with arrays', async () => {
    const testFile = await createTestFile('foreach-array.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Foreach Array Test</title>
        <script>
          module.exports = {
            fruits: ["Apple", "Banana", "Cherry"]
          };
        </script>
      </head>
      <body>
        <ul id="fruit-list">
          @foreach (fruits as fruit)
            <li class="fruit">{{ fruit }}</li>
          @endforeach
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

    expect(outputHtml).toContain('<li class="fruit">Apple</li>')
    expect(outputHtml).toContain('<li class="fruit">Banana</li>')
    expect(outputHtml).toContain('<li class="fruit">Cherry</li>')
  })

  // Test for loops
  it('should process @for loops correctly', async () => {
    const testFile = await createTestFile('for.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>For Loop Test</title>
        <script>
          module.exports = {
            count: 3
          };
        </script>
      </head>
      <body>
        <ol id="number-list">
          @for (let i = 1; i <= count; i++)
            <li class="number">Item {{ i }}</li>
          @endfor
        </ol>

        <!-- Descending loop -->
        <ol id="countdown">
          @for (let i = 5; i > 0; i--)
            <li>Countdown: {{ i }}</li>
          @endfor
        </ol>

        <!-- Loop with step -->
        <ol id="even-numbers">
          @for (let i = 2; i <= 10; i += 2)
            <li>Even number: {{ i }}</li>
          @endfor
        </ol>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // First loop
    expect(outputHtml).toContain('<li class="number">Item 1</li>')
    expect(outputHtml).toContain('<li class="number">Item 2</li>')
    expect(outputHtml).toContain('<li class="number">Item 3</li>')

    // Descending loop
    expect(outputHtml).toContain('<li>Countdown: 5</li>')
    expect(outputHtml).toContain('<li>Countdown: 4</li>')
    expect(outputHtml).toContain('<li>Countdown: 3</li>')
    expect(outputHtml).toContain('<li>Countdown: 2</li>')
    expect(outputHtml).toContain('<li>Countdown: 1</li>')

    // Loop with step
    expect(outputHtml).toContain('<li>Even number: 2</li>')
    expect(outputHtml).toContain('<li>Even number: 4</li>')
    expect(outputHtml).toContain('<li>Even number: 6</li>')
    expect(outputHtml).toContain('<li>Even number: 8</li>')
    expect(outputHtml).toContain('<li>Even number: 10</li>')
  })

  // Test @forelse loops with @empty
  it('should process @forelse loops with @empty correctly', async () => {
    const testFile = await createTestFile('forelse.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Forelse Test</title>
        <script>
          module.exports = {
            emptyArray: [],
            filledArray: [1, 2, 3],
            nullArray: null,
            undefinedArray: undefined
          };
        </script>
      </head>
      <body>
        <div class="container">
          <h2>Empty Array:</h2>
          <ul class="empty-test">
            @forelse (emptyArray as item)
              <li>Item: {{ item }}</li>
            @empty
              <li class="empty-message">No items found</li>
            @endforelse
          </ul>

          <h2>Filled Array:</h2>
          <ul class="filled-test">
            @forelse (filledArray as item)
              <li>Item: {{ item }}</li>
            @empty
              <li class="empty-message">No items found</li>
            @endforelse
          </ul>

          <h2>Null Array:</h2>
          <ul class="null-test">
            @forelse (nullArray as item)
              <li>Item: {{ item }}</li>
            @empty
              <li class="null-message">Array is null</li>
            @endforelse
          </ul>

          <h2>Undefined Array:</h2>
          <ul class="undefined-test">
            @forelse (undefinedArray as item)
              <li>Item: {{ item }}</li>
            @empty
              <li class="undefined-message">Array is undefined</li>
            @endforelse
          </ul>
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

    // For the empty array, it should display the empty message
    expect(outputHtml).toContain('<li class="empty-message">No items found</li>')

    // For the filled array, it should show all items
    expect(outputHtml).toContain('<li>Item: 1</li>')
    expect(outputHtml).toContain('<li>Item: 2</li>')
    expect(outputHtml).toContain('<li>Item: 3</li>')

    // For null and undefined arrays, it should show the empty section
    expect(outputHtml).toContain('<li class="null-message">Array is null</li>')
    expect(outputHtml).toContain('<li class="undefined-message">Array is undefined</li>')
  })

  // Test complex data in @foreach
  it('should handle complex data in @foreach loops', async () => {
    const testFile = await createTestFile('foreach-complex.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Complex Foreach Test</title>
        <script>
          module.exports = {
            users: [
              { id: 1, name: "Alice", role: "admin" },
              { id: 2, name: "Bob", role: "user" },
              { id: 3, name: "Charlie", role: "editor" }
            ]
          };
        </script>
      </head>
      <body>
        <div class="users">
          @foreach (users as user)
            <div class="user" id="user-{{ user.id }}">
              <h3>{{ user.name }}</h3>
              <p>Role: {{ user.role }}</p>
            </div>
          @endforeach
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

    // Check for the user cards
    expect(outputHtml).toContain('<div class="user" id="user-1">')
    expect(outputHtml).toContain('<h3>Alice</h3>')
    expect(outputHtml).toContain('<p>Role: admin</p>')

    expect(outputHtml).toContain('<div class="user" id="user-2">')
    expect(outputHtml).toContain('<h3>Bob</h3>')
    expect(outputHtml).toContain('<p>Role: user</p>')

    expect(outputHtml).toContain('<div class="user" id="user-3">')
    expect(outputHtml).toContain('<h3>Charlie</h3>')
    expect(outputHtml).toContain('<p>Role: editor</p>')
  })

  // Test loop with index access
  it('should provide loop iteration values', async () => {
    const testFile = await createTestFile('loop-metadata.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Loop Iteration Test</title>
        <script>
          module.exports = {
            items: ["first", "second", "third"]
          };
        </script>
      </head>
      <body>
        <ul class="items">
          @foreach (items as item)
            <li>Item: {{ item }}</li>
          @endforeach
        </ul>

        <p>Total items: {{ items.length }}</p>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // Check that loops indexing works
    expect(outputHtml).toContain('Item: first')
    expect(outputHtml).toContain('Item: second')
    expect(outputHtml).toContain('Item: third')

    // Check loop metadata for total items
    expect(outputHtml).toContain('Total items: 3')
  })

  // Test @break in foreach loops
  it('should process @break in foreach loops', async () => {
    const testFile = await createTestFile('foreach-break.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Foreach Break Test</title>
        <script>
          module.exports = {
            numbers: [1, 2, 3, 4, 5]
          };
        </script>
      </head>
      <body>
        <ul id="numbers">
          @foreach (numbers as num)
            @if (num === 3)
              @break
            @endif
            <li>{{ num }}</li>
          @endforeach
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

    // Should only include 1 and 2, break at 3
    expect(outputHtml).toContain('<li>1</li>')
    expect(outputHtml).toContain('<li>2</li>')
    expect(outputHtml).not.toContain('<li>3</li>')
    expect(outputHtml).not.toContain('<li>4</li>')
    expect(outputHtml).not.toContain('<li>5</li>')
  })

  // Test @continue in foreach loops
  it('should process @continue in foreach loops', async () => {
    const testFile = await createTestFile('foreach-continue.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Foreach Continue Test</title>
        <script>
          module.exports = {
            numbers: [1, 2, 3, 4, 5]
          };
        </script>
      </head>
      <body>
        <ul id="numbers">
          @foreach (numbers as num)
            @if (num === 3)
              @continue
            @endif
            <li>{{ num }}</li>
          @endforeach
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

    // Should include all except 3
    expect(outputHtml).toContain('<li>1</li>')
    expect(outputHtml).toContain('<li>2</li>')
    expect(outputHtml).not.toContain('<li>3</li>')
    expect(outputHtml).toContain('<li>4</li>')
    expect(outputHtml).toContain('<li>5</li>')
  })

  // Test conditional @break(condition)
  it('should process @break(condition) in foreach loops', async () => {
    const testFile = await createTestFile('foreach-break-condition.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Foreach Break Condition Test</title>
        <script>
          module.exports = {
            numbers: [1, 2, 3, 4, 5]
          };
        </script>
      </head>
      <body>
        <ul id="numbers">
          @foreach (numbers as num)
            @break(num > 3)
            <li>{{ num }}</li>
          @endforeach
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

    // Should only include 1, 2, 3 (breaks when num > 3)
    expect(outputHtml).toContain('<li>1</li>')
    expect(outputHtml).toContain('<li>2</li>')
    expect(outputHtml).toContain('<li>3</li>')
    expect(outputHtml).not.toContain('<li>4</li>')
    expect(outputHtml).not.toContain('<li>5</li>')
  })

  // Test conditional @continue(condition)
  it('should process @continue(condition) in foreach loops', async () => {
    const testFile = await createTestFile('foreach-continue-condition.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Foreach Continue Condition Test</title>
        <script>
          module.exports = {
            numbers: [1, 2, 3, 4, 5]
          };
        </script>
      </head>
      <body>
        <ul id="numbers">
          @foreach (numbers as num)
            @continue(num % 2 === 0)
            <li>{{ num }}</li>
          @endforeach
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

    // Should only include odd numbers (skip even)
    expect(outputHtml).toContain('<li>1</li>')
    expect(outputHtml).not.toContain('<li>2</li>')
    expect(outputHtml).toContain('<li>3</li>')
    expect(outputHtml).not.toContain('<li>4</li>')
    expect(outputHtml).toContain('<li>5</li>')
  })

  // Test @break in @for loops
  it('should process @break in @for loops', async () => {
    const testFile = await createTestFile('for-break.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>For Break Test</title>
        <script>
          module.exports = {};
        </script>
      </head>
      <body>
        <ul id="numbers">
          @for (let i = 1; i <= 10; i++)
            @break(i > 5)
            <li>{{ i }}</li>
          @endfor
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

    // Should only include 1-5
    expect(outputHtml).toContain('<li>1</li>')
    expect(outputHtml).toContain('<li>5</li>')
    expect(outputHtml).not.toContain('<li>6</li>')
    expect(outputHtml).not.toContain('<li>10</li>')
  })

  // Test @continue in @for loops
  it('should process @continue in @for loops', async () => {
    const testFile = await createTestFile('for-continue.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>For Continue Test</title>
        <script>
          module.exports = {};
        </script>
      </head>
      <body>
        <ul id="numbers">
          @for (let i = 1; i <= 5; i++)
            @continue(i === 3)
            <li>{{ i }}</li>
          @endfor
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

    // Should include all except 3
    expect(outputHtml).toContain('<li>1</li>')
    expect(outputHtml).toContain('<li>2</li>')
    expect(outputHtml).not.toContain('<li>3</li>')
    expect(outputHtml).toContain('<li>4</li>')
    expect(outputHtml).toContain('<li>5</li>')
  })

  // Test @foreach with index syntax (index => item)
  it('should process @foreach with index => item syntax', async () => {
    const testFile = await createTestFile('foreach-index-syntax.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Foreach Index Syntax Test</title>
        <script>
          module.exports = {
            days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            sessions: [4, 5, 3, 6, 4]
          };
        </script>
      </head>
      <body>
        <!-- Basic index usage -->
        <ul id="indexed-list">
          @foreach (days as idx => day)
            <li data-index="{{ idx }}">{{ day }}</li>
          @endforeach
        </ul>

        <!-- Using index to access parallel array -->
        <ul id="parallel-list">
          @foreach (sessions as index => count)
            <li>{{ days[index] }}: {{ count }} sessions</li>
          @endforeach
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

    // Check basic index usage
    expect(outputHtml).toContain('<li data-index="0">Mon</li>')
    expect(outputHtml).toContain('<li data-index="1">Tue</li>')
    expect(outputHtml).toContain('<li data-index="2">Wed</li>')
    expect(outputHtml).toContain('<li data-index="3">Thu</li>')
    expect(outputHtml).toContain('<li data-index="4">Fri</li>')

    // Check parallel array access
    expect(outputHtml).toContain('<li>Mon: 4 sessions</li>')
    expect(outputHtml).toContain('<li>Tue: 5 sessions</li>')
    expect(outputHtml).toContain('<li>Wed: 3 sessions</li>')
    expect(outputHtml).toContain('<li>Thu: 6 sessions</li>')
    expect(outputHtml).toContain('<li>Fri: 4 sessions</li>')
  })

  it('should handle @forelse with simple arrays', async () => {
    const testFile = await createTestFile('forelse-basic-fix.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Forelse Basic</title>
        <script>
          module.exports = {
            items: ['apple', 'banana', 'cherry'],
            emptyList: []
          };
        </script>
      </head>
      <body>
        <ul>
        @forelse (items as item)
          <li>{{ item }}</li>
        @empty
          <li>No items</li>
        @endforelse
        </ul>

        <div id="empty">
        @forelse (emptyList as item)
          <span>{{ item }}</span>
        @empty
          <p>Empty list</p>
        @endforelse
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
    expect(outputHtml).toContain('<li>apple</li>')
    expect(outputHtml).toContain('<li>banana</li>')
    expect(outputHtml).toContain('<li>cherry</li>')
    expect(outputHtml).not.toContain('No items')
    expect(outputHtml).toContain('<p>Empty list</p>')
  })

  it('should handle nested @forelse blocks', async () => {
    const testFile = await createTestFile('forelse-nested-fix.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nested Forelse</title>
        <script>
          module.exports = {
            groups: [
              { name: 'A', members: ['x', 'y'] },
              { name: 'B', members: [] }
            ]
          };
        </script>
      </head>
      <body>
        @forelse (groups as group)
          <div class="group">{{ group.name }}:
            @forelse (group.members as member)
              <span class="member">{{ member }}</span>
            @empty
              <span class="empty">No members</span>
            @endforelse
          </div>
        @empty
          <p>No groups</p>
        @endforelse
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)
    expect(outputHtml).toContain('A:')
    expect(outputHtml).toContain('<span class="member">x</span>')
    expect(outputHtml).toContain('<span class="member">y</span>')
    expect(outputHtml).toContain('B:')
    expect(outputHtml).toContain('<span class="empty">No members</span>')
    expect(outputHtml).not.toContain('No groups')
  })

  it('should handle @forelse with complex expressions containing parentheses', async () => {
    const testFile = await createTestFile('forelse-parens-fix.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Forelse Parens</title>
        <script>
          module.exports = {
            items: [
              { name: 'alpha', active: true },
              { name: 'beta', active: false },
              { name: 'gamma', active: true }
            ]
          };
        </script>
      </head>
      <body>
        @forelse (items.filter(i => i.active) as item)
          <p class="active">{{ item.name }}</p>
        @empty
          <p>None active</p>
        @endforelse
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)
    expect(outputHtml).toContain('<p class="active">alpha</p>')
    expect(outputHtml).toContain('<p class="active">gamma</p>')
    expect(outputHtml).not.toContain('beta')
    expect(outputHtml).not.toContain('None active')
  })

  it('should show @empty content when @forelse array is empty', async () => {
    const testFile = await createTestFile('forelse-empty-fix.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Forelse Empty</title>
        <script>
          module.exports = { results: [] };
        </script>
      </head>
      <body>
        @forelse (results as result)
          <p>{{ result }}</p>
        @empty
          <p class="no-results">No results found.</p>
        @endforelse
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)
    expect(outputHtml).toContain('<p class="no-results">No results found.</p>')
  })

  it('should handle @forelse nested inside @if', async () => {
    const testFile = await createTestFile('forelse-in-if-fix.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Forelse in If</title>
        <script>
          module.exports = { showList: true, items: ['one', 'two'] };
        </script>
      </head>
      <body>
        @if (showList)
          @forelse (items as item)
            <p>{{ item }}</p>
          @empty
            <p>Empty</p>
          @endforelse
        @else
          <p>Hidden</p>
        @endif
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)
    expect(outputHtml).toContain('<p>one</p>')
    expect(outputHtml).toContain('<p>two</p>')
    expect(outputHtml).not.toContain('Empty')
    expect(outputHtml).not.toContain('Hidden')
  })

  it('should handle multiple @forelse blocks efficiently', async () => {
    const testFile = await createTestFile('forelse-perf-fix.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Forelse Perf</title>
      <script>
        module.exports = { list1: ['a', 'b'], list2: [], list3: ['x'] };
      </script>
      </head>
      <body>
        @forelse (list1 as item)
          <p class="l1">{{ item }}</p>
        @empty
          <p>Empty 1</p>
        @endforelse
        @forelse (list2 as item)
          <p class="l2">{{ item }}</p>
        @empty
          <p class="e2">Empty 2</p>
        @endforelse
        @forelse (list3 as item)
          <p class="l3">{{ item }}</p>
        @empty
          <p>Empty 3</p>
        @endforelse
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const html = await getHtmlOutput(result)
    expect(html).toContain('<p class="l1">a</p>')
    expect(html).toContain('<p class="l1">b</p>')
    expect(html).not.toContain('Empty 1')
    expect(html).toContain('<p class="e2">Empty 2</p>')
    expect(html).toContain('<p class="l3">x</p>')
    expect(html).not.toContain('Empty 3')
  })

  it('should handle nested @foreach inside @forelse', async () => {
    const testFile = await createTestFile('forelse-foreach-nested-fix.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Nested Foreach</title>
      <script>
        module.exports = {
          groups: [
            { name: 'G1', items: ['a', 'b'] },
            { name: 'G2', items: [] }
          ]
        };
      </script>
      </head>
      <body>
        @forelse (groups as group)
          <div>{{ group.name }}
            @foreach(group.items as item)
              <span>{{ item }}</span>
            @endforeach
          </div>
        @empty
          <p>No groups</p>
        @endforelse
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const html = await getHtmlOutput(result)
    expect(html).toContain('G1')
    expect(html).toContain('<span>a</span>')
    expect(html).toContain('<span>b</span>')
    expect(html).toContain('G2')
    expect(html).not.toContain('No groups')
  })

  it('should handle @for with @can inside loop body', async () => {
    const template = `@for(let i = 0; i < 2; i++)
@can('view')<span>visible-{{ i }}</span>@endcan
@endfor`
    const result = await processTemplate(template, {
      auth: { check: true },
      userCan: { view: true },
    })
    expect(result).toContain('visible-0')
    expect(result).toContain('visible-1')
  })

  it('should handle @foreach with safe expressions and conditionals', async () => {
    const template = `@foreach(items as item)
@if(item.active)
<div>{{ item.name }}</div>
@endif
@endforeach`
    const result = await processTemplate(template, {
      items: [
        { name: 'Alice', active: true },
        { name: 'Bob', active: false },
        { name: 'Carol', active: true },
      ],
    })
    expect(result).toContain('Alice')
    expect(result).not.toContain('Bob')
    expect(result).toContain('Carol')
  })

  describe('@break/@continue with balanced parentheses', () => {
    it('should handle @break with nested parentheses', async () => {
      const testFile = await createTestFile('break-nested-parens.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>Break Test</title>
        <script>
          module.exports = { items: [1, 2, 3, 4, 5] };
        </script>
        </head>
        <body>
          @foreach(items as item)
            @break(item > 3)
            <p>{{ item }}</p>
          @endforeach
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const html = await getHtmlOutput(result)
      expect(html).toContain('<p>1</p>')
      expect(html).toContain('<p>2</p>')
      expect(html).toContain('<p>3</p>')
      expect(html).not.toContain('<p>4</p>')
      expect(html).not.toContain('<p>5</p>')
    })

    it('should handle @continue with condition', async () => {
      const testFile = await createTestFile('continue-condition.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>Continue Test</title>
        <script>
          module.exports = { items: [1, 2, 3, 4, 5] };
        </script>
        </head>
        <body>
          @foreach(items as item)
            @continue(item === 3)
            <p>{{ item }}</p>
          @endforeach
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const html = await getHtmlOutput(result)
      expect(html).toContain('<p>1</p>')
      expect(html).toContain('<p>2</p>')
      expect(html).not.toContain('<p>3</p>')
      expect(html).toContain('<p>4</p>')
      expect(html).toContain('<p>5</p>')
    })
  })

  describe('@each directive', () => {
    it('should render @each with items', async () => {
      await createTestFile('partials/list-item.stx', '<li>{{ item }}</li>')

      const testFile = await createTestFile('each-test.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>Each Test</title>
        <script>
          module.exports = { fruits: ['apple', 'banana', 'cherry'] };
        </script>
        </head>
        <body>
          <ul>
            @each('list-item', fruits, 'item')
          </ul>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin({ partialsDir: path.join(TEMP_DIR, 'partials') })],
      })

      const html = await getHtmlOutput(result)
      expect(html).toContain('<li>apple</li>')
      expect(html).toContain('<li>banana</li>')
      expect(html).toContain('<li>cherry</li>')
    })
  })
})
