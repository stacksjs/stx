import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'

// Setup test directories
const TEST_DIR = import.meta.dir
const TEMPLATE_DIR = path.join(TEST_DIR, 'templates')
const OUTPUT_DIR = path.join(TEST_DIR, 'out')

// DOM globals are provided by happy-dom registration

describe('stx DOM Interaction Tests', () => {
  // Set up test environment
  beforeAll(async () => {
    await fs.promises.mkdir(TEMPLATE_DIR, { recursive: true })
    await fs.promises.mkdir(OUTPUT_DIR, { recursive: true })

    // Create test template with form and interactive elements
    await Bun.write(path.join(TEMPLATE_DIR, 'interactive.stx'), `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Interactive stx Demo</title>
        <script>
          module.exports = {
            buttonText: "Click Me",
            placeholderText: "Enter your name",
            items: ["Item 1", "Item 2", "Item 3"],
            selected: "Item 2"
          };
        </script>
      </head>
      <body>
        <h1>Interactive Demo</h1>

        <form id="test-form">
          <input
            type="text"
            id="name-input"
            placeholder="{{ placeholderText }}"
            value=""
          />

          <select id="item-select">
            @foreach(items as item)
              <option value="{{ item }}" @if(item === selected)selected@endif>
                {{ item }}
              </option>
            @endforeach
          </select>

          <button type="button" id="submit-button">{{ buttonText }}</button>
        </form>

        <div id="output"></div>
      </body>
      </html>
    `)
  })

  // Clean up after tests
  afterAll(async () => {
    try {
      await fs.promises.rm(TEMPLATE_DIR, { recursive: true, force: true })
      await fs.promises.rm(OUTPUT_DIR, { recursive: true, force: true })
    }
    catch (error) {
      console.error('Error cleaning up test directories:', error)
    }
  })

  test('should render form elements correctly with stx variables', async () => {
    const template = path.join(TEMPLATE_DIR, 'interactive.stx')

    // Build the template
    const result = await Bun.build({
      entrypoints: [template],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    expect(result.success).toBe(true)

    // Get the HTML output
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    expect(htmlOutput).toBeDefined()

    const html = await Bun.file(htmlOutput!.path).text()

    // Set HTML in document
    document.body.innerHTML = html

    // Test the form elements
    const button = document.getElementById('submit-button')
    expect(button?.textContent).toBe('Click Me')
    expect(button?.tagName).toBe('BUTTON')

    const input = document.getElementById('name-input') as HTMLInputElement
    expect(input).toBeDefined()
    expect(input?.placeholder).toBe('Enter your name')
    expect(input?.value).toBe('')

    const select = document.getElementById('item-select') as HTMLSelectElement
    expect(select).toBeDefined()
    expect(select?.options.length).toBe(3)

    // Test that the correct option is selected
    expect(select?.value).toBe('Item 2')
    expect(select?.selectedIndex).toBe(1)
  })

  test('should support DOM interaction with rendered elements', async () => {
    const template = path.join(TEMPLATE_DIR, 'interactive.stx')

    // Build the template
    const result = await Bun.build({
      entrypoints: [template],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    const html = await Bun.file(htmlOutput!.path).text()

    // Set HTML in document
    document.body.innerHTML = html

    // Reference elements
    const button = document.getElementById('submit-button') as HTMLButtonElement
    const input = document.getElementById('name-input') as HTMLInputElement
    const select = document.getElementById('item-select') as HTMLSelectElement
    const output = document.getElementById('output') as HTMLDivElement

    // Simulate user interactions
    input.value = 'Test User'

    // Change select value
    select.value = 'Item 3'
    select.__dispatchEvent_safe(new Event('change'))

    // Add click event handler to button
    button.addEventListener('click', () => {
      const selectedItem = select.value
      const userName = input.value
      output.textContent = `Hello ${userName}, you selected ${selectedItem}`
    })

    // Simulate button click
    button.click()

    // Verify the output
    expect(output.textContent).toBe('Hello Test User, you selected Item 3')
  })

  test('should work with event listeners and dynamic content', async () => {
    // Create a new template with event support
    const eventTemplate = path.join(TEMPLATE_DIR, 'events.stx')
    await Bun.write(eventTemplate, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Events Test</title>
        <script>
          module.exports = {
            count: 0,
            items: []
          };
        </script>
      </head>
      <body>
        <div class="counter">
          <span id="count">{{ count }}</span>
          <button id="increment">+</button>
          <button id="decrement">-</button>
        </div>

        <div class="items">
          <input type="text" id="new-item" placeholder="Add item" />
          <button id="add-item">Add</button>
          <ul id="item-list">
            @foreach(items as item)
              <li>{{ item }}</li>
            @endforeach
          </ul>
        </div>
      </body>
      </html>
    `)

    // Build the template
    const result = await Bun.build({
      entrypoints: [eventTemplate],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    const html = await Bun.file(htmlOutput!.path).text()

    // Set HTML in document
    document.body.innerHTML = html

    // Get elements
    const countElement = document.getElementById('count') as HTMLSpanElement
    const incrementButton = document.getElementById('increment') as HTMLButtonElement
    const decrementButton = document.getElementById('decrement') as HTMLButtonElement
    const newItemInput = document.getElementById('new-item') as HTMLInputElement
    const addItemButton = document.getElementById('add-item') as HTMLButtonElement
    const itemList = document.getElementById('item-list') as HTMLUListElement

    // Set up counter functionality
    let count = 0

    incrementButton.addEventListener('click', () => {
      count++
      countElement.textContent = count.toString()
    })

    decrementButton.addEventListener('click', () => {
      count--
      countElement.textContent = count.toString()
    })

    // Set up item list functionality
    addItemButton.addEventListener('click', () => {
      const itemText = newItemInput.value.trim()
      if (itemText) {
        const li = document.createElement('li')
        li.textContent = itemText
        itemList.appendChild(li)
        newItemInput.value = ''
      }
    })

    // Test counter
    expect(countElement.textContent).toBe('0')

    incrementButton.click()
    incrementButton.click()
    expect(countElement.textContent).toBe('2')

    decrementButton.click()
    expect(countElement.textContent).toBe('1')

    // Test adding items
    expect(itemList.children.length).toBe(0)

    newItemInput.value = 'First Item'
    addItemButton.click()
    expect(itemList.children.length).toBe(1)
    expect(itemList.children[0].textContent).toBe('First Item')

    newItemInput.value = 'Second Item'
    addItemButton.click()
    expect(itemList.children.length).toBe(2)
    expect(itemList.children[1].textContent).toBe('Second Item')
  })
})
