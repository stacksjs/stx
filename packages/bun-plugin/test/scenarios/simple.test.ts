import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import plugin from '../../src/index'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-scenarios')
const OUTPUT_DIR = path.join(TEMP_DIR, 'dist')

describe('BUN-PLUGIN: Simple Scenario Tests', () => {
  beforeEach(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })
    await fs.promises.mkdir(OUTPUT_DIR, { recursive: true })
  })

  afterEach(async () => {
    await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
  })

  test('should process basic variable substitution', async () => {
    const testFile = path.join(TEMP_DIR, 'variables.stx')
    await Bun.write(testFile, `<script>
  const title = "Hello World";
  const description = "Welcome to stx templating";
        const author = {
    name: "John Doe",
    email: "john@example.com"
  };

  module.exports = { title, description, author };
</script>

<!DOCTYPE html>
<html>
<head>
  <title>{{ title }}</title>
  <meta name="description" content="{{ description }}">
</head>
<body>
  <h1>{{ title }}</h1>
  <p>{{ description }}</p>
  <footer>
    <p>Created by {{ author.name }} ({{ author.email }})</p>
  </footer>
</body>
</html>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    expect(content).toContain('<title>Hello World</title>')
    expect(content).toContain('content="Welcome to stx templating"')
    expect(content).toContain('<h1>Hello World</h1>')
    expect(content).toContain('<p>Welcome to stx templating</p>')
    expect(content).toContain('<p>Created by John Doe (john@example.com)</p>')
  })

  test('should process conditional rendering', async () => {
    const testFile = path.join(TEMP_DIR, 'conditionals.stx')
    await Bun.write(testFile, `<script>
  export const user = {
    name: "Alice",
    isLoggedIn: true,
    role: "admin",
    hasNotifications: true,
    notificationCount: 3
  };

  const showWelcome = true;
</script>

<div class="app">
  @if (showWelcome)
    <div class="welcome-banner">
      <h1>Welcome to the App!</h1>
    </div>
  @endif

  @if (user.isLoggedIn)
    <div class="user-info">
      <h2>Hello, {{ user.name }}!</h2>

      @if (user.role === 'admin')
        <span class="badge admin">Administrator</span>
      @elseif (user.role === 'moderator')
        <span class="badge mod">Moderator</span>
      @else
        <span class="badge user">User</span>
      @endif

      @if (user.hasNotifications)
        <div class="notifications">
          <p>You have {{ user.notificationCount }} new notifications</p>
        </div>
      @endif
    </div>
  @else
    <div class="login-prompt">
      <p>Please log in to continue</p>
    </div>
  @endif
</div>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    expect(content).toContain('<div class="welcome-banner">')
    expect(content).toContain('<h1>Welcome to the App!</h1>')
    expect(content).toContain('<h2>Hello, Alice!</h2>')
    expect(content).toContain('<span class="badge admin">Administrator</span>')
    expect(content).toContain('<div class="notifications">')
    expect(content).toContain('<p>You have 3 new notifications</p>')
    expect(content).not.toContain('<div class="login-prompt">')
  })

  test('should process loop rendering', async () => {
    const testFile = path.join(TEMP_DIR, 'loops.stx')
    await Bun.write(testFile, `<script>
  export const products = [
    { id: 1, name: "Laptop", price: "999.99", inStock: true },
    { id: 2, name: "Mouse", price: "29.99", inStock: true },
    { id: 3, name: "Keyboard", price: "79.99", inStock: false },
    { id: 4, name: "Monitor", price: "299.99", inStock: true }
  ];

  const categories = ["Electronics", "Accessories", "Software"];

  const numbers = [1, 2, 3, 4, 5];
</script>

<div class="catalog">
  <h1>Product Catalog</h1>

  <section class="categories">
    <h2>Categories</h2>
    <ul>
      @foreach (categories as category)
        <li>{{ category }}</li>
      @endforeach
    </ul>
  </section>

  <section class="products">
    <h2>Products</h2>
    <div class="product-grid">
      @foreach (products as product)
        <div class="product-card {{ product.inStock ? 'in-stock' : 'out-of-stock' }}">
          <h3>{{ product.name }}</h3>
          <p class="price">Price: {{ product.price }}</p>
          @if (product.inStock)
            <button class="btn-buy">Buy Now</button>
          @else
            <button class="btn-notify" disabled>Out of Stock</button>
          @endif
        </div>
      @endforeach
    </div>
  </section>

  <section class="numbers">
    <h2>Numbers</h2>
    <ol>
      @foreach (numbers as num)
        <li>Number {{ num }}</li>
      @endforeach
    </ol>
  </section>
</div>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    // Categories
    expect(content).toContain('<li>Electronics</li>')
    expect(content).toContain('<li>Accessories</li>')
    expect(content).toContain('<li>Software</li>')

    // Products
    expect(content).toContain('<h3>Laptop</h3>')
    expect(content).toContain('<p class="price">Price: 999.99</p>')
    expect(content).toContain('<div class="product-card in-stock">')
    expect(content).toContain('<button class="btn-buy">Buy Now</button>')

    expect(content).toContain('<h3>Keyboard</h3>')
    expect(content).toContain('<div class="product-card out-of-stock">')
    expect(content).toContain('<button class="btn-notify" disabled>Out of Stock</button>')

    // Numbers
    expect(content).toContain('<li>Number 1</li>')
    expect(content).toContain('<li>Number 5</li>')
  })

  test('should process object property access', async () => {
    const testFile = path.join(TEMP_DIR, 'object-properties.stx')
    await Bun.write(testFile, `<script>
  export const company = {
    name: "Tech Corp",
    founded: 2020,
    address: {
      street: "123 Main St",
      city: "San Francisco",
      state: "CA",
      zip: "94105"
    },
    employees: {
      total: 150,
      engineering: 80,
      sales: 30,
      support: 40
    }
  };

  export const config = {
    theme: {
      primary: "#007bff",
      secondary: "#6c757d"
    },
    features: {
      darkMode: true,
      notifications: false
    }
  };
</script>

<div class="company-profile">
  <header>
    <h1>{{ company.name }}</h1>
    <p>Founded in {{ company.founded }}</p>
  </header>

  <section class="address">
    <h2>Address</h2>
    <address>
      {{ company.address.street }}<br>
      {{ company.address.city }}, {{ company.address.state }} {{ company.address.zip }}
    </address>
  </section>

  <section class="employees">
    <h2>Team Size</h2>
    <p>Total Employees: {{ company.employees.total }}</p>
    <ul>
      <li>Engineering: {{ company.employees.engineering }}</li>
      <li>Sales: {{ company.employees.sales }}</li>
      <li>Support: {{ company.employees.support }}</li>
    </ul>
  </section>

  <section class="config">
    <h2>Configuration</h2>
    <p>Primary Color: {{ config.theme.primary }}</p>
    <p>Dark Mode: {{ config.features.darkMode ? 'Enabled' : 'Disabled' }}</p>
    <p>Notifications: {{ config.features.notifications ? 'On' : 'Off' }}</p>
  </section>
</div>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    expect(content).toContain('<h1>Tech Corp</h1>')
    expect(content).toContain('<p>Founded in 2020</p>')
    expect(content).toContain('123 Main St<br>')
    expect(content).toContain('San Francisco, CA 94105')
    expect(content).toContain('<p>Total Employees: 150</p>')
    expect(content).toContain('<li>Engineering: 80</li>')
    expect(content).toContain('<p>Primary Color: #007bff</p>')
    expect(content).toContain('<p>Dark Mode: Enabled</p>')
    expect(content).toContain('<p>Notifications: Off</p>')
  })

  test('should process function calls in templates', async () => {
    const testFile = path.join(TEMP_DIR, 'functions.stx')
    await Bun.write(testFile, `<script>
  export const users = [
    { firstName: "John", lastName: "Doe", age: 30 },
    { firstName: "Jane", lastName: "Smith", age: 25 },
    { firstName: "Bob", lastName: "Johnson", age: 35 }
  ];

  export function getFullName(firstName, lastName) {
    return firstName + " " + lastName;
  }

  export function formatAge(age) {
    return age + " years old";
  }

  export function isAdult(age) {
    return age >= 18;
  }

  export function getInitials(firstName, lastName) {
    return firstName.charAt(0) + "." + lastName.charAt(0) + ".";
  }
</script>

<div class="user-directory">
  <h1>User Directory</h1>

  <div class="user-list">
    @foreach (users as user)
      <div class="user-card">
        <div class="user-header">
          <h2>{{ getFullName(user.firstName, user.lastName) }}</h2>
          <span class="initials">{{ getInitials(user.firstName, user.lastName) }}</span>
        </div>

        <div class="user-details">
          <p>Age: {{ formatAge(user.age) }}</p>
          <p>Status: {{ isAdult(user.age) ? 'Adult' : 'Minor' }}</p>
        </div>
      </div>
    @endforeach
  </div>
</div>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    expect(content).toContain('<h2>John Doe</h2>')
    expect(content).toContain('<span class="initials">J.D.</span>')
    expect(content).toContain('<p>Age: 30 years old</p>')
    expect(content).toContain('<p>Status: Adult</p>')

    expect(content).toContain('<h2>Jane Smith</h2>')
    expect(content).toContain('<span class="initials">J.S.</span>')
    expect(content).toContain('<p>Age: 25 years old</p>')

    expect(content).toContain('<h2>Bob Johnson</h2>')
    expect(content).toContain('<span class="initials">B.J.</span>')
    expect(content).toContain('<p>Age: 35 years old</p>')
  })
})
