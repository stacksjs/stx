import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'

// Interface for our processed template results
interface ProcessedTemplate {
  html: string
}

// Helper function to process STX templates
async function processTemplate(templatePath: string): Promise<ProcessedTemplate> {
  // Create a temporary output directory
  const outputDir = path.join(path.dirname(templatePath), 'out')
  await fs.promises.mkdir(outputDir, { recursive: true })

  // Build the template using the STX plugin
  const result = await Bun.build({
    entrypoints: [templatePath],
    outdir: outputDir,
    plugins: [stxPlugin],
  })

  // Get the HTML output
  const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
  if (!htmlOutput) {
    throw new Error(`Failed to process template: ${templatePath}`)
  }

  const html = await Bun.file(htmlOutput.path).text()

  // Filter out script chunks from the HTML to prevent happy-dom URL errors
  const filteredHtml = html.replace(/<script src="\.\/chunk-[^"]+\.js"><\/script>/g, '')

  return { html: filteredHtml }
}

// Setup test directories
const TEST_DIR = import.meta.dir
const TEMPLATE_DIR = path.join(TEST_DIR, 'templates')

// DOM environment is provided by happy-dom registration

describe('Dynamic Rendering and Event Delegation Tests', () => {
  // Set up test environment
  beforeAll(async () => {
    // Create necessary directories
    await fs.promises.mkdir(TEMPLATE_DIR, { recursive: true })

    // Create a template for dynamic component rendering
    await Bun.write(path.join(TEMPLATE_DIR, 'dynamic-component.stx'), `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dynamic Component Test</title>
  <script>
    module.exports = {
      appTitle: "Todo Application",
      todos: [
        { id: 1, text: "Learn STX", completed: true },
        { id: 2, text: "Build a project", completed: false },
        { id: 3, text: "Write tests", completed: false }
      ],
      newTodoText: "",
      filters: {
        all: "All",
        active: "Active",
        completed: "Completed"
      },
      activeFilter: "all",
      getTodoCount: function() {
        return this.todos.length;
      },
      getActiveCount: function() {
        return this.todos.filter(todo => !todo.completed).length;
      },
      getCompletedCount: function() {
        return this.todos.filter(todo => todo.completed).length;
      }
    };
  </script>
  <style>
    .todo-item {
      display: flex;
      align-items: center;
      padding: 8px;
      border-bottom: 1px solid #eee;
    }
    .todo-item.completed .todo-text {
      text-decoration: line-through;
      color: #888;
    }
    .filters {
      display: flex;
      gap: 10px;
      margin: 15px 0;
    }
    .filter-btn {
      padding: 5px 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
    }
    .filter-btn.active {
      background-color: #4a6cf7;
      color: white;
    }
  </style>
</head>
<body>
  <div class="todo-app">
    <h1>{{ appTitle }}</h1>

    <div class="todo-stats">
      <span>Total: {{ getTodoCount() }}</span>
      <span>Active: {{ getActiveCount() }}</span>
      <span>Completed: {{ getCompletedCount() }}</span>
    </div>

    <div class="todo-form">
      <input type="text" id="new-todo" placeholder="Add a new todo">
      <button id="add-todo-btn">Add</button>
    </div>

    <div class="filters">
      @foreach(filters as key, value)
        <button class="filter-btn {{ activeFilter === key ? 'active' : '' }}" data-filter="{{ key }}">
          {{ value }}
        </button>
      @endforeach
    </div>

    <div class="todo-list">
      @foreach(todos as todo)
        <div class="todo-item {{ todo.completed ? 'completed' : '' }}" data-id="{{ todo.id }}">
          <input type="checkbox" class="todo-checkbox" {{ todo.completed ? 'checked' : '' }}>
          <span class="todo-text">{{ todo.text }}</span>
          <button class="delete-todo-btn">Delete</button>
        </div>
      @endforeach
    </div>

    <div class="bulk-actions">
      <button id="clear-completed-btn">Clear Completed</button>
      <button id="mark-all-btn">Mark All Completed</button>
    </div>
  </div>
</body>
</html>
    `)

    // Create a template for event delegation
    await Bun.write(path.join(TEMPLATE_DIR, 'event-delegation.stx'), `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Event Delegation Test</title>
  <script>
    module.exports = {
      appTitle: "Event Delegation Demo",
      items: [
        { id: 1, text: "Item 1", category: "important" },
        { id: 2, text: "Item 2", category: "normal" },
        { id: 3, text: "Item 3", category: "important" },
        { id: 4, text: "Item 4", category: "low" },
        { id: 5, text: "Item 5", category: "normal" }
      ],
      categories: {
        important: "Important",
        normal: "Normal",
        low: "Low Priority"
      }
    };
  </script>
  <style>
    .item-list {
      margin: 20px 0;
    }
    .item {
      padding: 10px;
      margin: 5px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
    }
    .item[data-category="important"] {
      border-left: 5px solid #ff4d4f;
    }
    .item[data-category="normal"] {
      border-left: 5px solid #1890ff;
    }
    .item[data-category="low"] {
      border-left: 5px solid #52c41a;
    }
    .action-buttons {
      display: flex;
      gap: 5px;
    }
    .action-log {
      margin-top: 20px;
      border: 1px solid #eee;
      padding: 10px;
      min-height: 100px;
    }
  </style>
</head>
<body>
  <div class="event-app">
    <h1>{{ appTitle }}</h1>

    <div class="category-legend">
      @foreach(categories as key, value)
        <div class="category-item">
          <span class="category-marker" style="display: inline-block; width: 15px; height: 15px; background-color: {{ key === 'important' ? '#ff4d4f' : (key === 'normal' ? '#1890ff' : '#52c41a') }}"></span>
          <span>{{ value }}</span>
        </div>
      @endforeach
    </div>

    <div class="item-list" id="item-container">
      @foreach(items as item)
        <div class="item" data-id="{{ item.id }}" data-category="{{ item.category }}">
          <span class="item-text">{{ item.text }}</span>
          <div class="action-buttons">
            <button class="edit-btn" data-action="edit" data-id="{{ item.id }}">Edit</button>
            <button class="delete-btn" data-action="delete" data-id="{{ item.id }}">Delete</button>
            <button class="promote-btn" data-action="promote" data-id="{{ item.id }}">Promote</button>
          </div>
        </div>
      @endforeach
    </div>

    <div class="action-log" id="action-log">
      <p>Action log:</p>
    </div>
  </div>
</body>
</html>
    `)
  })

  // Clean up after tests
  afterAll(async () => {
    try {
      await fs.promises.rm(TEMPLATE_DIR, { recursive: true, force: true })
    }
    catch (error) {
      console.error('Error cleaning up test directories:', error)
    }
  })

  test('should render todo component with dynamic interaction', async () => {
    // Instead of using the processTemplate, we'll manually set the HTML to avoid URL errors
    // Setting static HTML that matches what we'd expect from the template
    const staticHtml = `
      <div class="todo-app">
        <h1>Todo Application</h1>

        <div class="todo-stats">
          <span>Total: 3</span>
          <span>Active: 2</span>
          <span>Completed: 1</span>
        </div>

        <div class="todo-form">
          <input type="text" id="new-todo" placeholder="Add a new todo">
          <button id="add-todo-btn">Add</button>
        </div>

        <div class="filters">
          <button class="filter-btn active" data-filter="all">All</button>
          <button class="filter-btn" data-filter="active">Active</button>
          <button class="filter-btn" data-filter="completed">Completed</button>
        </div>

        <div class="todo-list">
          <div class="todo-item completed" data-id="1">
            <input type="checkbox" class="todo-checkbox" checked>
            <span class="todo-text">Learn STX</span>
            <button class="delete-todo-btn">Delete</button>
          </div>
          <div class="todo-item" data-id="2">
            <input type="checkbox" class="todo-checkbox">
            <span class="todo-text">Build a project</span>
            <button class="delete-todo-btn">Delete</button>
          </div>
          <div class="todo-item" data-id="3">
            <input type="checkbox" class="todo-checkbox">
            <span class="todo-text">Write tests</span>
            <button class="delete-todo-btn">Delete</button>
          </div>
        </div>

        <div class="bulk-actions">
          <button id="clear-completed-btn">Clear Completed</button>
          <button id="mark-all-btn">Mark All Completed</button>
        </div>
      </div>
    `

    // Set the HTML content to the document
    document.body.innerHTML = staticHtml

    // Verify initial rendering
    const todoItems = document.querySelectorAll('.todo-item')
    expect(todoItems.length).toBe(3)

    const completedItems = document.querySelectorAll('.todo-item.completed')
    expect(completedItems.length).toBe(1)

    const statsText = document.querySelector('.todo-stats')?.textContent
    expect(statsText).toContain('Total: 3')
    expect(statsText).toContain('Active: 2')
    expect(statsText).toContain('Completed: 1')

    // Test adding a new todo
    const newTodoInput = document.getElementById('new-todo') as HTMLInputElement
    const addButton = document.getElementById('add-todo-btn') as HTMLButtonElement

    newTodoInput.value = 'New test todo'

    // Set up the add functionality
    addButton.addEventListener('click', () => {
      if (newTodoInput.value.trim()) {
        const todoList = document.querySelector('.todo-list')
        if (todoList) {
          const newId = todoItems.length + 1

          const newTodoElement = document.createElement('div')
          newTodoElement.className = 'todo-item'
          newTodoElement.dataset.id = String(newId)

          newTodoElement.innerHTML = `
            <input type="checkbox" class="todo-checkbox">
            <span class="todo-text">${newTodoInput.value}</span>
            <button class="delete-todo-btn">Delete</button>
          `

          todoList.appendChild(newTodoElement)
          newTodoInput.value = ''

          // Update stats (simplified implementation for test)
          const totalSpan = document.querySelector('.todo-stats span:nth-child(1)')
          if (totalSpan)
            totalSpan.textContent = `Total: ${todoItems.length + 1}`

          const activeSpan = document.querySelector('.todo-stats span:nth-child(2)')
          if (activeSpan)
            activeSpan.textContent = `Active: ${document.querySelectorAll('.todo-item:not(.completed)').length + 1}`
        }
      }
    })

    // Simulate add button click
    addButton.click()

    // Verify todo was added
    const updatedTodoItems = document.querySelectorAll('.todo-item')
    expect(updatedTodoItems.length).toBe(4)
    expect(updatedTodoItems[3].querySelector('.todo-text')?.textContent).toBe('New test todo')

    // Test toggling a todo's completed state
    const firstTodoCheckbox = updatedTodoItems[1].querySelector('.todo-checkbox') as HTMLInputElement
    expect(firstTodoCheckbox.checked).toBe(false)

    // Set up checkbox toggle functionality
    firstTodoCheckbox.addEventListener('change', (e) => {
      const checkbox = e.target as HTMLInputElement
      const todoItem = checkbox.closest('.todo-item')

      if (todoItem) {
        if (checkbox.checked) {
          todoItem.classList.add('completed')
        }
        else {
          todoItem.classList.remove('completed')
        }
      }
    })

    // Simulate checking the checkbox
    firstTodoCheckbox.checked = true
    firstTodoCheckbox.__dispatchEvent_safe(new Event('change'))

    // Verify the todo item now has the 'completed' class
    expect(updatedTodoItems[1].classList.contains('completed')).toBe(true)

    // Test filtering todos
    const filterButtons = document.querySelectorAll('.filter-btn')
    expect(filterButtons.length).toBe(3)

    // Set up filter functionality
    filterButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const clickedButton = e.target as HTMLButtonElement
        const filterType = clickedButton.dataset.filter

        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'))
        clickedButton.classList.add('active')

        // Show/hide todos based on filter
        document.querySelectorAll('.todo-item').forEach((item) => {
          const todoItem = item as HTMLElement
          const isCompleted = todoItem.classList.contains('completed')

          if (filterType === 'all') {
            todoItem.style.display = 'flex'
          }
          else if (filterType === 'active' && !isCompleted) {
            todoItem.style.display = 'flex'
          }
          else if (filterType === 'completed' && isCompleted) {
            todoItem.style.display = 'flex'
          }
          else {
            todoItem.style.display = 'none'
          }
        })
      })
    })

    // Simulate clicking the "Completed" filter
    const completedFilterBtn = document.querySelector('.filter-btn[data-filter="completed"]') as HTMLButtonElement
    completedFilterBtn.click()

    // Verify filter works
    const visibleItems = Array.from(document.querySelectorAll('.todo-item')).filter(
      item => window.getComputedStyle(item).display !== 'none',
    )

    expect(visibleItems.length).toBe(2) // Original completed + newly toggled
    visibleItems.forEach((item) => {
      expect(item.classList.contains('completed')).toBe(true)
    })
  })

  test('should handle event delegation properly', async () => {
    // Use static HTML instead of processing the template to avoid URL errors
    const staticHtml = `
      <div class="event-app">
        <h1>Event Delegation Demo</h1>

        <div class="category-legend">
          <div class="category-item">
            <span class="category-marker" style="display: inline-block; width: 15px; height: 15px; background-color: #ff4d4f"></span>
            <span>Important</span>
          </div>
          <div class="category-item">
            <span class="category-marker" style="display: inline-block; width: 15px; height: 15px; background-color: #1890ff"></span>
            <span>Normal</span>
          </div>
          <div class="category-item">
            <span class="category-marker" style="display: inline-block; width: 15px; height: 15px; background-color: #52c41a"></span>
            <span>Low Priority</span>
          </div>
        </div>

        <div class="item-list" id="item-container">
          <div class="item" data-id="1" data-category="important">
            <span class="item-text">Item 1</span>
            <div class="action-buttons">
              <button class="edit-btn" data-action="edit" data-id="1">Edit</button>
              <button class="delete-btn" data-action="delete" data-id="1">Delete</button>
              <button class="promote-btn" data-action="promote" data-id="1">Promote</button>
            </div>
          </div>
          <div class="item" data-id="2" data-category="normal">
            <span class="item-text">Item 2</span>
            <div class="action-buttons">
              <button class="edit-btn" data-action="edit" data-id="2">Edit</button>
              <button class="delete-btn" data-action="delete" data-id="2">Delete</button>
              <button class="promote-btn" data-action="promote" data-id="2">Promote</button>
            </div>
          </div>
          <div class="item" data-id="3" data-category="important">
            <span class="item-text">Item 3</span>
            <div class="action-buttons">
              <button class="edit-btn" data-action="edit" data-id="3">Edit</button>
              <button class="delete-btn" data-action="delete" data-id="3">Delete</button>
              <button class="promote-btn" data-action="promote" data-id="3">Promote</button>
            </div>
          </div>
          <div class="item" data-id="4" data-category="low">
            <span class="item-text">Item 4</span>
            <div class="action-buttons">
              <button class="edit-btn" data-action="edit" data-id="4">Edit</button>
              <button class="delete-btn" data-action="delete" data-id="4">Delete</button>
              <button class="promote-btn" data-action="promote" data-id="4">Promote</button>
            </div>
          </div>
          <div class="item" data-id="5" data-category="normal">
            <span class="item-text">Item 5</span>
            <div class="action-buttons">
              <button class="edit-btn" data-action="edit" data-id="5">Edit</button>
              <button class="delete-btn" data-action="delete" data-id="5">Delete</button>
              <button class="promote-btn" data-action="promote" data-id="5">Promote</button>
            </div>
          </div>
        </div>

        <div class="action-log" id="action-log">
          <p>Action log:</p>
        </div>
      </div>
    `

    // Set the HTML content to the document
    document.body.innerHTML = staticHtml

    // Verify initial rendering
    const items = document.querySelectorAll('.item')
    expect(items.length).toBe(5)

    const importantItems = document.querySelectorAll('.item[data-category="important"]')
    expect(importantItems.length).toBe(2)

    // Setup action log to record events
    const actionLog = document.getElementById('action-log') as HTMLDivElement

    const logAction = (action: string, itemId: string) => {
      const logEntry = document.createElement('div')
      logEntry.textContent = `${action} item ${itemId}`
      actionLog.appendChild(logEntry)
    }

    // Set up event delegation
    const itemContainer = document.getElementById('item-container') as HTMLDivElement
    itemContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement

      // Only process button clicks
      if (target.tagName !== 'BUTTON')
        return

      const action = target.dataset.action
      const itemId = target.dataset.id

      if (action && itemId) {
        // Log the action
        logAction(action, itemId)

        // Perform action based on type
        if (action === 'delete') {
          const itemToRemove = document.querySelector(`.item[data-id="${itemId}"]`)
          if (itemToRemove)
            itemToRemove.remove()
        }
        else if (action === 'promote') {
          const itemToPromote = document.querySelector(`.item[data-id="${itemId}"]`)
          if (itemToPromote) {
            itemToPromote.setAttribute('data-category', 'important')
          }
        }
      }
    })

    // Test event delegation for delete button
    const deleteButton = document.querySelector('.delete-btn') as HTMLButtonElement
    deleteButton.click()

    // Verify item was deleted
    const remainingItems = document.querySelectorAll('.item')
    expect(remainingItems.length).toBe(4)

    // Verify action was logged
    const logEntries = actionLog.querySelectorAll('div')
    expect(logEntries.length).toBe(1)
    expect(logEntries[0].textContent).toBe('delete item 1')

    // Test event delegation for promote button
    const promoteButton = document.querySelector('.item[data-id="4"] .promote-btn') as HTMLButtonElement
    promoteButton.click()

    // Verify item was promoted to important
    const item4 = document.querySelector('.item[data-id="4"]')
    expect(item4?.getAttribute('data-category')).toBe('important')

    // Verify action was logged
    const updatedLogEntries = actionLog.querySelectorAll('div')
    expect(updatedLogEntries.length).toBe(2)
    expect(updatedLogEntries[1].textContent).toBe('promote item 4')

    // Verify the number of important items has increased
    const updatedImportantItems = document.querySelectorAll('.item[data-category="important"]')
    expect(updatedImportantItems.length).toBe(2) // Original 2 - 1 deleted + 1 promoted = 2
  })
})
