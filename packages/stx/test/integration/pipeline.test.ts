import type { StxOptions } from '../../src/types'
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { processForms } from '../../src/forms'

const defaultOptions: StxOptions = { ...defaultConfig, cache: false, debug: false }

async function processTemplate(
  template: string,
  context: Record<string, any> = {},
  filePath: string = 'test.stx',
  options: StxOptions = defaultOptions,
): Promise<string> {
  const deps = new Set<string>()
  return processDirectives(template, context, filePath, options, deps)
}

// ---------------------------------------------------------------------------
// Expressions + Conditionals
// ---------------------------------------------------------------------------
describe('Pipeline: Expressions + Conditionals', () => {
  it('should render user name inside @if when user exists', async () => {
    const result = await processTemplate(
      '@if(user)Hello {{ user.name }}@endif',
      { user: { name: 'Alice' } },
    )
    expect(result).toContain('Hello Alice')
  })

  it('should render @else branch when user is falsy', async () => {
    const result = await processTemplate(
      '@if(user)Hello {{ user.name }}@else Guest@endif',
      { user: null },
    )
    expect(result).toContain('Guest')
    expect(result).not.toContain('Hello')
  })

  it('should evaluate items.length > 0 and show count', async () => {
    const result = await processTemplate(
      '@if(items.length > 0){{ items.length }} items@else No items@endif',
      { items: ['a', 'b', 'c'] },
    )
    expect(result).toContain('3 items')
  })

  it('should show "No items" when array is empty', async () => {
    const result = await processTemplate(
      '@if(items.length > 0){{ items.length }} items@else No items@endif',
      { items: [] },
    )
    expect(result).toContain('No items')
  })

  it('should evaluate ternary in expression', async () => {
    const result = await processTemplate(
      '{{ isAdmin ? "Admin" : "User" }}',
      { isAdmin: true },
    )
    expect(result).toContain('Admin')
  })

  it('should evaluate ternary as false branch', async () => {
    const result = await processTemplate(
      '{{ isAdmin ? "Admin" : "User" }}',
      { isAdmin: false },
    )
    expect(result).toContain('User')
  })

  it('should evaluate optional chaining that resolves', async () => {
    const result = await processTemplate(
      '{{ user?.profile?.avatar }}',
      { user: { profile: { avatar: 'photo.jpg' } } },
    )
    expect(result).toContain('photo.jpg')
  })

  it('should handle optional chaining that returns undefined', async () => {
    const result = await processTemplate(
      '{{ user?.profile?.avatar }}',
      { user: { profile: {} } },
    )
    // undefined should render as empty
    expect(result.trim()).toBe('')
  })

  it('should process @elseif chains correctly', async () => {
    const result = await processTemplate(
      '@if(role === "admin")Admin Panel@elseif(role === "editor")Editor View@else Reader View@endif',
      { role: 'editor' },
    )
    expect(result).toContain('Editor View')
    expect(result).not.toContain('Admin Panel')
    expect(result).not.toContain('Reader View')
  })

  it('should process nested @if blocks', async () => {
    const result = await processTemplate(
      '@if(loggedIn)@if(isAdmin)<span>Admin</span>@else <span>Member</span>@endif@else <span>Guest</span>@endif',
      { loggedIn: true, isAdmin: false },
    )
    expect(result).toContain('Member')
    expect(result).not.toContain('Admin')
    expect(result).not.toContain('Guest')
  })

  it('should process @unless directive', async () => {
    const result = await processTemplate(
      '@unless(maintenance)<p>Site is live</p>@endunless',
      { maintenance: false },
    )
    expect(result).toContain('Site is live')
  })

  it('should hide content when @unless condition is true', async () => {
    const result = await processTemplate(
      '@unless(maintenance)<p>Site is live</p>@endunless',
      { maintenance: true },
    )
    expect(result).not.toContain('Site is live')
  })
})

// ---------------------------------------------------------------------------
// Loops + Expressions
// ---------------------------------------------------------------------------
describe('Pipeline: Loops + Expressions', () => {
  it('should iterate array with @foreach and render expressions', async () => {
    const result = await processTemplate(
      '@foreach(items as item)<li>{{ item }}</li>@endforeach',
      { items: ['Apple', 'Banana', 'Cherry'] },
    )
    expect(result).toContain('<li>Apple</li>')
    expect(result).toContain('<li>Banana</li>')
    expect(result).toContain('<li>Cherry</li>')
  })

  it('should iterate with index using key => value syntax', async () => {
    const result = await processTemplate(
      '@foreach(items as i => item){{ i }}: {{ item }} @endforeach',
      { items: ['first', 'second', 'third'] },
    )
    expect(result).toContain('0: first')
    expect(result).toContain('1: second')
    expect(result).toContain('2: third')
  })

  it('should handle nested loops', async () => {
    const result = await processTemplate(
      '@foreach(categories as cat)<h2>{{ cat.name }}</h2>@foreach(cat.items as item)<span>{{ item }}</span>@endforeach @endforeach',
      {
        categories: [
          { name: 'Fruits', items: ['Apple', 'Pear'] },
          { name: 'Veggies', items: ['Carrot', 'Pea'] },
        ],
      },
    )
    expect(result).toContain('<h2>Fruits</h2>')
    expect(result).toContain('<span>Apple</span>')
    expect(result).toContain('<span>Pear</span>')
    expect(result).toContain('<h2>Veggies</h2>')
    expect(result).toContain('<span>Carrot</span>')
    expect(result).toContain('<span>Pea</span>')
  })

  it('should combine loop with conditional inside', async () => {
    const result = await processTemplate(
      '@foreach(items as item)@if(item.active)<b>{{ item.name }}</b>@endif @endforeach',
      {
        items: [
          { name: 'Active Task', active: true },
          { name: 'Done Task', active: false },
          { name: 'Open Task', active: true },
        ],
      },
    )
    expect(result).toContain('<b>Active Task</b>')
    expect(result).toContain('<b>Open Task</b>')
    expect(result).not.toContain('<b>Done Task</b>')
  })

  it('should handle @forelse with empty collection', async () => {
    const result = await processTemplate(
      '@forelse(items as item)<li>{{ item }}</li>@empty<li>No items found</li>@endforelse',
      { items: [] },
    )
    expect(result).toContain('No items found')
    expect(result).not.toContain('<li>Apple</li>')
  })

  it('should handle @forelse with populated collection', async () => {
    const result = await processTemplate(
      '@forelse(items as item)<li>{{ item }}</li>@empty<li>No items found</li>@endforelse',
      { items: ['Apple', 'Banana'] },
    )
    expect(result).toContain('<li>Apple</li>')
    expect(result).toContain('<li>Banana</li>')
    expect(result).not.toContain('No items found')
  })

  it('should iterate entries of an object with @foreach', async () => {
    // @foreach requires an array, so pass Object.entries
    const result = await processTemplate(
      '@foreach(entries as entry)<div>{{ entry[0] }}: {{ entry[1] }}</div>@endforeach',
      { entries: Object.entries({ theme: 'dark', lang: 'en' }) },
    )
    expect(result).toContain('theme: dark')
    expect(result).toContain('lang: en')
  })

  it('should handle loop with object property access', async () => {
    const result = await processTemplate(
      '@foreach(users as user)<div class="user">{{ user.name }} ({{ user.email }})</div>@endforeach',
      {
        users: [
          { name: 'Alice', email: 'alice@example.com' },
          { name: 'Bob', email: 'bob@example.com' },
        ],
      },
    )
    expect(result).toContain('Alice (alice@example.com)')
    expect(result).toContain('Bob (bob@example.com)')
  })
})

// ---------------------------------------------------------------------------
// Forms + Conditionals
// ---------------------------------------------------------------------------
describe('Pipeline: Forms + Conditionals', () => {
  it('should generate @csrf hidden input', async () => {
    const result = await processTemplate(
      '<form method="POST">@csrf<input type="text" name="name"></form>',
      {},
    )
    expect(result).toContain('<input type="hidden" name="_token"')
    expect(result).toContain('value="')
  })

  it('should generate @method hidden input for PUT', async () => {
    const result = await processTemplate(
      '<form method="POST">@csrf @method(\'PUT\')<input type="text" name="title"></form>',
      {},
    )
    expect(result).toContain('name="_method"')
    expect(result).toContain('value="PUT"')
  })

  it('should generate @method hidden input for DELETE', async () => {
    const result = await processTemplate(
      '<form method="POST">@method(\'DELETE\')</form>',
      {},
    )
    expect(result).toContain('name="_method"')
    expect(result).toContain('value="DELETE"')
  })

  it('should show @error block when field has validation errors', async () => {
    // The forms-validation module expects @error(path) where path resolves
    // to an array of error strings in the context; uses {{ message }} placeholder
    const result = await processTemplate(
      '<input name="email">@error(form.email)<span class="error">{{ message }}</span>@enderror',
      { form: { email: ['Email is required'] } },
    )
    expect(result).toContain('Email is required')
    expect(result).toContain('class="error"')
  })

  it('should hide @error block when field has no validation errors', async () => {
    const result = await processTemplate(
      '<input name="email">@error(form.email)<span class="error">{{ message }}</span>@enderror',
      { form: { email: [] } },
    )
    expect(result).not.toContain('class="error"')
  })

  it('should combine CSRF and method spoofing in a form', async () => {
    const result = await processTemplate(
      `<form action="/resource/1" method="POST">
  @csrf
  @method('PATCH')
  <input name="title" value="Updated Title">
  <button type="submit">Update</button>
</form>`,
      {},
    )
    expect(result).toContain('name="_token"')
    expect(result).toContain('value="PATCH"')
    expect(result).toContain('name="title"')
  })
})

// ---------------------------------------------------------------------------
// SEO Integration
// ---------------------------------------------------------------------------
describe('Pipeline: SEO Integration', () => {
  it('should process @meta directive with literal values', async () => {
    const result = await processTemplate(
      `@meta('description', 'A great website')`,
      {},
    )
    expect(result).toContain('<meta')
    expect(result).toContain('description')
    expect(result).toContain('A great website')
  })

  it('should process @meta directive for OpenGraph property', async () => {
    const result = await processTemplate(
      `@meta('og:title', 'My Page Title')`,
      {},
    )
    expect(result).toContain('<meta')
    expect(result).toContain('og:title')
    expect(result).toContain('My Page Title')
  })
})

