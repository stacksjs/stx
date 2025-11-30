import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs } from '../utils'

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
})
