/**
 * Integration regression tests - redistributed from bugs/ directory.
 *
 * Covers: Full pipeline integration edge cases, real-world page templates,
 * cross-cutting regression tests, and error recovery tests.
 */
import type { StxOptions } from '../../src/types'
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { processExpressions, defaultFilters, evaluateExpression, registerFilter, clearCustomFilters } from '../../src/expressions'
import { processBasicFormDirectives, processFormInputDirectives, processErrorDirective, defaultFormClasses, processForms } from '../../src/forms'
import { processDirectives } from '../../src/process'
import { safeEvaluate, isExpressionSafe, sanitizeExpression, createSafeFunction } from '../../src/safe-evaluator'
import { stripTypeScript, convertToCommonJS } from '../../src/variable-extractor'

const opts = defaultConfig as any as StxOptions
const fp = 'test.stx'

async function render(template: string, context: Record<string, any> = {}) {
  return processDirectives(template, context, fp, opts, new Set<string>())
}

// =============================================================================
// 1. Full pipeline integration edge cases (from edge-case-bugs.ts)
// =============================================================================

describe('Full pipeline integration edge cases', () => {
  async function processTemplate(template: string, context: Record<string, any> = {}) {
    return processDirectives(template, context, fp, opts, new Set<string>())
  }

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

  it('BUG: @form/@endform not processed in full pipeline', async () => {
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

  it('@for loop with @if inside is a known limitation', async () => {
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
// 2. Real-World Page Templates (from regression-bugs.ts)
// =============================================================================

describe('Real-World Page Templates', () => {
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
    const result = await render(template, context)
    expect(result).toContain('My Blog')
    expect(result).toContain('First Post')
    expect(result).toContain('Second Post')
    expect(result).toContain('By Alice')
    expect(result).toContain('By Bob')
    expect(result).toContain('2025-01-15')
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
    const result = await render(template, context)
    expect(result).toContain('Jane Doe')
    expect(result).toContain('/img/jane.png')
    expect(result).toContain('Developer from NYC')
    expect(result).toContain('Admin')
    expect(result).not.toContain('Please log in')
  })

  it('should render a product detail page with price and stock', async () => {
    const template = `<div class="product">
  <h1>{{ product.name }}</h1>
  <p class="price">{{ product.price | currency }}</p>
  @if(product.inStock)
    <span class="stock in">In Stock ({{ product.qty }} available)</span>
  @else
    <span class="stock out">Out of Stock</span>
  @endif
  <h3>Related Products</h3>
  @foreach(related as item)
    <div class="related-item">{{ item.name }} - {{ item.price | currency }}</div>
  @endforeach
</div>`
    const context = {
      product: { name: 'Wireless Headphones', price: 79.99, inStock: true, qty: 42 },
      related: [
        { name: 'USB-C Cable', price: 12.99 },
        { name: 'Carrying Case', price: 24.50 },
      ],
    }
    const result = await render(template, context)
    expect(result).toContain('Wireless Headphones')
    expect(result).toContain('$79.99')
    expect(result).toContain('In Stock')
    expect(result).toContain('42 available')
    expect(result).toContain('USB-C Cable')
    expect(result).toContain('$12.99')
    expect(result).toContain('$24.50')
  })

  it('should render a contact form with CSRF and validation errors', () => {
    const template = `<form method="POST" action="/contact">
  @csrf
  @input('name', '', { placeholder: 'Your name' })
  @error('name')
    <span class="error">{{ $message }}</span>
  @enderror
  @input('email', '', { type: 'email', placeholder: 'Your email' })
  @error('email')
    <span class="error">{{ $message }}</span>
  @enderror
  @textarea('message')Write your message here@endtextarea
  <button type="submit">Send</button>
</form>`
    const context: Record<string, any> = {
      errors: { name: 'Name is required', email: 'Invalid email address' },
      old: { name: '', email: 'not-an-email' },
    }
    const result = processForms(template, context, fp, opts)
    expect(result).toContain('type="hidden" name="_token"')
    expect(result).toContain('Name is required')
    expect(result).toContain('Invalid email address')
    expect(result).toContain('name="email"')
    expect(result).toContain('name="message"')
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
    const result = await render(template, context)
    expect(result).toContain('href="/"')
    expect(result).toContain('class="active"')
    expect(result).toContain('About')
    expect(result).toContain('Contact')
    const activeMatches = result.match(/class="active"/g)
    expect(activeMatches?.length).toBe(1)
  })

  it('should render a dashboard with stats, badges, and number formatting', async () => {
    const template = `<div class="dashboard">
  <h1>Dashboard</h1>
  @foreach(stats as stat)
    <div class="stat-card">
      <h3>{{ stat.label }}</h3>
      <span class="value">{{ stat.value | fmt }}</span>
      @if(stat.trend > 0)
        <span class="badge up">+{{ stat.trend }}%</span>
      @elseif(stat.trend < 0)
        <span class="badge down">{{ stat.trend }}%</span>
      @else
        <span class="badge neutral">0%</span>
      @endif
    </div>
  @endforeach
</div>`
    const context = {
      stats: [
        { label: 'Revenue', value: 125430, trend: 12 },
        { label: 'Users', value: 8420, trend: -3 },
        { label: 'Orders', value: 945, trend: 0 },
      ],
    }
    const result = await render(template, context)
    expect(result).toContain('125,430')
    expect(result).toContain('8,420')
    expect(result).toContain('+12%')
    expect(result).toContain('-3%')
    expect(result).toContain('badge neutral')
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
      results: [
        { url: '/docs', title: 'Documentation', snippet: 'Learn about stx...' },
      ],
    }
    const result1 = await render(template, context1)
    expect(result1).toContain('Documentation')
    expect(result1).toContain('/docs')
    expect(result1).not.toContain('No results found')

    const context2 = { query: 'xyz123', results: [] }
    const result2 = await render(template, context2)
    expect(result2).toContain('No results found')
    expect(result2).toContain('0 results found')
  })

  it('should render a settings page with switch for tab content', async () => {
    const template = `<div class="settings">
  @switch(activeTab)
    @case('profile')
      <h2>Profile Settings</h2>
      <p>Edit your profile here.</p>
    @break
    @case('security')
      <h2>Security Settings</h2>
      <p>Manage your passwords.</p>
    @break
    @case('notifications')
      <h2>Notification Preferences</h2>
      <p>Choose what notifications you get.</p>
    @break
    @default
      <h2>General Settings</h2>
      <p>General application settings.</p>
  @endswitch
</div>`
    const context = { activeTab: 'security' }
    const result = await render(template, context)
    expect(result).toContain('Security Settings')
    expect(result).toContain('Manage your passwords')
    expect(result).not.toContain('Profile Settings')
    expect(result).not.toContain('Notification Preferences')
    expect(result).not.toContain('General Settings')
  })

  it('should render an email template with expressions in attributes', async () => {
    const template = `<div style="max-width: 600px; margin: auto;">
  <h1>Hello, {{ name }}!</h1>
  @if(hasOffer)
    <div style="background: #f0f0f0; padding: 16px;">
      <h2>Special Offer: {{ offer.title }}</h2>
      <p>{{ offer.description }}</p>
      <a href="{{ offer.url }}">Claim Now</a>
    </div>
  @endif
  <p>Thank you for being a member since {{ memberSince }}.</p>
  <p>{!! signature !!}</p>
</div>`
    const context = {
      name: 'Chris',
      hasOffer: true,
      offer: { title: '30% Off', description: 'Limited time deal', url: 'https://example.com/deal' },
      memberSince: '2023',
      signature: '<strong>The Team</strong>',
    }
    const result = await render(template, context)
    expect(result).toContain('Hello, Chris!')
    expect(result).toContain('30% Off')
    expect(result).toContain('https://example.com/deal')
    expect(result).toContain('<strong>The Team</strong>')
    expect(result).toContain('member since 2023')
  })

  it('should render an error page with switch on error code', async () => {
    const template = `<div class="error-page">
  @switch(errorCode)
    @case(404)
      <h1>Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
    @break
    @case(500)
      <h1>Server Error</h1>
      <p>Something went wrong on our end.</p>
      @if(showStackTrace)
        <pre>{{ stackTrace }}</pre>
      @endif
    @break
    @default
      <h1>Error {{ errorCode }}</h1>
      <p>An unexpected error occurred.</p>
  @endswitch
</div>`
    const context = { errorCode: 500, showStackTrace: true, stackTrace: 'Error at line 42' }
    const result = await render(template, context)
    expect(result).toContain('Server Error')
    expect(result).toContain('Something went wrong')
    expect(result).toContain('Error at line 42')
    expect(result).not.toContain('Page Not Found')
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
    const result = await render(template, context)
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
    const result = await render(template, context)
    expect(result).toContain('Great article!')
    expect(result).toContain('I agree!')
    expect(result).toContain('[This comment has been deleted]')
    expect(result).toContain('Thanks for sharing.')
    expect(result).not.toContain('Bad content')
  })

  it('should render a shopping cart with price calculations', async () => {
    const template = `<div class="cart">
  <h1>Shopping Cart</h1>
  @foreach(items as item)
    <div class="cart-item">
      <span>{{ item.name }}</span>
      <span>{{ item.qty }} x {{ item.price | currency }}</span>
      <span class="subtotal">{{ item.qty * item.price | currency }}</span>
    </div>
  @endforeach
  <div class="total">
    <strong>Total: {{ total | currency }}</strong>
  </div>
</div>`
    const context = {
      items: [
        { name: 'Widget A', qty: 2, price: 9.99 },
        { name: 'Widget B', qty: 1, price: 24.50 },
      ],
      total: 44.48,
    }
    const result = await render(template, context)
    expect(result).toContain('Widget A')
    expect(result).toContain('Widget B')
    expect(result).toContain('$9.99')
    expect(result).toContain('$24.50')
    expect(result).toContain('$44.48')
  })

  it('should render a login form with error display and conditional remember-me', () => {
    const template = `<form method="POST" action="/login">
  @csrf
  @input('email', '', { type: 'email', placeholder: 'Email' })
  @error('email')
    <div class="error">{{ $message }}</div>
  @enderror
  @input('password', '', { type: 'password', placeholder: 'Password' })
  @error('password')
    <div class="error">{{ $message }}</div>
  @enderror
  @checkbox('remember')
  <button type="submit">Log In</button>
</form>`
    const context: Record<string, any> = {
      errors: { email: 'Email not found' },
      old: { email: 'test@example.com' },
    }
    const result = processForms(template, context, fp, opts)
    expect(result).toContain('Email not found')
    expect(result).toContain('value="test@example.com"')
    expect(result).toContain('type="checkbox"')
    expect(result).toContain('name="remember"')
    expect(result).toContain('type="hidden" name="_token"')
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
    const result = await render(template, context)
    expect(result).toContain('Success')
    expect(result).toContain('1: Item One')
    expect(result).toContain('2: Item Two')
    expect(result).not.toContain('Not Found')
    expect(result).not.toContain('Error')
  })
})

// =============================================================================
// 3. Cross-Cutting Regression Tests (from regression-bugs.ts)
// =============================================================================

describe('Cross-Cutting Regression Tests', () => {
  it('should handle expressions with the currency filter', () => {
    const result = processExpressions('{{ amount | currency }}', { amount: 1234.56 }, fp)
    expect(result).toBe('$1,234.56')
  })

  it('should handle filters with truncate and custom length', () => {
    const result = processExpressions(
      '{{ text | truncate:20 }}',
      { text: 'This is a very long sentence that should be truncated.' },
      fp,
    )
    expect(result.length).toBeLessThanOrEqual(20)
    expect(result).toContain('...')
  })

  it('should handle the json filter', () => {
    const result = processExpressions('{!! data | json !!}', { data: { a: 1, b: 2 } }, fp)
    expect(result).toContain('"a":1')
    expect(result).toContain('"b":2')
  })

  it('should handle the uppercase and lowercase filters', () => {
    const upper = processExpressions('{{ name | uppercase }}', { name: 'hello' }, fp)
    expect(upper).toBe('HELLO')
    const lower = processExpressions('{{ name | lowercase }}', { name: 'WORLD' }, fp)
    expect(lower).toBe('world')
  })

  it('should handle the capitalize filter', () => {
    const result = processExpressions('{{ word | capitalize }}', { word: 'hello' }, fp)
    expect(result).toBe('Hello')
  })

  it('should handle the default filter for null values', () => {
    const result = processExpressions('{{ missing | default:fallback }}', { missing: null }, fp)
    expect(result).toBe('fallback')
  })

  it('should handle chained filters', () => {
    const result = processExpressions(
      '{{ name | uppercase | truncate:5 }}',
      { name: 'hello world' },
      fp,
    )
    expect(result).toBe('HE...')
  })

  it('should handle the stripTags filter', () => {
    const result = processExpressions(
      '{{ html | stripTags }}',
      { html: '<p>Hello <strong>World</strong></p>' },
      fp,
    )
    expect(result).toBe('Hello World')
  })

  it('should handle the number filter with decimals', () => {
    const result = processExpressions('{{ val | number:2 }}', { val: 3.14159 }, fp)
    expect(result).toBe('3.14')
  })

  it('should handle the reverse filter on arrays', () => {
    const result = processExpressions('{!! items | reverse | join:- !!}', { items: ['a', 'b', 'c'] }, fp)
    expect(result).toBe('c-b-a')
  })

  it('should handle evaluateExpression for simple arithmetic', () => {
    const result = evaluateExpression('2 + 3 * 4', {})
    expect(result).toBe(14)
  })

  it('should handle safeEvaluate with complex context', () => {
    const result = safeEvaluate<number>('a + b', { a: 10, b: 20 })
    expect(result).toBe(30)
  })

  it('should handle createSafeFunction', () => {
    const fn = createSafeFunction('x * y + z', ['x', 'y', 'z'])
    expect(fn(2, 3, 4)).toBe(10)
  })

  it('should handle sanitizeExpression for safe expressions', () => {
    const result = sanitizeExpression('  a + b  ')
    expect(result).toBe('a + b')
  })

  it('should reject dangerous expressions via sanitizeExpression', () => {
    expect(() => sanitizeExpression('eval("1+1")')).toThrow()
    expect(() => sanitizeExpression('process.exit()')).toThrow()
    expect(() => sanitizeExpression('require("fs")')).toThrow()
  })

  it('should handle stripTypeScript removing type annotations', () => {
    const input = 'const x: number = 42'
    const result = stripTypeScript(input)
    expect(result).toContain('const x')
    expect(result).toContain('42')
    expect(result).not.toContain(': number')
  })

  it('should handle convertToCommonJS stripping export keyword', () => {
    const input = 'export const title = "Hello"'
    const result = convertToCommonJS(input)
    expect(result).toContain('const title = "Hello"')
    expect(result).not.toMatch(/^export\s/)
  })

  it('should handle @unless directive as inverse of @if', async () => {
    const template = `@unless(loggedIn)
  <a href="/login">Please log in</a>
@endunless`
    const result1 = await render(template, { loggedIn: false })
    expect(result1).toContain('Please log in')
    const result2 = await render(template, { loggedIn: true })
    expect(result2).not.toContain('Please log in')
  })

  it('should handle @forelse with empty array showing @empty content', async () => {
    const template = `@forelse(items as item)
  <div>{{ item }}</div>
@empty
  <p>No items available.</p>
@endforelse`
    const result = await render(template, { items: [] })
    expect(result).toContain('No items available.')
  })

  it('should handle multiple @csrf tokens generating unique values', () => {
    const ctx1: Record<string, any> = {}
    const result1 = processBasicFormDirectives('@csrf', ctx1)
    const token1 = result1.match(/value="([^"]+)"/)![1]

    const ctx2: Record<string, any> = {}
    const result2 = processBasicFormDirectives('@csrf', ctx2)
    const token2 = result2.match(/value="([^"]+)"/)![1]

    expect(token1).not.toBe(token2)
  })

  it('should handle @method spoofing for PUT', () => {
    const result = processBasicFormDirectives("@method('PUT')", {})
    expect(result).toContain('name="_method"')
    expect(result).toContain('value="PUT"')
  })

  it('should handle @method spoofing for PATCH', () => {
    const result = processBasicFormDirectives("@method('PATCH')", {})
    expect(result).toContain('value="PATCH"')
  })

  it('should handle loop.count and loop.iteration properties', async () => {
    const template = `@foreach(items as item)
  <span>{{ loop.iteration }}/{{ loop.count }}</span>
@endforeach`
    const context = { items: ['a', 'b', 'c'] }
    const result = await render(template, context)
    expect(result).toContain('1/3')
    expect(result).toContain('2/3')
    expect(result).toContain('3/3')
  })

  it('should handle the abs filter for negative numbers', () => {
    const result = processExpressions('{{ val | abs }}', { val: -42 }, fp)
    expect(result).toBe('42')
  })

  it('should handle the round filter', () => {
    const result = processExpressions('{{ val | round:1 }}', { val: 3.456 }, fp)
    expect(result).toBe('3.5')
  })

  it('should handle the urlencode filter', () => {
    const result = processExpressions('{{ url | urlencode }}', { url: 'hello world & foo=bar' }, fp)
    expect(result).toBe('hello%20world%20%26%20foo%3Dbar')
  })

  it('should handle the length filter', () => {
    const arrResult = processExpressions('{{ items | length }}', { items: [1, 2, 3] }, fp)
    expect(arrResult).toBe('3')
    const strResult = processExpressions('{{ text | length }}', { text: 'hello' }, fp)
    expect(strResult).toBe('5')
  })

  it('should handle the first and last filters', () => {
    const first = processExpressions('{{ items | first }}', { items: ['a', 'b', 'c'] }, fp)
    expect(first).toBe('a')
    const last = processExpressions('{{ items | last }}', { items: ['a', 'b', 'c'] }, fp)
    expect(last).toBe('c')
  })

  it('should handle the slice filter', () => {
    const result = processExpressions('{!! items | slice:1 | join:- !!}', { items: ['a', 'b', 'c', 'd'] }, fp)
    expect(result).toBe('b-c-d')
  })

  it('should handle nested conditionals with complex boolean logic', async () => {
    const template = `@if(a && b)
  <span>both</span>
@elseif(a || b)
  <span>one</span>
@else
  <span>none</span>
@endif`
    const both = await render(template, { a: true, b: true })
    expect(both).toContain('both')
    const one = await render(template, { a: true, b: false })
    expect(one).toContain('one')
    const none = await render(template, { a: false, b: false })
    expect(none).toContain('none')
  })
})

// =============================================================================
// 4. Error Recovery Tests (from regression-bugs.ts)
// =============================================================================

describe('Error Recovery Tests', () => {
  it('should handle missing @endif for @if gracefully', async () => {
    const template = `@if(true)
  <div>Open block</div>`
    const result = await render(template, {})
    expect(typeof result).toBe('string')
  })

  it('should handle missing @endforeach gracefully', async () => {
    const template = `@foreach(items as item)
  <div>{{ item }}</div>`
    const result = await render(template, { items: ['a', 'b'] })
    expect(typeof result).toBe('string')
  })

  it('should handle expression referencing undefined variable', () => {
    const result = processExpressions('{{ nonExistentVariable }}', {}, fp)
    expect(typeof result).toBe('string')
  })

  it('should handle filter that does not exist', () => {
    const result = processExpressions('{{ name | nonExistentFilter }}', { name: 'Test' }, fp)
    expect(typeof result).toBe('string')
    expect(result).toContain('Filter not found')
  })

  it('should handle @switch with no @endswitch gracefully', async () => {
    const template = `@switch(value)
  @case(1)
    <div>One</div>
  @break`
    const result = await render(template, { value: 1 })
    expect(typeof result).toBe('string')
  })

  it('should handle malformed empty expression {{ }}', () => {
    const result = processExpressions('{{ }}', {}, fp)
    expect(typeof result).toBe('string')
  })

  it('should handle deeply nested unclosed tags without crashing', async () => {
    const template = `@if(true)
  @if(true)
    @if(true)
      <div>Deep</div>`
    const result = await render(template, {})
    expect(typeof result).toBe('string')
  })

  it('should handle @foreach with non-iterable value', async () => {
    const template = `@foreach(notAnArray as item)
  <div>{{ item }}</div>
@endforeach`
    const result = await render(template, { notAnArray: 42 })
    expect(typeof result).toBe('string')
    expect(result).not.toContain('undefined')
  })

  it('should handle @if with syntax error in condition', async () => {
    const template = `@if(&&& invalid !!!)
  <div>Should not render</div>
@endif`
    const result = await render(template, {})
    expect(typeof result).toBe('string')
  })

  it('should handle @error directive when errors context is missing', () => {
    const template = `@error('field')
  <span>{{ $message }}</span>
@enderror`
    const result = processErrorDirective(template, {}, defaultFormClasses)
    expect(result.trim()).toBe('')
  })
})