// ---------------------------------------------------------------------------
// Expression Syntax Variants
// ---------------------------------------------------------------------------
describe('Pipeline: Expression Syntax Variants', () => {
  it('should HTML-escape {{ }} output', async () => {
    const result = await processTemplate(
      '{{ content }}',
      { content: '<script>alert("xss")</script>' },
    )
    expect(result).toContain('&lt;script&gt;')
    expect(result).not.toContain('<script>alert')
  })

  it('should render {!! !!} as raw unescaped HTML', async () => {
    const result = await processTemplate(
      '{!! rawHtml !!}',
      { rawHtml: '<strong>Bold</strong>' },
    )
    expect(result).toContain('<strong>Bold</strong>')
  })

  it('should render {{{ }}} as raw unescaped HTML', async () => {
    const result = await processTemplate(
      '{{{ rawHtml }}}',
      { rawHtml: '<em>Italic</em>' },
    )
    expect(result).toContain('<em>Italic</em>')
  })

  it('should apply | uppercase filter', async () => {
    const result = await processTemplate(
      '{{ value | uppercase }}',
      { value: 'hello world' },
    )
    expect(result).toContain('HELLO WORLD')
  })

  it('should apply | lowercase filter', async () => {
    const result = await processTemplate(
      '{{ value | lowercase }}',
      { value: 'HELLO' },
    )
    expect(result).toContain('hello')
  })

  it('should apply | truncate filter with parameter', async () => {
    const result = await processTemplate(
      '{{ value | truncate:10 }}',
      { value: 'This is a very long string that should be truncated' },
    )
    // truncate:10 means 10 chars total including "..."
    expect(result.length).toBeLessThan(52)
    expect(result).toContain('...')
  })

  it('should apply chained filters | uppercase | truncate', async () => {
    const result = await processTemplate(
      '{{ value | uppercase | truncate:15 }}',
      { value: 'hello world this is a test' },
    )
    const trimmed = result.trim()
    // uppercase first, then truncate
    expect(trimmed).toMatch(/^HELLO WORLD.*/)
    expect(trimmed).toContain('...')
  })

  it('should apply | capitalize filter', async () => {
    const result = await processTemplate(
      '{{ value | capitalize }}',
      { value: 'hello' },
    )
    expect(result).toContain('Hello')
  })

  it('should apply | number filter', async () => {
    const result = await processTemplate(
      '{{ value | number:2 }}',
      { value: 3.14159 },
    )
    expect(result).toContain('3.14')
  })

  it('should return empty for filter on null/undefined value', async () => {
    const result = await processTemplate(
      '{{ value | uppercase }}',
      { value: null },
    )
    expect(result.trim()).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Complex Real-World Templates
// ---------------------------------------------------------------------------
describe('Pipeline: Real-World User Profile Page', () => {
  it('should render a user profile with conditionals, loops, and expressions', async () => {
    const result = await processTemplate(
      `<div class="profile">
  <h1>{{ user.name }}</h1>
  @if(user.bio)
    <p class="bio">{{ user.bio }}</p>
  @endif
  @if(user.verified)
    <span class="badge">Verified</span>
  @endif
  <h2>Skills</h2>
  <ul>
    @foreach(user.skills as skill)
      <li>{{ skill }}</li>
    @endforeach
  </ul>
  @if(user.posts.length > 0)
    <h2>Recent Posts ({{ user.posts.length }})</h2>
    @foreach(user.posts as post)
      <article>
        <h3>{{ post.title }}</h3>
        <p>{{ post.excerpt }}</p>
      </article>
    @endforeach
  @else
    <p>No posts yet.</p>
  @endif
</div>`,
      {
        user: {
          name: 'Jane Doe',
          bio: 'Full-stack developer from NYC.',
          verified: true,
          skills: ['TypeScript', 'Bun', 'stx'],
          posts: [
            { title: 'Getting Started with stx', excerpt: 'Learn the basics...' },
            { title: 'Advanced Templating', excerpt: 'Deep dive into...' },
          ],
        },
      },
    )
    expect(result).toContain('Jane Doe')
    expect(result).toContain('Full-stack developer from NYC.')
    expect(result).toContain('Verified')
    expect(result).toContain('<li>TypeScript</li>')
    expect(result).toContain('<li>Bun</li>')
    expect(result).toContain('<li>stx</li>')
    expect(result).toContain('Recent Posts (2)')
    expect(result).toContain('Getting Started with stx')
    expect(result).toContain('Advanced Templating')
    expect(result).not.toContain('No posts yet.')
  })
})

describe('Pipeline: Real-World Product Listing', () => {
  it('should render a product listing with filters, conditionals, loops', async () => {
    const result = await processTemplate(
      `<div class="products">
  <h1>{{ category | uppercase }}</h1>
  @foreach(products as product)
    <div class="product-card">
      <h2>{{ product.name }}</h2>
      <p class="price">\${{ product.price }}</p>
      @if(product.onSale)
        <span class="sale-badge">SALE</span>
      @endif
      @if(product.stock > 0)
        <button>Add to Cart</button>
      @else
        <button disabled>Out of Stock</button>
      @endif
    </div>
  @endforeach
</div>`,
      {
        category: 'electronics',
        products: [
          { name: 'Laptop', price: 999, onSale: true, stock: 5 },
          { name: 'Mouse', price: 29, onSale: false, stock: 0 },
          { name: 'Keyboard', price: 79, onSale: true, stock: 12 },
        ],
      },
    )
    expect(result).toContain('ELECTRONICS')
    expect(result).toContain('Laptop')
    expect(result).toContain('$999')
    // Laptop is on sale
    expect(result).toContain('SALE')
    // Mouse is out of stock
    expect(result).toContain('<button disabled>Out of Stock</button>')
    // Keyboard is in stock
    expect(result).toContain('Keyboard')
  })
})

describe('Pipeline: Real-World Dashboard Template', () => {
  it('should render a dashboard with multiple sections', async () => {
    const result = await processTemplate(
      `<div class="dashboard">
  <header>
    <h1>Welcome, {{ user.name }}</h1>
    @if(user.role === 'admin')
      <a href="/admin">Admin Panel</a>
    @endif
  </header>

  <section class="stats">
    @foreach(stats as stat)
      <div class="stat-card">
        <h3>{{ stat.label }}</h3>
        <span class="value">{{ stat.value }}</span>
      </div>
    @endforeach
  </section>

  <section class="notifications">
    @if(notifications.length > 0)
      <h2>Notifications ({{ notifications.length }})</h2>
      <ul>
        @foreach(notifications as note)
          <li class="{{ note.type }}">{{ note.message }}</li>
        @endforeach
      </ul>
    @else
      <p>No new notifications.</p>
    @endif
  </section>

  <section class="recent-activity">
    @forelse(activities as activity)
      <div class="activity">
        <span>{{ activity.action }}</span>
        <small>{{ activity.time }}</small>
      </div>
    @empty
      <p>No recent activity.</p>
    @endforelse
  </section>
</div>`,
      {
        user: { name: 'Admin User', role: 'admin' },
        stats: [
          { label: 'Users', value: 1250 },
          { label: 'Revenue', value: 48000 },
          { label: 'Orders', value: 320 },
        ],
        notifications: [
          { type: 'info', message: 'System update scheduled' },
          { type: 'warning', message: 'Storage almost full' },
        ],
        activities: [
          { action: 'Deployed v2.1', time: '2 hours ago' },
          { action: 'Merged PR #42', time: '5 hours ago' },
        ],
      },
    )
    expect(result).toContain('Welcome, Admin User')
    expect(result).toContain('Admin Panel')
    expect(result).toContain('Users')
    expect(result).toContain('1250')
    expect(result).toContain('Revenue')
    expect(result).toContain('48000')
    expect(result).toContain('Notifications (2)')
    expect(result).toContain('System update scheduled')
    expect(result).toContain('Storage almost full')
    expect(result).toContain('Deployed v2.1')
    expect(result).toContain('2 hours ago')
    expect(result).not.toContain('No recent activity.')
  })
})

describe('Pipeline: Real-World Blog Post Template', () => {
  it('should render a blog post with author, comments, and meta', async () => {
    const result = await processTemplate(
      `<article class="blog-post">
  <h1>{{ post.title }}</h1>
  <div class="meta">
    <span class="author">By {{ post.author.name }}</span>
    <span class="date">{{ post.date }}</span>
    @if(post.tags.length > 0)
      <div class="tags">
        @foreach(post.tags as tag)
          <span class="tag">{{ tag }}</span>
        @endforeach
      </div>
    @endif
  </div>

  <div class="content">{!! post.content !!}</div>

  <section class="comments">
    <h2>Comments ({{ comments.length }})</h2>
    @forelse(comments as comment)
      <div class="comment">
        <strong>{{ comment.author }}</strong>
        <p>{{ comment.text }}</p>
        @if(comment.replies.length > 0)
          <div class="replies">
            @foreach(comment.replies as reply)
              <div class="reply">
                <strong>{{ reply.author }}</strong>
                <p>{{ reply.text }}</p>
              </div>
            @endforeach
          </div>
        @endif
      </div>
    @empty
      <p>No comments yet. Be the first!</p>
    @endforelse
  </section>
</article>`,
      {
        post: {
          title: 'Building Modern Web Apps with stx',
          author: { name: 'John Smith' },
          date: '2026-03-24',
          tags: ['stx', 'bun', 'web-dev'],
          content: '<p>This is the <strong>article body</strong> with HTML.</p>',
        },
        comments: [
          {
            author: 'Reader1',
            text: 'Great article!',
            replies: [
              { author: 'John Smith', text: 'Thanks!' },
            ],
          },
          {
            author: 'Reader2',
            text: 'Very helpful.',
            replies: [],
          },
        ],
      },
    )
    expect(result).toContain('Building Modern Web Apps with stx')
    expect(result).toContain('By John Smith')
    expect(result).toContain('2026-03-24')
    expect(result).toContain('<span class="tag">stx</span>')
    expect(result).toContain('<span class="tag">bun</span>')
    // Raw HTML content
    expect(result).toContain('<p>This is the <strong>article body</strong> with HTML.</p>')
    expect(result).toContain('Comments (2)')
    expect(result).toContain('Great article!')
    expect(result).toContain('Thanks!')
    expect(result).toContain('Very helpful.')
    expect(result).not.toContain('No comments yet.')
  })
})

describe('Pipeline: Real-World Navigation with Active State', () => {
  it('should render navigation with active class on current page', async () => {
    const result = await processTemplate(
      `<nav>
  @foreach(navItems as item)
    <a href="{{ item.url }}" class="@if(item.url === currentPath)active @endifnav-link">{{ item.label }}</a>
  @endforeach
</nav>`,
      {
        currentPath: '/about',
        navItems: [
          { url: '/', label: 'Home' },
          { url: '/about', label: 'About' },
          { url: '/contact', label: 'Contact' },
        ],
      },
    )
    expect(result).toContain('Home')
    expect(result).toContain('About')
    expect(result).toContain('Contact')
    // The about link should have the active class
    expect(result).toContain('active')
  })
})

describe('Pipeline: Real-World Error Page', () => {
  it('should render a dynamic error page', async () => {
    const result = await processTemplate(
      `<div class="error-page">
  <h1>{{ error.code }}</h1>
  <h2>{{ error.title }}</h2>
  <p>{{ error.message }}</p>
  @if(error.details)
    <details>
      <summary>Technical Details</summary>
      <pre>{{ error.details }}</pre>
    </details>
  @endif
  <a href="/">Go Home</a>
</div>`,
      {
        error: {
          code: 404,
          title: 'Page Not Found',
          message: 'The page you are looking for does not exist.',
          details: 'Route /unknown-path not matched',
        },
      },
    )
    expect(result).toContain('404')
    expect(result).toContain('Page Not Found')
    expect(result).toContain('The page you are looking for does not exist.')
    expect(result).toContain('Technical Details')
    expect(result).toContain('Route /unknown-path not matched')
  })

  it('should hide details when not provided', async () => {
    const result = await processTemplate(
      `<div class="error-page">
  <h1>{{ error.code }}</h1>
  @if(error.details)
    <pre>{{ error.details }}</pre>
  @endif
</div>`,
      {
        error: { code: 500, details: null },
      },
    )
    expect(result).toContain('500')
    expect(result).not.toContain('<pre>')
  })
})

// ---------------------------------------------------------------------------
// Edge Cases in Integration
// ---------------------------------------------------------------------------
describe('Pipeline: Edge Cases', () => {
  it('should return empty output for empty template', async () => {
    const result = await processTemplate('', {})
    expect(result.trim()).toBe('')
  })

  it('should return plain HTML unchanged (no directives)', async () => {
    const html = '<div><p>Hello World</p></div>'
    const result = await processTemplate(html, {})
    expect(result).toContain('<div><p>Hello World</p></div>')
  })

  it('should handle template with only whitespace', async () => {
    const result = await processTemplate('   \n  \t  \n  ', {})
    expect(result.trim()).toBe('')
  })

  it('should handle a large template (10KB+)', async () => {
    // Build a large template with many list items
    const items = Array.from({ length: 200 }, (_, i) => `Item ${i}`)
    const template = `<ul>@foreach(items as item)<li>{{ item }}</li>@endforeach</ul>`
    const result = await processTemplate(template, { items })
    expect(result).toContain('<li>Item 0</li>')
    expect(result).toContain('<li>Item 99</li>')
    expect(result).toContain('<li>Item 199</li>')
    // Verify the output is large
    expect(result.length).toBeGreaterThan(2000)
  })

  it('should convert escaped @@ to literal @', async () => {
    const result = await processTemplate('@@if this is not a directive', {})
    expect(result).toContain('@if this is not a directive')
  })

  it('should strip {{-- comment --}} from output', async () => {
    const result = await processTemplate(
      '<p>Before</p>{{-- this is a comment --}}<p>After</p>',
      {},
    )
    expect(result).toContain('Before')
    expect(result).toContain('After')
    expect(result).not.toContain('this is a comment')
    expect(result).not.toContain('{{--')
  })

  it('should strip multiline comments', async () => {
    const result = await processTemplate(
      `<p>Hello</p>
{{--
  This is a multiline
  comment that spans
  several lines
--}}
<p>World</p>`,
      {},
    )
    expect(result).toContain('Hello')
    expect(result).toContain('World')
    expect(result).not.toContain('multiline')
  })

  it('should handle multiple directives of the same type', async () => {
    const result = await processTemplate(
      `@if(a)<p>A</p>@endif
@if(b)<p>B</p>@endif
@if(c)<p>C</p>@endif`,
      { a: true, b: false, c: true },
    )
    expect(result).toContain('<p>A</p>')
    expect(result).not.toContain('<p>B</p>')
    expect(result).toContain('<p>C</p>')
  })

  it('should handle context with deeply nested objects', async () => {
    const result = await processTemplate(
      '{{ data.level1.level2.level3.value }}',
      {
        data: {
          level1: {
            level2: {
              level3: {
                value: 'deeply nested',
              },
            },
          },
        },
      },
    )
    expect(result).toContain('deeply nested')
  })

  it('should handle context with arrays of objects with nested properties', async () => {
    const result = await processTemplate(
      '@foreach(records as record)<span>{{ record.meta.tags[0] }}</span>@endforeach',
      {
        records: [
          { meta: { tags: ['javascript', 'web'] } },
          { meta: { tags: ['typescript', 'bun'] } },
        ],
      },
    )
    expect(result).toContain('<span>javascript</span>')
    expect(result).toContain('<span>typescript</span>')
  })

  it('should handle Unicode content in templates and context', async () => {
    const result = await processTemplate(
      '<p>{{ greeting }}</p>',
      { greeting: 'Hola mundo!' },
    )
    expect(result).toContain('Hola mundo!')
  })

  it('should handle emojis in context values', async () => {
    const result = await processTemplate(
      '<span>{{ status }}</span>',
      { status: 'All good! \u2705' },
    )
    expect(result).toContain('All good!')
  })

  it('should handle CJK characters', async () => {
    const result = await processTemplate(
      '<h1>{{ title }}</h1>',
      { title: '\u3053\u3093\u306b\u3061\u306f\u4e16\u754c' },
    )
    expect(result).toContain('\u3053\u3093\u306b\u3061\u306f\u4e16\u754c')
  })

  it('should handle HTML entities in template content', async () => {
    const result = await processTemplate(
      '<p>&copy; 2026 &mdash; {{ company }}</p>',
      { company: 'Acme Corp' },
    )
    expect(result).toContain('&copy; 2026 &mdash; Acme Corp')
  })

  it('should handle boolean false in expressions', async () => {
    const result = await processTemplate(
      '{{ value }}',
      { value: false },
    )
    expect(result).toContain('false')
  })

  it('should handle numeric zero in expressions', async () => {
    const result = await processTemplate(
      '{{ count }}',
      { count: 0 },
    )
    expect(result).toContain('0')
  })

  it('should handle empty string in expressions', async () => {
    const result = await processTemplate(
      '[{{ value }}]',
      { value: '' },
    )
    // Empty string should render as empty
    expect(result).toContain('[]')
  })
})

// ---------------------------------------------------------------------------
// Error Handling / Graceful Degradation
// ---------------------------------------------------------------------------
describe('Pipeline: Error Handling', () => {
  it('should handle undefined variable in expression gracefully', async () => {
    const result = await processTemplate(
      '<p>{{ nonExistent }}</p>',
      {},
    )
    // Should not throw, should produce some output (empty or error message)
    expect(typeof result).toBe('string')
  })

  it('should handle expression evaluation error gracefully', async () => {
    const result = await processTemplate(
      '<p>{{ items.map(x => x.toUpperCase()) }}</p>',
      { items: null },
    )
    // Should not throw - error is caught and rendered inline or empty
    expect(typeof result).toBe('string')
  })

  it('should handle missing @endif gracefully', async () => {
    // Missing @endif - the framework should handle this without crashing
    const result = await processTemplate(
      '<p>Before</p>@if(true)<p>Inside</p><p>After</p>',
      {},
    )
    // Should produce some output rather than throwing
    expect(typeof result).toBe('string')
    expect(result).toContain('Before')
  })

  it('should handle empty @if condition gracefully', async () => {
    // @if with no real condition
    const result = await processTemplate(
      '@if()<p>Content</p>@endif',
      {},
    )
    expect(typeof result).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// Multiple Directive Types Combined
// ---------------------------------------------------------------------------
describe('Pipeline: Multiple Directive Types Combined', () => {
  it('should process comments, conditionals, loops, and expressions together', async () => {
    const result = await processTemplate(
      `{{-- Page header --}}
<header>
  <h1>{{ title }}</h1>
</header>
{{-- Main content --}}
@if(showItems)
  <ul>
    @foreach(items as item)
      <li>{{ item | uppercase }}</li>
    @endforeach
  </ul>
@endif`,
      {
        title: 'My Page',
        showItems: true,
        items: ['alpha', 'beta', 'gamma'],
      },
    )
    expect(result).not.toContain('Page header')
    expect(result).not.toContain('Main content')
    expect(result).toContain('My Page')
    expect(result).toContain('<li>ALPHA</li>')
    expect(result).toContain('<li>BETA</li>')
    expect(result).toContain('<li>GAMMA</li>')
  })

  it('should process @csrf, @method, @if, and expressions in one template', async () => {
    const result = await processTemplate(
      `<form method="POST" action="/items">
  @csrf
  @method('PUT')
  @if(editing)
    <input name="title" value="{{ item.title }}">
  @else
    <p>{{ item.title }}</p>
  @endif
  <button type="submit">Save</button>
</form>`,
      {
        editing: true,
        item: { title: 'Test Item' },
      },
    )
    expect(result).toContain('name="_token"')
    expect(result).toContain('value="PUT"')
    expect(result).toContain('value="Test Item"')
    expect(result).not.toContain('<p>Test Item</p>')
  })

  it('should handle escaped directive alongside real directives', async () => {
    const result = await processTemplate(
      `@@if(this is literal)
@if(real)
  <p>This is real content</p>
@endif`,
      { real: true },
    )
    expect(result).toContain('@if(this is literal)')
    expect(result).toContain('This is real content')
  })
})

// ---------------------------------------------------------------------------
// Switch/Case
// ---------------------------------------------------------------------------
describe('Pipeline: Switch/Case Directives', () => {
  it('should process @switch/@case with matching case', async () => {
    const result = await processTemplate(
      `@switch(role)
  @case('admin')
    <p>Admin Dashboard</p>
    @break
  @case('editor')
    <p>Editor Workspace</p>
    @break
  @default
    <p>Guest View</p>
@endswitch`,
      { role: 'admin' },
    )
    expect(result).toContain('Admin Dashboard')
    expect(result).not.toContain('Editor Workspace')
    expect(result).not.toContain('Guest View')
  })

  it('should process @switch/@case with default fallthrough', async () => {
    const result = await processTemplate(
      `@switch(role)
  @case('admin')
    <p>Admin</p>
    @break
  @default
    <p>Default Role</p>
@endswitch`,
      { role: 'viewer' },
    )
    expect(result).toContain('Default Role')
    expect(result).not.toContain('Admin')
  })
})

// ---------------------------------------------------------------------------
// @isset and @empty
// ---------------------------------------------------------------------------
describe('Pipeline: @isset and @empty Directives', () => {
  it('should show content when variable is set with @isset', async () => {
    const result = await processTemplate(
      '@isset(title)<h1>{{ title }}</h1>@endisset',
      { title: 'Hello' },
    )
    expect(result).toContain('<h1>Hello</h1>')
  })

  it('should hide content when variable is not set with @isset', async () => {
    const result = await processTemplate(
      '@isset(myCustomVar)<h1>{{ myCustomVar }}</h1>@endisset',
      {},
    )
    expect(result).not.toContain('<h1>')
  })

  it('should show content when variable is empty with @empty', async () => {
    const result = await processTemplate(
      '@empty(items)<p>Nothing here</p>@endempty',
      { items: [] },
    )
    expect(result).toContain('Nothing here')
  })

  it('should hide content when variable is not empty with @empty', async () => {
    const result = await processTemplate(
      '@empty(items)<p>Nothing here</p>@endempty',
      { items: [1, 2, 3] },
    )
    expect(result).not.toContain('Nothing here')
  })
})

// ---------------------------------------------------------------------------
// Complex Expression Evaluation
// ---------------------------------------------------------------------------
describe('Pipeline: Complex Expression Evaluation', () => {
  it('should evaluate arithmetic in expressions', async () => {
    const result = await processTemplate(
      '{{ a + b * c }}',
      { a: 2, b: 3, c: 4 },
    )
    expect(result).toContain('14')
  })

  it('should evaluate string concatenation', async () => {
    const result = await processTemplate(
      '{{ firstName + " " + lastName }}',
      { firstName: 'John', lastName: 'Doe' },
    )
    expect(result).toContain('John Doe')
  })

  it('should evaluate template literals in expressions', async () => {
    const result = await processTemplate(
      '{{ `Hello ${name}!` }}',
      { name: 'World' },
    )
    expect(result).toContain('Hello World!')
  })

  it('should evaluate array methods in expressions', async () => {
    const result = await processTemplate(
      '{{ items.join(", ") }}',
      { items: ['a', 'b', 'c'] },
    )
    expect(result).toContain('a, b, c')
  })

  it('should evaluate object property access with dot notation', async () => {
    const result = await processTemplate(
      '{{ data.keyName }}',
      { data: { keyName: 'value-here' } },
    )
    expect(result).toContain('value-here')
  })

  it('should evaluate comparison operators in @if', async () => {
    const result = await processTemplate(
      '@if(age >= 18)<p>Adult</p>@else <p>Minor</p>@endif',
      { age: 21 },
    )
    expect(result).toContain('Adult')
  })

  it('should evaluate logical AND in @if', async () => {
    const result = await processTemplate(
      '@if(loggedIn && isAdmin)<p>Admin area</p>@endif',
      { loggedIn: true, isAdmin: true },
    )
    expect(result).toContain('Admin area')
  })

  it('should evaluate logical OR in @if', async () => {
    const result = await processTemplate(
      '@if(isAdmin || isModerator)<p>Privileged</p>@endif',
      { isAdmin: false, isModerator: true },
    )
    expect(result).toContain('Privileged')
  })

  it('should evaluate negation in @if', async () => {
    const result = await processTemplate(
      '@if(!banned)<p>Welcome</p>@endif',
      { banned: false },
    )
    expect(result).toContain('Welcome')
  })
})

// ---------------------------------------------------------------------------
// @for loop (C-style)
// ---------------------------------------------------------------------------
describe('Pipeline: @for Loop', () => {
  it('should iterate with @for loop', async () => {
    const result = await processTemplate(
      '@for(i = 0; i < 3; i++)<span>{{ i }}</span>@endfor',
      {},
    )
    expect(result).toContain('<span>0</span>')
    expect(result).toContain('<span>1</span>')
    expect(result).toContain('<span>2</span>')
  })
})

// ---------------------------------------------------------------------------
// Raw HTML Safety
// ---------------------------------------------------------------------------
describe('Pipeline: Raw HTML Safety', () => {
  it('should escape dangerous HTML in {{ }} expressions', async () => {
    const result = await processTemplate(
      '{{ userInput }}',
      { userInput: '<img src=x onerror="alert(1)">' },
    )
    expect(result).not.toContain('<img src=x onerror')
    expect(result).toContain('&lt;img')
  })

  it('should NOT escape HTML in {!! !!} expressions', async () => {
    const result = await processTemplate(
      '{!! trustedHtml !!}',
      { trustedHtml: '<div class="safe">Content</div>' },
    )
    expect(result).toContain('<div class="safe">Content</div>')
  })

  it('should escape special characters like quotes and ampersands', async () => {
    const result = await processTemplate(
      '{{ text }}',
      { text: 'A & B "quoted" <tag>' },
    )
    expect(result).toContain('&amp;')
    expect(result).toContain('&quot;')
    expect(result).toContain('&lt;tag&gt;')
  })
})

// ---------------------------------------------------------------------------
// @js Directive
// ---------------------------------------------------------------------------
describe('Pipeline: @js Directive', () => {
  it('should execute @js block and use variables in template', async () => {
    const result = await processTemplate(
      `@js
  const greeting = "Hello from JS"
  const count = 5
@endjs
<p>{{ greeting }}</p>
<p>Count: {{ count }}</p>`,
      {},
    )
    expect(result).toContain('Hello from JS')
    expect(result).toContain('Count: 5')
  })

  it('should allow @js to define data used in loops', async () => {
    const result = await processTemplate(
      `@js
  const colors = ["red", "green", "blue"]
@endjs
@foreach(colors as color)
  <span class="{{ color }}">{{ color }}</span>
@endforeach`,
      {},
    )
    expect(result).toContain('<span class="red">red</span>')
    expect(result).toContain('<span class="green">green</span>')
    expect(result).toContain('<span class="blue">blue</span>')
  })
})

// ---------------------------------------------------------------------------
// Full Page Integration (all directive types in one realistic template)
// ---------------------------------------------------------------------------
describe('Pipeline: Full Page Integration', () => {
  it('should render a complete page with all major directive types', async () => {
    const result = await processTemplate(
      `{{-- Full page template test --}}
<html>
<head>
  <title>{{ pageTitle }}</title>
</head>
<body>
  {{-- Navigation --}}
  <nav>
    @foreach(navItems as nav)
      <a href="{{ nav.href }}">{{ nav.text }}</a>
    @endforeach
  </nav>

  {{-- Hero section --}}
  @if(showHero)
    <section class="hero">
      <h1>{{ hero.title | uppercase }}</h1>
      <p>{{ hero.subtitle }}</p>
    </section>
  @endif

  {{-- Main content --}}
  <main>
    @switch(page)
      @case('home')
        <p>Welcome home!</p>
        @break
      @case('about')
        <p>About us</p>
        @break
      @default
        <p>Other page</p>
    @endswitch

    @unless(maintenance)
      <section class="features">
        @foreach(features as feature)
          <div class="feature">
            <h3>{{ feature.name }}</h3>
            @if(feature.description)
              <p>{{ feature.description }}</p>
            @endif
          </div>
        @endforeach
      </section>
    @endunless
  </main>

  {{-- Footer --}}
  <footer>
    <p>&copy; {{ year }} {{ company }}</p>
  </footer>
</body>
</html>`,
      {
        pageTitle: 'Integration Test Page',
        navItems: [
          { href: '/', text: 'Home' },
          { href: '/about', text: 'About' },
        ],
        showHero: true,
        hero: { title: 'Welcome', subtitle: 'To our site' },
        page: 'home',
        maintenance: false,
        features: [
          { name: 'Fast', description: 'Lightning fast rendering' },
          { name: 'Secure', description: null },
        ],
        year: 2026,
        company: 'stx Inc.',
      },
    )

    // Comments removed
    expect(result).not.toContain('Full page template test')
    expect(result).not.toContain('Navigation')

    // Title
    expect(result).toContain('Integration Test Page')

    // Navigation
    expect(result).toContain('<a href="/">Home</a>')
    expect(result).toContain('<a href="/about">About</a>')

    // Hero with filter
    expect(result).toContain('WELCOME')
    expect(result).toContain('To our site')

    // Switch case
    expect(result).toContain('Welcome home!')
    expect(result).not.toContain('About us')
    expect(result).not.toContain('Other page')

    // Features (unless maintenance is false, so shown)
    expect(result).toContain('Fast')
    expect(result).toContain('Lightning fast rendering')
    expect(result).toContain('Secure')

    // Footer
    expect(result).toContain('2026')
    expect(result).toContain('stx Inc.')
  })
})

// ---------------------------------------------------------------------------
// @while loop
// ---------------------------------------------------------------------------
describe('Pipeline: @while Loop', () => {
  it('should process @while loop with context-provided variable', async () => {
    // Note: @while internally uses a variable named "counter", so avoid that name
    const context = { n: 0 }
    const result = await processTemplate(
      `@while(n < 3)<p>{{ n }}</p>@endwhile`,
      context,
    )
    // The @while should produce at least the first value
    expect(result).toContain('<p>0</p>')
  })
})

// ---------------------------------------------------------------------------
// Multiple Expressions on Same Line
// ---------------------------------------------------------------------------
describe('Pipeline: Multiple Expressions', () => {
  it('should evaluate multiple expressions on the same line', async () => {
    const result = await processTemplate(
      '<p>{{ first }} {{ middle }} {{ last }}</p>',
      { first: 'John', middle: 'M.', last: 'Doe' },
    )
    expect(result).toContain('John M. Doe')
  })

  it('should evaluate expression inside HTML attribute', async () => {
    const result = await processTemplate(
      '<a href="{{ url }}" class="{{ cls }}">{{ label }}</a>',
      { url: '/page', cls: 'btn', label: 'Click' },
    )
    expect(result).toContain('href="/page"')
    expect(result).toContain('class="btn"')
    expect(result).toContain('Click')
  })

  it('should evaluate nested property in attribute', async () => {
    const result = await processTemplate(
      '<img src="{{ image.src }}" alt="{{ image.alt }}">',
      { image: { src: '/photo.jpg', alt: 'A photo' } },
    )
    expect(result).toContain('src="/photo.jpg"')
    expect(result).toContain('alt="A photo"')
  })
})

// ---------------------------------------------------------------------------
// Conditional Expression Combinations
// ---------------------------------------------------------------------------
describe('Pipeline: Conditional and Expression Combinations', () => {
  it('should render conditional elements alongside expressions', async () => {
    const result = await processTemplate(
      `@foreach(items as item)
<div class="card">
  {{ item.name }}
  @if(item.featured)<span class="badge">Featured</span>@endif
</div>
@endforeach`,
      {
        items: [
          { name: 'Featured Product', featured: true },
          { name: 'Regular Product', featured: false },
        ],
      },
    )
    expect(result).toContain('Featured Product')
    expect(result).toContain('Regular Product')
    // Only the featured item should have the badge
    expect(result).toContain('<span class="badge">Featured</span>')
  })

  it('should handle conditional within loop with index-based logic', async () => {
    const result = await processTemplate(
      `@foreach(items as i => item)
  @if(i === 0)<div class="first">{{ item }}</div>
  @elseif(i === items.length - 1)<div class="last">{{ item }}</div>
  @else <div>{{ item }}</div>
  @endif
@endforeach`,
      { items: ['A', 'B', 'C'] },
    )
    expect(result).toContain('class="first"')
    expect(result).toContain('class="last"')
  })
})

// ---------------------------------------------------------------------------
// @env directive
// ---------------------------------------------------------------------------
describe('Pipeline: @env Directive', () => {
  it('should show content matching current environment', async () => {
    // Set up the NODE_ENV for the test
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      const result = await processTemplate(
        '@env(\'production\')<p>Production mode</p>@endenv',
        {},
      )
      expect(result).toContain('Production mode')
    }
    finally {
      process.env.NODE_ENV = originalEnv
    }
  })

  it('should hide content not matching current environment', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    try {
      const result = await processTemplate(
        '@env(\'production\')<p>Production mode</p>@endenv',
        {},
      )
      expect(result).not.toContain('Production mode')
    }
    finally {
      process.env.NODE_ENV = originalEnv
    }
  })
})

// ---------------------------------------------------------------------------
// Idempotent processing
// ---------------------------------------------------------------------------
describe('Pipeline: Idempotent Processing', () => {
  it('should produce consistent output on repeated processing', async () => {
    const template = `<h1>{{ title }}</h1>
@if(show)
  <p>Visible</p>
@endif
@foreach(items as item)
  <span>{{ item }}</span>
@endforeach`
    const context = { title: 'Test', show: true, items: ['x', 'y'] }
    const result1 = await processTemplate(template, { ...context })
    const result2 = await processTemplate(template, { ...context })
    expect(result1).toBe(result2)
  })
})

// ---------------------------------------------------------------------------
// SSR disabled
// ---------------------------------------------------------------------------
describe('Pipeline: SSR Disabled', () => {
  it('should return raw template when ssr is false AND buildMode is spa', async () => {
    const template = '@if(show)<p>{{ value }}</p>@endif'
    const result = await processTemplate(
      template,
      { show: true, value: 'hello' },
      'test.stx',
      { ...defaultOptions, ssr: false, buildMode: 'spa' } as any,
    )
    // The `ssr: false + buildMode: 'spa'` combo is the SPA-shell mode where
    // the server ships the raw template for the client to hydrate.
    expect(result).toContain('@if(show)')
    expect(result).toContain('{{ value }}')
  })
})

// ---------------------------------------------------------------------------
// Special characters in data
// ---------------------------------------------------------------------------
describe('Pipeline: Special Characters in Data', () => {
  it('should handle data with single quotes', async () => {
    const result = await processTemplate(
      '{{ message }}',
      { message: "It's a great day" },
    )
    expect(result).toContain('It&#39;s a great day')
  })

  it('should handle data with double quotes', async () => {
    const result = await processTemplate(
      '{{ message }}',
      { message: 'She said "hello"' },
    )
    expect(result).toContain('She said &quot;hello&quot;')
  })

  it('should handle data with newlines in raw expressions', async () => {
    const result = await processTemplate(
      '{!! content !!}',
      { content: 'Line 1\nLine 2' },
    )
    expect(result).toContain('Line 1\nLine 2')
  })

  it('should handle data with backslashes', async () => {
    const result = await processTemplate(
      '{{ path }}',
      { path: 'C:\\Users\\test' },
    )
    expect(result).toContain('C:\\Users\\test')
  })
})

// ---------------------------------------------------------------------------
// Large Nested Structures
// ---------------------------------------------------------------------------
describe('Pipeline: Large Nested Structures', () => {
  it('should handle a 3-level deep nested loop', async () => {
    const result = await processTemplate(
      `@foreach(departments as dept)
<div class="dept">{{ dept.name }}
  @foreach(dept.teams as team)
  <div class="team">{{ team.name }}
    @foreach(team.members as member)
    <span>{{ member }}</span>
    @endforeach
  </div>
  @endforeach
</div>
@endforeach`,
      {
        departments: [
          {
            name: 'Engineering',
            teams: [
              { name: 'Frontend', members: ['Alice', 'Bob'] },
              { name: 'Backend', members: ['Charlie'] },
            ],
          },
          {
            name: 'Design',
            teams: [
              { name: 'UX', members: ['Diana', 'Eve'] },
            ],
          },
        ],
      },
    )
    expect(result).toContain('Engineering')
    expect(result).toContain('Frontend')
    expect(result).toContain('<span>Alice</span>')
    expect(result).toContain('<span>Bob</span>')
    expect(result).toContain('Backend')
    expect(result).toContain('<span>Charlie</span>')
    expect(result).toContain('Design')
    expect(result).toContain('UX')
    expect(result).toContain('<span>Diana</span>')
    expect(result).toContain('<span>Eve</span>')
  })
})

// ---------------------------------------------------------------------------
// Real-World E-commerce Cart Template
// ---------------------------------------------------------------------------
describe('Pipeline: E-commerce Cart Template', () => {
  it('should render shopping cart with calculations and conditions', async () => {
    const result = await processTemplate(
      `<div class="cart">
  <h1>Shopping Cart</h1>
  @if(cartItems.length > 0)
    <table>
      <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
      <tbody>
        @foreach(cartItems as item)
          <tr>
            <td>{{ item.name }}</td>
            <td>{{ item.qty }}</td>
            <td>\${{ item.price }}</td>
          </tr>
        @endforeach
      </tbody>
    </table>
    <div class="total">
      <strong>Total: \${{ total }}</strong>
    </div>
    @if(discount > 0)
      <p class="discount">You save \${{ discount }}!</p>
    @endif
    <form method="POST" action="/checkout">
      @csrf
      <button type="submit">Checkout</button>
    </form>
  @else
    <p class="empty">Your cart is empty.</p>
    <a href="/shop">Continue Shopping</a>
  @endif
</div>`,
      {
        cartItems: [
          { name: 'Widget A', qty: 2, price: 19.99 },
          { name: 'Widget B', qty: 1, price: 49.99 },
        ],
        total: 89.97,
        discount: 10,
      },
    )
    expect(result).toContain('Shopping Cart')
    expect(result).toContain('Widget A')
    expect(result).toContain('Widget B')
    expect(result).toContain('$19.99')
    expect(result).toContain('$49.99')
    expect(result).toContain('Total: $89.97')
    expect(result).toContain('You save $10!')
    expect(result).toContain('name="_token"')
    expect(result).toContain('Checkout')
    expect(result).not.toContain('Your cart is empty.')
  })
})

// =============================================================================
// Pipeline integration bugs (from discovered-bugs)
// =============================================================================

describe('Pipeline: Integration Bugs', () => {
  it('should handle @unless correctly in full pipeline', async () => {
    const r = await processTemplate('@unless(isAdmin)guest@else admin@endunless', { isAdmin: false })
    expect(r.trim()).toContain('guest')
  })

  it('should process @foreach with object in full pipeline', async () => {
    const r = await processTemplate('@foreach(data as key => val){{ key }}:{{ val }},@endforeach', { data: { x: 1, y: 2 } })
    expect(r).not.toContain('Error')
  })

  it('should handle comments before directives', async () => {
    const r = await processTemplate('{{-- comment --}}@if(true)visible@endif')
    expect(r).not.toContain('comment')
    expect(r).toContain('visible')
  })

  it('should handle escaped @ sign', async () => {
    const r = await processTemplate('@@if this is literal')
    expect(r).toContain('@if this is literal')
  })

  it('should handle @foreach inside @if', async () => {
    const r = await processTemplate('@if(show)@foreach(items as item){{ item }}@endforeach@endif', { show: true, items: ['a', 'b'] })
    expect(r).toContain('a')
    expect(r).toContain('b')
  })

  it('should handle @if inside @foreach', async () => {
    const r = await processTemplate('@foreach(items as item)@if(item > 1){{ item }}@endif@endforeach', { items: [1, 2, 3] })
    expect(r).toContain('2')
    expect(r).toContain('3')
    expect(r).not.toContain('1')
  })

  it('should process expression filters in full pipeline', async () => {
    const r = await processTemplate('{{ name | uppercase }}', { name: 'alice' })
    expect(r).toContain('ALICE')
  })

  it('should preserve plain HTML unchanged', async () => {
    const html = '<div class="test"><p>Hello World</p></div>'
    const r = await processTemplate(html)
    expect(r).toContain(html)
  })

  it('should handle empty template', async () => {
    const r = await processTemplate('')
    expect(r).toBeDefined()
  })

  it('should handle template with only whitespace', async () => {
    const r = await processTemplate('   \n  \n   ')
    expect(r.trim()).toBe('')
  })
})

// =============================================================================
// Process Pipeline Stress Tests (from edge-case-bugs)
// =============================================================================

describe('Pipeline: Stress Tests', () => {
  it('template with 100 {{ }} expressions', async () => {
    const exprs = Array.from({ length: 100 }, (_, i) => `{{ val_${i} }}`).join(' ')
    const context: Record<string, any> = {}
    for (let i = 0; i < 100; i++) context[`val_${i}`] = `v${i}`
    const result = await processTemplate(exprs, context)
    for (let i = 0; i < 100; i++) {
      expect(result).toContain(`v${i}`)
    }
  })

  it('template with 50 sequential @if blocks', async () => {
    const blocks = Array.from({ length: 50 }, (_, i) =>
      `@if(show_${i})<span>${i}</span>@endif`,
    ).join('\n')
    const context: Record<string, any> = {}
    for (let i = 0; i < 50; i++) context[`show_${i}`] = i % 2 === 0
    const result = await processTemplate(blocks, context)
    for (let i = 0; i < 50; i++) {
      if (i % 2 === 0) {
        expect(result).toContain(`<span>${i}</span>`)
      }
      else {
        expect(result).not.toContain(`<span>${i}</span>`)
      }
    }
  })

  it('template mixing conditionals, expressions, and forms', async () => {
    const template = `
      @if(show)
        <h1>{{ title }}</h1>
        @csrf
      @endif
    `
    const result = await processTemplate(template, { show: true, title: 'Test' })
    expect(result).toContain('Test')
    expect(result).toContain('_token')
  })

  it('template with @foreach of 500 items', async () => {
    const template = `@foreach(items as item){{ item }},@endforeach`
    const items = Array.from({ length: 500 }, (_, i) => `i${i}`)
    const result = await processTemplate(template, { items })
    expect(result).toContain('i0')
    expect(result).toContain('i499')
  })

  it('deeply nested structures: @if > @foreach > @if > expression', async () => {
    const template = `
      @if(show)
        @foreach(items as item)
          @if(item.visible)
            {{ item.name }}
          @endif
        @endforeach
      @endif
    `
    const items = [
      { name: 'visible-item', visible: true },
      { name: 'hidden-item', visible: false },
    ]
    const result = await processTemplate(template, { show: true, items })
    expect(result).toContain('visible-item')
    expect(result).not.toContain('hidden-item')
  })

  it('@foreach where each item has a @switch', async () => {
    const template = `
      @foreach(items as item)
        @switch(item.type)
          @case('a')
            <span>Type A: {{ item.name }}</span>
            @break
          @case('b')
            <span>Type B: {{ item.name }}</span>
            @break
          @default
            <span>Other: {{ item.name }}</span>
        @endswitch
      @endforeach
    `
    const items = [
      { type: 'a', name: 'Alpha' },
      { type: 'b', name: 'Beta' },
      { type: 'c', name: 'Gamma' },
    ]
    const result = await processTemplate(template, { items })
    expect(result).toContain('Type A: Alpha')
    expect(result).toContain('Type B: Beta')
    expect(result).toContain('Other: Gamma')
  })

  it('@csrf inside @foreach produces tokens', async () => {
    const template = `@foreach(items as item)<form>@csrf</form>@endforeach`
    const result = await processTemplate(template, { items: [1, 2, 3] })
    const tokenMatches = result.match(/_token/g)
    expect(tokenMatches).not.toBeNull()
    expect(tokenMatches!.length).toBe(3)
  })

  it('template with HTML comments interspersed between directives', async () => {
    const template = `
      <!-- comment before -->
      @if(show)
        <!-- comment inside -->
        <div>visible</div>
      @endif
      <!-- comment after -->
    `
    const result = await processTemplate(template, { show: true })
    expect(result).toContain('visible')
  })

  it('template with @push/@prepend and @stack', async () => {
    const template = `
      @push('scripts')
        <script>console.log('pushed')</script>
      @endpush
      @prepend('scripts')
        <script>console.log('prepended')</script>
      @endprepend
      <div>@stack('scripts')</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('prepended')
    expect(result).toContain('pushed')
  })

  it('template with multiline @if conditions', async () => {
    const template = `
      @if(
        items.length > 0
      )
        <span>has items</span>
      @endif
    `
    const result = await processTemplate(template, { items: [1, 2] })
    expect(result).toContain('has items')
  })

  it('template with raw HTML that looks like directives but is inside strings', async () => {
    const template = `<div>{{ text }}</div>`
    const result = await processTemplate(template, { text: '@if(true)fake@endif' })
    expect(result).toContain('@if(true)fake@endif')
  })

  it('template where same variable is used in multiple scopes', async () => {
    const template = `
      @foreach(items as item)
        {{ item }}
      @endforeach
      @foreach(items as item)
        {{ item }}
      @endforeach
    `
    const result = await processTemplate(template, { items: ['A', 'B'] })
    const countA = (result.match(/A/g) || []).length
    expect(countA).toBeGreaterThanOrEqual(2)
  })

  it('template with @break inside nested @if inside @foreach', async () => {
    const template = `
      @foreach(items as item)
        @if(item === 'stop')
          @break
        @endif
        <span>{{ item }}</span>
      @endforeach
    `
    const result = await processTemplate(template, { items: ['a', 'b', 'stop', 'c'] })
    expect(result).toContain('a')
    expect(result).toContain('b')
    expect(result).not.toContain('<span>stop</span>')
  })

  it('template with @continue inside nested @if inside @foreach', async () => {
    const template = `
      @foreach(items as item)
        @if(item === 'skip')
          @continue
        @endif
        <span>{{ item }}</span>
      @endforeach
    `
    const result = await processTemplate(template, { items: ['a', 'skip', 'c'] })
    expect(result).toContain('<span>a</span>')
    expect(result).toContain('<span>c</span>')
    expect(result).not.toContain('<span>skip</span>')
  })

  it('template with expressions containing pipe chars in strings', async () => {
    const result = await processTemplate(`{{ text }}`, { text: 'a|b' })
    expect(result).toContain('a|b')
  })

  it('template with HTML attributes containing {{ }}', async () => {
    const template = `<input value="{{ val }}">`
    const result = await processTemplate(template, { val: 'hello' })
    expect(result).toContain('value="hello"')
  })

  it('template processes 1000-item @foreach in reasonable time', async () => {
    const template = `@foreach(items as item){{ item }}@endforeach`
    const items = Array.from({ length: 1000 }, (_, i) => `x${i}`)
    const start = performance.now()
    const result = await processTemplate(template, { items })
    const elapsed = performance.now() - start
    expect(result).toContain('x999')
    expect(elapsed).toBeLessThan(5000)
  })

  it('escaped @@ directives: @@ produces literal @', async () => {
    const template = `
      @if(true)
        <span>real</span>
      @endif
      <p>contact: user@@example.com</p>
    `
    const result = await processTemplate(template)
    expect(result).toContain('real')
    expect(result).toContain('user@')
  })

  it('template with @for loop counting backwards', async () => {
    const template = `@for(let i = 5; i > 0; i--)<span>{{ i }}</span>@endfor`
    const result = await processTemplate(template)
    expect(result).toContain('<span>5</span>')
    expect(result).toContain('<span>1</span>')
  })

  it('template with multiple @form blocks on same page', async () => {
    const template = `
      @form('POST', '/login')
      @endform
      @form('POST', '/register')
      @endform
    `
    const result = processForms(template, {}, 'test.stx', defaultOptions)
    const formMatches = result.match(/<form/g)
    expect(formMatches).not.toBeNull()
    expect(formMatches!.length).toBe(2)
  })
})

// =============================================================================
// Full pipeline integration edge cases (from edge-case-bugs)
// =============================================================================

describe('Pipeline: Full Integration Edge Cases', () => {
  it('should handle HTML comment {{-- comment --}} removal', async () => {
    const result = await processTemplate('before{{-- this is a comment --}}after')
    expect(result).toContain('before')
    expect(result).toContain('after')
    expect(result).not.toContain('this is a comment')
  })

  it('should handle escaped @@if becoming @if literal', async () => {
    const result = await processTemplate('@@if(true)not a directive@@endif')
    expect(result).toContain('@if(true)')
    expect(result).toContain('@endif')
  })

  it('should handle nested conditional inside loop inside conditional', async () => {
    const template = `@if(show)@foreach(items as item)@if(item > 1){{ item }},@endif@endforeach@endif`
    const result = await processTemplate(template, { show: true, items: [1, 2, 3] })
    expect(result).toContain('2,')
    expect(result).toContain('3,')
    expect(result).not.toContain('1,')
  })

  it('@form/@endform in full pipeline', async () => {
    const template = `@form('PUT', '/api/update')
  @csrf
  @method('PUT')
@endform`
    const result = await processTemplate(template)
    expect(result).toContain('<form')
    expect(result).toContain('_token')
    expect(result).toContain('_method')
    expect(result).toContain('PUT')
    expect(result).toContain('</form>')
  })

  it('should handle @forelse with @if inside each iteration', async () => {
    const template = `@forelse(items as item)@if(item > 2){{ item }}@endif @empty none@endforelse`
    const result = await processTemplate(template, { items: [1, 2, 3, 4] })
    expect(result).toContain('3')
    expect(result).toContain('4')
    expect(result).not.toContain('none')
  })

  it('should handle template with Unicode content', async () => {
    const result = await processTemplate('<p>{{ greeting }}</p>', { greeting: 'Hello World' })
    expect(result).toContain('Hello')
  })

  it('should handle template with HTML entities that look like expressions', async () => {
    const result = await processTemplate('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('should handle expression inside HTML attributes', async () => {
    const result = await processTemplate('<div class="{{ cls }}">content</div>', { cls: 'active' })
    expect(result).toContain('class="active"')
  })

  it('@for loop basic functionality', async () => {
    const template = '@for(let i = 0; i < 3; i++){{ i }},@endfor'
    const result = await processTemplate(template)
    expect(result).toContain('0,')
    expect(result).toContain('1,')
    expect(result).toContain('2,')
  })

  it('should handle @switch inside @foreach', async () => {
    const template = `@foreach(items as item)@switch(item)@case('a')A@break@case('b')B@break@default X@endswitch,@endforeach`
    const result = await processTemplate(template, { items: ['a', 'b', 'c'] })
    expect(result).toContain('A,')
    expect(result).toContain('B,')
    expect(result).toContain('X,')
  })

  it('should handle multiple @switch blocks in same template', async () => {
    const template = `@switch(x)@case(1)one@break@default other@endswitch|@switch(y)@case('a')alpha@break@default beta@endswitch`
    const result = await processTemplate(template, { x: 1, y: 'a' })
    expect(result).toContain('one')
    expect(result).toContain('alpha')
  })

  it('should handle @env directive in full pipeline', async () => {
    const template = '@env(\'test\')test mode@endenv @env(\'production\')prod mode@endenv'
    const result = await processTemplate(template)
    expect(result).toBeDefined()
  })

  it('should handle @isset/@empty in full pipeline', async () => {
    const template = '@isset(name)Hello {{ name }}@endisset @empty(missing)nothing here@endempty'
    const result = await processTemplate(template, { name: 'Alice' })
    expect(result).toContain('Hello Alice')
    expect(result).toContain('nothing here')
  })

  it('should handle expression with || fallback', async () => {
    const result = await processTemplate('{{ name || "Guest" }}', { name: '' })
    expect(result).toContain('Guest')
  })

  it('should handle expression with ?? nullish coalescing', async () => {
    const result = await processTemplate('{{ val ?? "default" }}', { val: null })
    expect(result).toContain('default')
  })

  it('should handle very large template with 100 @foreach items', async () => {
    const items = Array.from({ length: 100 }, (_, i) => `item${i}`)
    const template = '@foreach(items as item){{ item }},@endforeach'
    const result = await processTemplate(template, { items })
    expect(result).toContain('item0,')
    expect(result).toContain('item99,')
  })

  it('should pass through template with only HTML (no directives) unchanged', async () => {
    const html = '<div><p>Hello World</p></div>'
    const result = await processTemplate(html)
    expect(result).toContain('<div><p>Hello World</p></div>')
  })

  it('should produce stable results when processed twice (idempotent)', async () => {
    const template = '<p>{{ name }}</p>'
    const context = { name: 'Alice' }
    const result1 = await processTemplate(template, { ...context })
    const result2 = await processTemplate(result1, { ...context })
    expect(result1).toBe(result2)
  })

  it('should handle complex real-world page template with multiple features', async () => {
    const template = `<html>
<head></head>
<body>
  <h1>{{ title }}</h1>
  @if(showList)
  <ul>
    @foreach(items as item)
      <li>{{ item }}</li>
    @endforeach
  </ul>
  @else
    <p>No items</p>
  @endif
  @csrf
</body>
</html>`
    const result = await processTemplate(template, {
      title: 'My Page',
      showList: true,
      items: ['One', 'Two', 'Three'],
    })
    expect(result).toContain('<h1>My Page</h1>')
    expect(result).toContain('<li>One</li>')
    expect(result).toContain('<li>Two</li>')
    expect(result).toContain('<li>Three</li>')
    expect(result).toContain('_token')
    expect(result).not.toContain('No items')
  })
})

// =============================================================================
// Real-World Page Templates (from regression-bugs)
// =============================================================================

describe('Pipeline: Real-World Page Templates (regression)', () => {
  it('should render a blog index page with posts loop', async () => {
    const template = `<div class="blog">
  <h1>{{ title }}</h1>
  @foreach(posts as post)
    <article>
      <h2>{{ post.title }}</h2>
      <time>{{ post.date }}</time>
      <p>{{ post.excerpt }}</p>
      <span>By {{ post.author }}</span>
    </article>
  @endforeach
</div>`
    const context = {
      title: 'My Blog',
      posts: [
        { title: 'First Post', date: '2025-01-15', excerpt: 'Hello world', author: 'Alice' },
        { title: 'Second Post', date: '2025-02-20', excerpt: 'Another day', author: 'Bob' },
      ],
    }
    const result = await processTemplate(template, context)
    expect(result).toContain('My Blog')
    expect(result).toContain('First Post')
    expect(result).toContain('Second Post')
    expect(result).toContain('By Alice')
    expect(result).toContain('By Bob')
  })

  it('should render a user profile with conditional auth display', async () => {
    const template = `<div class="profile">
  @if(authenticated)
    <img src="{{ user.avatar }}" alt="{{ user.name }}">
    <h1>{{ user.name }}</h1>
    <p>{{ user.bio }}</p>
    @if(user.isAdmin)
      <span class="badge">Admin</span>
    @endif
  @else
    <p>Please log in to view this profile.</p>
  @endif
</div>`
    const context = {
      authenticated: true,
      user: { name: 'Jane Doe', avatar: '/img/jane.png', bio: 'Developer from NYC', isAdmin: true },
    }
    const result = await processTemplate(template, context)
    expect(result).toContain('Jane Doe')
    expect(result).toContain('/img/jane.png')
    expect(result).toContain('Developer from NYC')
    expect(result).toContain('Admin')
    expect(result).not.toContain('Please log in')
  })

  it('should render a navigation menu with active item conditional', async () => {
    const template = `<nav>
  @foreach(menuItems as item)
    @if(item.url === currentUrl)
      <a href="{{ item.url }}" class="active">{{ item.label }}</a>
    @else
      <a href="{{ item.url }}">{{ item.label }}</a>
    @endif
  @endforeach
</nav>`
    const context = {
      currentUrl: '/about',
      menuItems: [
        { url: '/', label: 'Home' },
        { url: '/about', label: 'About' },
        { url: '/contact', label: 'Contact' },
      ],
    }
    const result = await processTemplate(template, context)
    expect(result).toContain('href="/"')
    expect(result).toContain('class="active"')
    expect(result).toContain('About')
    expect(result).toContain('Contact')
    const activeMatches = result.match(/class="active"/g)
    expect(activeMatches?.length).toBe(1)
  })

  it('should render a search results page with forelse for no results', async () => {
    const template = `<div class="search">
  <h1>Search Results for "{{ query }}"</h1>
  <p>{{ results.length }} results found</p>
  @forelse(results as result)
    <div class="result">
      <a href="{{ result.url }}">{{ result.title }}</a>
      <p>{{ result.snippet }}</p>
    </div>
  @empty
    <p class="no-results">No results found for "{{ query }}".</p>
  @endforelse
</div>`
    const context1 = {
      query: 'stx templates',
      results: [{ url: '/docs', title: 'Documentation', snippet: 'Learn about stx...' }],
    }
    const result1 = await processTemplate(template, context1)
    expect(result1).toContain('Documentation')
    expect(result1).not.toContain('No results found')

    const context2 = { query: 'xyz123', results: [] }
    const result2 = await processTemplate(template, context2)
    expect(result2).toContain('No results found')
    expect(result2).toContain('0 results found')
  })

  it('should render an admin table with index and conditional action buttons', async () => {
    const template = `<table>
  <thead><tr><th>#</th><th>Name</th><th>Role</th><th>Actions</th></tr></thead>
  <tbody>
    @foreach(users as idx => user)
      <tr>
        <td>{{ idx + 1 }}</td>
        <td>{{ user.name }}</td>
        <td>{{ user.role }}</td>
        <td>
          @if(user.role !== 'admin')
            <button class="delete">Delete</button>
          @endif
          <button class="edit">Edit</button>
        </td>
      </tr>
    @endforeach
  </tbody>
</table>`
    const context = {
      users: [
        { name: 'Admin User', role: 'admin' },
        { name: 'Editor User', role: 'editor' },
        { name: 'Viewer User', role: 'viewer' },
      ],
    }
    const result = await processTemplate(template, context)
    expect(result).toContain('Admin User')
    expect(result).toContain('Editor User')
    expect(result).toContain('Viewer User')
    const deleteCount = (result.match(/class="delete"/g) || []).length
    expect(deleteCount).toBe(2)
    const editCount = (result.match(/class="edit"/g) || []).length
    expect(editCount).toBe(3)
  })

  it('should render a comment thread with nested replies', async () => {
    const template = `<div class="comments">
  @foreach(comments as comment)
    @if(!comment.deleted)
      <div class="comment">
        <strong>{{ comment.author }}</strong>
        <p>{{ comment.text }}</p>
        @if(comment.replies.length > 0)
          <div class="replies">
            @foreach(comment.replies as reply)
              <div class="reply">
                <strong>{{ reply.author }}</strong>
                <p>{{ reply.text }}</p>
              </div>
            @endforeach
          </div>
        @endif
      </div>
    @else
      <div class="comment deleted">[This comment has been deleted]</div>
    @endif
  @endforeach
</div>`
    const context = {
      comments: [
        { author: 'Alice', text: 'Great article!', deleted: false, replies: [
          { author: 'Bob', text: 'I agree!' },
        ] },
        { author: 'Troll', text: 'Bad content', deleted: true, replies: [] },
        { author: 'Charlie', text: 'Thanks for sharing.', deleted: false, replies: [] },
      ],
    }
    const result = await processTemplate(template, context)
    expect(result).toContain('Great article!')
    expect(result).toContain('I agree!')
    expect(result).toContain('[This comment has been deleted]')
    expect(result).toContain('Thanks for sharing.')
    expect(result).not.toContain('Bad content')
  })

  it('should render an API response rendering page with conditional status', async () => {
    const template = `<div class="api-response">
  @if(status === 200)
    <h2>Success</h2>
    @foreach(data as item)
      <div>{{ item.id }}: {{ item.name }}</div>
    @endforeach
  @elseif(status === 404)
    <h2>Not Found</h2>
    <p>The resource was not found.</p>
  @else
    <h2>Error {{ status }}</h2>
    <p>{{ errorMessage }}</p>
  @endif
</div>`
    const context = {
      status: 200,
      data: [
        { id: 1, name: 'Item One' },
        { id: 2, name: 'Item Two' },
      ],
      errorMessage: '',
    }
    const result = await processTemplate(template, context)
    expect(result).toContain('Success')
    expect(result).toContain('1: Item One')
    expect(result).toContain('2: Item Two')
    expect(result).not.toContain('Not Found')
  })
})

// =============================================================================
// Error Recovery Tests (from regression-bugs)
// =============================================================================

describe('Pipeline: Error Recovery', () => {
  it('should handle missing @endif for @if gracefully', async () => {
    const template = `@if(true)
  <div>Open block</div>`
    const result = await processTemplate(template, {})
    expect(typeof result).toBe('string')
  })

  it('should handle missing @endforeach gracefully', async () => {
    const template = `@foreach(items as item)
  <div>{{ item }}</div>`
    const result = await processTemplate(template, { items: ['a', 'b'] })
    expect(typeof result).toBe('string')
  })

  it('should handle @foreach with non-iterable value', async () => {
    const template = `@foreach(notAnArray as item)
  <div>{{ item }}</div>
@endforeach`
    const result = await processTemplate(template, { notAnArray: 42 })
    expect(typeof result).toBe('string')
    expect(result).not.toContain('undefined')
  })

  it('should handle @if with syntax error in condition', async () => {
    const template = `@if(&&& invalid !!!)
  <div>Should not render</div>
@endif`
    const result = await processTemplate(template, {})
    expect(typeof result).toBe('string')
  })

  it('should handle deeply nested unclosed tags without crashing', async () => {
    const template = `@if(true)
  @if(true)
    @if(true)
      <div>Deep</div>`
    const result = await processTemplate(template, {})
    expect(typeof result).toBe('string')
  })
})

// =============================================================================
// @if Condition Evaluation Stress (from deep-edge-cases)
// =============================================================================

describe('Pipeline: @if Condition Evaluation Stress', () => {
  it('long chained && condition', async () => {
    const template = `@if(a && b && c && d && e && f && g)<span>all true</span>@endif`
    const ctx = { a: true, b: true, c: true, d: true, e: true, f: true, g: true }
    const result = await processTemplate(template, ctx)
    expect(result).toContain('all true')
  })

  it('long chained && condition where one is false', async () => {
    const template = `@if(a && b && c && d && e && f && g)<span>all true</span>@endif`
    const ctx = { a: true, b: true, c: true, d: false, e: true, f: true, g: true }
    const result = await processTemplate(template, ctx)
    expect(result).not.toContain('all true')
  })

  it('condition with nested function calls: items.filter(x => x > 0).length > 0', async () => {
    const template = `@if(items.filter(x => x > 0).length > 0)<span>has positive</span>@endif`
    const result = await processTemplate(template, { items: [1, -2, 3] })
    expect(result).toContain('has positive')
  })

  it('condition with string includes', async () => {
    const template = `@if(name.includes('admin'))<span>is admin</span>@endif`
    const result = await processTemplate(template, { name: 'admin_user' })
    expect(result).toContain('is admin')
  })

  it('condition referencing non-existent variable', async () => {
    const template = `@if(nonExistentVar)<span>visible</span>@endif`
    const result = await processTemplate(template, {})
    expect(result).not.toContain('visible')
  })

  it('condition with deeply nested property: a.b.c.d.e', async () => {
    const template = `@if(a.b.c.d.e)<span>deep</span>@endif`
    const ctx = { a: { b: { c: { d: { e: true } } } } }
    const result = await processTemplate(template, ctx)
    expect(result).toContain('deep')
  })

  it('condition with Math: Math.floor(score / 10) >= 9', async () => {
    const template = `@if(Math.floor(score / 10) >= 9)<span>high</span>@endif`
    const result = await processTemplate(template, { score: 95 })
    expect(result).toContain('high')
  })

  it('condition mixing && and ||: (a || b) && (c || d)', async () => {
    const template = `@if((a || b) && (c || d))<span>yes</span>@endif`
    const result = await processTemplate(template, { a: false, b: true, c: false, d: true })
    expect(result).toContain('yes')
  })

  it('condition with double negation: !!value', async () => {
    const template = `@if(!!value)<span>truthy</span>@endif`
    const result = await processTemplate(template, { value: 'hello' })
    expect(result).toContain('truthy')
  })

  it('condition that accesses property on undefined (short-circuit)', async () => {
    const template = `@if(undefinedVar && undefinedVar.property)<span>visible</span>@endif`
    const result = await processTemplate(template, {})
    expect(result).not.toContain('visible')
  })

  it('condition with NaN check: val !== val', async () => {
    const template = `@if(val !== val)<span>is NaN</span>@endif`
    const result = await processTemplate(template, { val: NaN })
    expect(result).toContain('is NaN')
  })
})

// =============================================================================
// @switch Stress Tests (from deep-edge-cases)
// =============================================================================

describe('Pipeline: @switch Stress Tests', () => {
  it('@switch with many cases (10)', async () => {
    const cases = Array.from({ length: 10 }, (_, i) =>
      `@case(${i})<span>case${i}</span>@break`,
    ).join('\n')
    const template = `@switch(val)\n${cases}\n@default<span>default</span>\n@endswitch`
    const result = await processTemplate(template, { val: 7 })
    expect(result).toContain('case7')
    expect(result).not.toContain('case0')
  })

  it('@switch with null case value', async () => {
    const template = `
      @switch(val)
        @case(null)
          <span>null case</span>
          @break
        @default
          <span>default case</span>
      @endswitch
    `
    const result = await processTemplate(template, { val: null })
    expect(typeof result).toBe('string')
  })

  it('@switch with nested @if inside case', async () => {
    const template = `
      @switch(type)
        @case('special')
          @if(extra)
            <span>special+extra</span>
          @else
            <span>special only</span>
          @endif
          @break
        @default
          <span>default</span>
      @endswitch
    `
    const result = await processTemplate(template, { type: 'special', extra: true })
    expect(result).toContain('special+extra')
    expect(result).not.toContain('default')
  })

  it('@switch with @foreach inside case', async () => {
    const template = `
      @switch(mode)
        @case('list')
          @foreach(items as item)
            <li>{{ item }}</li>
          @endforeach
          @break
        @default
          <span>no list</span>
      @endswitch
    `
    const result = await processTemplate(template, { mode: 'list', items: ['a', 'b'] })
    expect(result).toContain('<li>a</li>')
    expect(result).toContain('<li>b</li>')
  })

  it('@switch immediately after another @switch', async () => {
    const template = `
      @switch(a)
        @case(1)<span>a1</span>@break
        @default<span>a-default</span>
      @endswitch
      @switch(b)
        @case(2)<span>b2</span>@break
        @default<span>b-default</span>
      @endswitch
    `
    const result = await processTemplate(template, { a: 1, b: 2 })
    expect(result).toContain('a1')
    expect(result).toContain('b2')
  })

  it('@switch with default only', async () => {
    const template = `
      @switch(val)
        @default
          <span>always default</span>
      @endswitch
    `
    const result = await processTemplate(template, { val: 'anything' })
    expect(result).toContain('always default')
  })

  it('@switch where no case matches and no default', async () => {
    const template = `
      @switch(val)
        @case('a')<span>A</span>@break
        @case('b')<span>B</span>@break
      @endswitch
    `
    const result = await processTemplate(template, { val: 'c' })
    expect(result).not.toContain('<span>A</span>')
    expect(result).not.toContain('<span>B</span>')
  })

  it('@switch with boolean case values', async () => {
    const template = `
      @switch(flag)
        @case(true)
          <span>on</span>
          @break
        @case(false)
          <span>off</span>
          @break
      @endswitch
    `
    const result = await processTemplate(template, { flag: true })
    expect(result).toContain('on')
    expect(result).not.toContain('off')
  })
})

// =============================================================================
// Variable Extractor via Pipeline (from deep-edge-cases)
// =============================================================================

describe('Pipeline: Variable Extractor Edge Cases', () => {
  it('script with spread in destructuring: const { a, ...rest } = obj', async () => {
    const template = `
      <script server>
      const obj = { a: 1, b: 2, c: 3 }
      const { a, ...rest } = obj
      </script>
      <div>{{ a }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('1')
  })

  it('script with default values: const { a = 1 } = obj', async () => {
    const template = `
      <script server>
      const obj = {}
      const { a = 42 } = obj
      </script>
      <div>{{ a }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('42')
  })

  it('script with regex literal: const re = /test/g', async () => {
    const template = `
      <script server>
      const text = 'test123test'
      const re = /test/g
      const matches = text.match(re)
      const count = matches ? matches.length : 0
      </script>
      <div>{{ count }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('2')
  })

  it('script with comments between declarations', async () => {
    const template = `
      <script server>
      // first variable
      const a = 'hello'
      /* second variable */
      const b = 'world'
      </script>
      <div>{{ a }} {{ b }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('hello')
    expect(result).toContain('world')
  })

  it('script with empty script tag', async () => {
    const template = `
      <script server></script>
      <div>static content</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('static content')
  })

  it('script with arrow function', async () => {
    const template = `
      <script server>
      const double = (x) => x * 2
      const result = double(21)
      </script>
      <div>{{ result }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('42')
  })

  it('script with array destructuring', async () => {
    const template = `
      <script server>
      const [first, second] = ['one', 'two']
      </script>
      <div>{{ first }} {{ second }}</div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('one')
    expect(result).toContain('two')
  })
})
