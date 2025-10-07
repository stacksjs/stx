import { describe, expect, it } from 'bun:test'
import { formatStxContent } from '../../src/formatter'

describe('STX Formatter', () => {
  describe('Basic Formatting', () => {
    it('should format a simple template', () => {
      const input = `
<!DOCTYPE html>
<html>
<head>
<title>Test</title>
</head>
<body>
<h1>Hello World</h1>
</body>
</html>
      `.trim()

      const expected = `<!DOCTYPE html>
<html>
  <head>
    <title>Test</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>
`

      const result = formatStxContent(input)
      expect(result).toBe(expected)
    })

    it('should handle already formatted templates', () => {
      const input = `<!DOCTYPE html>
<html>
  <head>
    <title>Already Formatted</title>
  </head>
  <body>
    <h1>Content</h1>
  </body>
</html>
`

      const result = formatStxContent(input)
      expect(result).toBe(input)
    })

    it('should remove trailing whitespace', () => {
      const input = `<div>Content    \n  <p>Text   </p>   \n</div>  `
      const expected = `<div>Content
  <p>Text</p>
</div>
`

      const result = formatStxContent(input)
      expect(result).toBe(expected)
    })

    it('should ensure file ends with newline', () => {
      const input = `<div>Content</div>`
      const result = formatStxContent(input)

      expect(result.endsWith('\n')).toBe(true)
      expect(result).toBe(`<div>Content</div>\n`)
    })
  })

  describe('HTML Structure Formatting', () => {
    it('should indent nested elements properly', () => {
      const input = `<div><span><a>Link</a></span></div>`
      const expected = `<div>
  <span>
    <a>Link</a>
  </span>
</div>
`

      const result = formatStxContent(input)
      expect(result).toBe(expected)
    })

    it('should handle self-closing tags', () => {
      const input = `<div><img src="test.jpg"><br><hr></div>`
      const expected = `<div>
  <img src="test.jpg">
  <br>
  <hr>
</div>
`

      const result = formatStxContent(input)
      expect(result).toBe(expected)
    })

    it('should handle mixed content', () => {
      const input = `<div>Text content <strong>bold</strong> more text</div>`
      const expected = `<div>Text content <strong>bold</strong> more text</div>
`

      const result = formatStxContent(input)
      expect(result).toBe(expected)
    })
  })

  describe('STX Directives Formatting', () => {
    it('should format @if directives', () => {
      const input = `<div>@if(condition)<p>Content</p>@endif</div>`
      const expected = `<div>
  @if(condition)
    <p>Content</p>
  @endif
</div>
`

      const result = formatStxContent(input)
      expect(result).toBe(expected)
    })

    it('should format @foreach directives', () => {
      const input = `<ul>@foreach(items as item)<li>{{ item }}</li>@endforeach</ul>`
      const expected = `<ul>
  @foreach(items as item)
    <li>{{ item }}</li>
  @endforeach
</ul>
`

      const result = formatStxContent(input)
      expect(result).toBe(expected)
    })

    it('should normalize directive spacing', () => {
      const input = `@if  (  condition  )\n  content\n@endif`
      const expected = `@if(condition)
  content
@endif
`

      const result = formatStxContent(input)
      expect(result).toBe(expected)
    })

    it('should handle nested directives', () => {
      const input = `@if(user)@if(user.isAdmin)<div>Admin</div>@endif@endif`
      const expected = `@if(user)
  @if(user.isAdmin)
    <div>Admin</div>
  @endif
@endif
`

      const result = formatStxContent(input)
      expect(result).toBe(expected)
    })
  })

  describe('Expression Formatting', () => {
    it('should normalize template expressions', () => {
      const input = `<p>{{name}}</p><div>{!!  content  !!}</div>`
      const expected = `<p>{{ name }}</p>
<div>{!! content !!}</div>
`

      const result = formatStxContent(input)
      expect(result).toBe(expected)
    })

    it('should handle complex expressions', () => {
      const input = `<p>{{  user.name || 'Guest'  }}</p>`
      const expected = `<p>{{ user.name || 'Guest' }}</p>
`

      const result = formatStxContent(input)
      expect(result).toBe(expected)
    })

    it('should preserve expression content', () => {
      const input = `<p>{{ item.price.toFixed(2) }}</p>`
      const expected = `<p>{{ item.price.toFixed(2) }}</p>
`

      const result = formatStxContent(input)
      expect(result).toBe(expected)
    })
  })

  describe('Script Tag Formatting', () => {
    it('should format script content', () => {
      const input = `<script>
const name = "test";
const items = [1, 2, 3];
      </script>`

      const result = formatStxContent(input)

      expect(result).toContain('<script>')
      expect(result).toContain('const name = "test";')
      expect(result).toContain('const items = [1, 2, 3];')
      expect(result).toContain('</script>')
    })

    it('should handle empty script tags', () => {
      const input = `<script></script>`
      const expected = `<script></script>
`

      const result = formatStxContent(input)
      expect(result).toBe(expected)
    })

    it('should format script with module exports', () => {
      const input = `<script>
module.exports = {
title: "Test",
items: [1, 2, 3]
};
</script>`

      const result = formatStxContent(input)

      expect(result).toContain('module.exports = {')
      expect(result).toContain('title: "Test",')
      expect(result).toContain('items: [1, 2, 3]')
    })
  })

  describe('Custom Options', () => {
    it('should use custom indent size', () => {
      const input = `<div><p>Content</p></div>`
      const result = formatStxContent(input, { indentSize: 4 })

      expect(result).toContain('    <p>Content</p>')
    })

    it('should use tabs for indentation', () => {
      const input = `<div><p>Content</p></div>`
      const result = formatStxContent(input, { useTabs: true })

      expect(result).toContain('\t<p>Content</p>')
    })

    it('should respect max line length', () => {
      const input = `<div class="very-long-class-name-that-exceeds-normal-limits"><p>Content</p></div>`
      const result = formatStxContent(input, { maxLineLength: 50 })

      // Should still format even with long lines
      expect(result).toContain('<div class="very-long-class-name-that-exceeds-normal-limits">')
    })

    it('should handle disabled whitespace normalization', () => {
      const input = `<p>{{  spaced_expression  }}</p>`
      const result = formatStxContent(input, { normalizeWhitespace: false })

      // Should keep original spacing when disabled
      expect(result).toContain('{{  spaced_expression  }}')
    })
  })

  describe('Complex Templates', () => {
    it('should format a complete STX template', () => {
      const input = `<!DOCTYPE html>
<html><head><title>{{ title }}</title></head><body><div class="container">@if(user)<h1>Welcome {{ user.name }}</h1>@if(user.isAdmin)<div class="admin">Admin Panel</div>@endif@endif<ul>@foreach(items as item)<li>{{ item.name }} - {{ item.price }}</li>@endforeach</ul></div></body></html>`

      const result = formatStxContent(input)

      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('  <head>')
      expect(result).toContain('    <title>{{ title }}</title>')
      expect(result).toContain('  @if(user)')
      expect(result).toContain('    <h1>Welcome {{ user.name }}</h1>')
      expect(result).toContain('    @if(user.isAdmin)')
      expect(result).toContain('      <div class="admin">Admin Panel</div>')
      expect(result).toContain('    @endif')
      expect(result).toContain('  @endif')
      expect(result).toContain('  @foreach(items as item)')
      expect(result).toContain('    <li>{{ item.name }} - {{ item.price }}</li>')
      expect(result).toContain('  @endforeach')
    })

    it('should handle templates with sections', () => {
      const input = `@extends('layout')@section('title')Page Title@endsection@section('content')<div>Content</div>@endsection`

      const result = formatStxContent(input)

      expect(result).toContain('@extends(\'layout\')')
      expect(result).toContain('@section(\'title\')')
      expect(result).toContain('Page Title')
      expect(result).toContain('@endsection')
      expect(result).toContain('@section(\'content\')')
      expect(result).toContain('<div>Content</div>')
    })

    it('should preserve comment structure', () => {
      const input = `<div><!-- This is a comment --><p>Content</p></div>`
      const expected = `<div>
  <!-- This is a comment -->
  <p>Content</p>
</div>
`

      const result = formatStxContent(input)
      expect(result).toBe(expected)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty templates', () => {
      const input = ``
      const result = formatStxContent(input)

      expect(result).toBe('\n')
    })

    it('should handle whitespace-only templates', () => {
      const input = `   \n  \t  \n   `
      const result = formatStxContent(input)

      expect(result).toBe('\n')
    })

    it('should handle malformed HTML gracefully', () => {
      const input = `<div><p>Unclosed paragraph<div>Another div</div>`
      const result = formatStxContent(input)

      // Should attempt to format even malformed HTML
      expect(result).toContain('<div>')
      expect(result).toContain('<p>Unclosed paragraph')
      expect(result).toContain('</div>')
    })

    it('should handle special characters', () => {
      const input = `<div>Special chars: &lt; &gt; &amp; &quot;</div>`
      const expected = `<div>Special chars: &lt; &gt; &amp; &quot;</div>
`

      const result = formatStxContent(input)
      expect(result).toBe(expected)
    })

    it('should handle unicode content', () => {
      const input = `<div>Unicode: 你好 🌟 émojis</div>`
      const expected = `<div>Unicode: 你好 🌟 émojis</div>
`

      const result = formatStxContent(input)
      expect(result).toBe(expected)
    })
  })

  describe('Attribute Formatting', () => {
    it('should sort attributes when enabled', () => {
      const input = `<div style="color: red;" class="container" id="main">`
      const result = formatStxContent(input, { sortAttributes: true })

      // id should come first, then class, then other attributes
      expect(result).toContain('id="main" class="container" style="color: red;"')
    })

    it('should preserve attribute order when disabled', () => {
      const input = `<div style="color: red;" class="container" id="main">`
      const result = formatStxContent(input, { sortAttributes: false })

      expect(result).toContain('style="color: red;" class="container" id="main"')
    })

    it('should handle attributes without values', () => {
      const input = `<input type="checkbox" checked disabled>`
      const result = formatStxContent(input)

      expect(result).toContain('checked')
      expect(result).toContain('disabled')
    })
  })

  describe('Advanced Formatting Scenarios', () => {
    it('should handle complex nested structures with mixed content', () => {
      const input = `
<article class="post"><header><h1>{{ post.title }}</h1><div class="meta">By {{ post.author }} on <time>{{ post.date }}</time></div></header><main>@if(post.featured)<div class="featured-badge">Featured</div>@endif<div class="content">{{ post.excerpt }}</div>@if(post.tags.length > 0)<div class="tags">@foreach(post.tags as tag)<span class="tag">{{ tag }}</span>@endforeach</div>@endif</main><footer>@if(user.canEdit)<button class="edit">Edit</button>@endif<button class="share">Share</button></footer></article>`

      const result = formatStxContent(input)

      expect(result).toContain('<article class="post">')
      expect(result).toContain('  <header>')
      expect(result).toContain('    <h1>{{ post.title }}</h1>')
      expect(result).toContain('  @if(post.featured)')
      expect(result).toContain('    <div class="featured-badge">Featured</div>')
      expect(result).toContain('  @endif')
      expect(result).toContain('  @foreach(post.tags as tag)')
      expect(result).toContain('    <span class="tag">{{ tag }}</span>')
      expect(result).toContain('  @endforeach')
    })

    it('should format templates with complex JavaScript in script tags', () => {
      const input = `
<script>
const data = {users: [{name: "John", skills: ["JS", "CSS"]}, {name: "Jane", skills: ["Python", "Go"]}], settings: {theme: "dark"}};
if (data.users.length > 0) {
for (let user of data.users) {
console.log(\`User: \${user.name}, Skills: \${user.skills.join(", ")}\`);
}
}
module.exports = data;
</script>`

      const result = formatStxContent(input)

      expect(result).toContain('<script>')
      expect(result).toContain('const data = {')
      expect(result).toContain('users: [')
      expect(result).toContain('if (data.users.length > 0) {')
      expect(result).toContain('for (let user of data.users) {')
      expect(result).toContain('module.exports = data;')
      expect(result).toContain('</script>')
    })

    it('should handle malformed HTML gracefully', () => {
      const input = `
<div class="container">
<p>Paragraph without closing tag
<div>Another div
<span>Span content</span>
<br>
<img src="image.jpg" alt="Image"
<button>Click me</button>
</div>`

      const result = formatStxContent(input)

      // Should attempt to format despite malformed structure
      expect(result).toContain('<div class="container">')
      expect(result).toContain('<p>Paragraph without closing tag')
      expect(result).toContain('<span>Span content</span>')
      expect(result).toContain('<br>')
      expect(result).toContain('<img src="image.jpg" alt="Image"')
    })

    it('should preserve whitespace in specific contexts', () => {
      const input = `
<pre><code>function example() {
  return "code should preserve formatting";
}</code></pre>
<textarea>
  This text should
  preserve line breaks
  and spacing
</textarea>`

      const result = formatStxContent(input, { preserveWhitespace: ['pre', 'code', 'textarea'] })

      expect(result).toContain('<pre><code>function example() {')
      expect(result).toContain('  return "code should preserve formatting";')
      expect(result).toContain('}</code></pre>')
      expect(result).toContain('<textarea>')
      expect(result).toContain('  This text should')
      expect(result).toContain('  preserve line breaks')
    })

    it('should handle conditional blocks with complex nesting', () => {
      const input = `
@if(user.isLoggedIn)@if(user.hasPermission('admin'))@if(feature.enabled)@foreach(adminTools as tool)@if(tool.available)<div class="tool">{{ tool.name }}</div>@endif@endforeach@endif@endif@endif`

      const result = formatStxContent(input)

      expect(result).toContain('@if(user.isLoggedIn)')
      expect(result).toContain('  @if(user.hasPermission(\'admin\'))')
      expect(result).toContain('    @if(feature.enabled)')
      expect(result).toContain('      @foreach(adminTools as tool)')
      expect(result).toContain('        @if(tool.available)')
      expect(result).toContain('          <div class="tool">{{ tool.name }}</div>')
      expect(result).toContain('        @endif')
      expect(result).toContain('      @endforeach')
      expect(result).toContain('    @endif')
      expect(result).toContain('  @endif')
      expect(result).toContain('@endif')
    })

    it('should format tables with proper indentation', () => {
      const input = `
<table class="data-table"><thead><tr><th>Name</th><th>Role</th><th>Actions</th></tr></thead><tbody>@foreach(users as user)<tr><td>{{ user.name }}</td><td>{{ user.role }}</td><td>@if(user.canEdit)<button>Edit</button>@endif<button>View</button></td></tr>@endforeach</tbody></table>`

      const result = formatStxContent(input)

      expect(result).toContain('<table class="data-table">')
      expect(result).toContain('  <thead>')
      expect(result).toContain('    <tr>')
      expect(result).toContain('      <th>Name</th>')
      expect(result).toContain('  <tbody>')
      expect(result).toContain('    @foreach(users as user)')
      expect(result).toContain('      <tr>')
      expect(result).toContain('        <td>{{ user.name }}</td>')
      expect(result).toContain('        @if(user.canEdit)')
      expect(result).toContain('          <button>Edit</button>')
      expect(result).toContain('        @endif')
    })

    it('should handle different indentation styles', () => {
      const input = `<div><p>Content</p></div>`

      // Test with tabs
      const tabResult = formatStxContent(input, { useTabs: true })
      expect(tabResult).toContain('\t<p>Content</p>')

      // Test with different indent sizes
      const twoSpaceResult = formatStxContent(input, { indentSize: 2 })
      expect(twoSpaceResult).toContain('  <p>Content</p>')

      const fourSpaceResult = formatStxContent(input, { indentSize: 4 })
      expect(fourSpaceResult).toContain('    <p>Content</p>')
    })

    it('should format forms with proper structure', () => {
      const input = `
<form method="post" action="/submit">@csrf<div class="form-group"><label for="name">Name:</label><input type="text" id="name" name="name" value="{{ old('name') }}" @error('name') class="error" @enderror></div><div class="form-group"><label for="email">Email:</label><input type="email" id="email" name="email" value="{{ old('email') }}">@error('email')<span class="error-message">{{ $message }}</span>@enderror</div><button type="submit">Submit</button></form>`

      const result = formatStxContent(input)

      expect(result).toContain('<form method="post" action="/submit">')
      expect(result).toContain('  @csrf')
      expect(result).toContain('  <div class="form-group">')
      expect(result).toContain('    <label for="name">Name:</label>')
      expect(result).toContain('    <input type="text" id="name"')
      expect(result).toContain('    @error(\'name\')')
      expect(result).toContain('      class="error"')
      expect(result).toContain('    @enderror')
      expect(result).toContain('  @error(\'email\')')
      expect(result).toContain('    <span class="error-message">{{ $message }}</span>')
      expect(result).toContain('  @enderror')
    })

    it('should handle custom directives and components', () => {
      const input = `
@extends('layouts.app')@section('title', 'Custom Page')@section('content')<div class="page-header">@component('components.breadcrumb', ['items' => $breadcrumbs])@endcomponent</div><main>@include('partials.sidebar')@yield('main-content', 'Default content')@push('scripts')<script>console.log('Custom script');</script>@endpush</main>@endsection`

      const result = formatStxContent(input)

      expect(result).toContain('@extends(\'layouts.app\')')
      expect(result).toContain('@section(\'title\', \'Custom Page\')')
      expect(result).toContain('@section(\'content\')')
      expect(result).toContain('  <div class="page-header">')
      expect(result).toContain('    @component(\'components.breadcrumb\'')
      expect(result).toContain('    @endcomponent')
      expect(result).toContain('  @include(\'partials.sidebar\')')
      expect(result).toContain('  @push(\'scripts\')')
      expect(result).toContain('    <script>console.log(\'Custom script\');</script>')
      expect(result).toContain('  @endpush')
      expect(result).toContain('@endsection')
    })

    it('should handle inline expressions and complex interpolations', () => {
      const input = `
<div class="user-card" data-id="{{ $user->id }}">
<h3>{{ $user->name ?? 'Unknown User' }}</h3>
<p>Age: {{ $user->age ?: 'Not specified' }}</p>
<p>{{ $user->isActive() ? 'Active' : 'Inactive' }}</p>
@if($user->hasRole('admin'))<span class="admin-badge">Admin</span>@endif
<p>Last login: {{ $user->last_login?->format('Y-m-d H:i') ?? 'Never' }}</p>
</div>`

      const result = formatStxContent(input)

      expect(result).toContain('<div class="user-card" data-id="{{ $user->id }}">')
      expect(result).toContain('  <h3>{{ $user->name ?? \'Unknown User\' }}</h3>')
      expect(result).toContain('  <p>Age: {{ $user->age ?: \'Not specified\' }}</p>')
      expect(result).toContain('  <p>{{ $user->isActive() ? \'Active\' : \'Inactive\' }}</p>')
      expect(result).toContain('  @if($user->hasRole(\'admin\'))')
      expect(result).toContain('    <span class="admin-badge">Admin</span>')
      expect(result).toContain('  @endif')
      expect(result).toContain('  <p>Last login: {{ $user->last_login?->format(\'Y-m-d H:i\') ?? \'Never\' }}</p>')
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle very large templates efficiently', () => {
      const largeContent = Array.from({ length: 1000 }).fill(0).map((_, i) =>
        `<div class="item-${i}">{{ items[${i}].name }}</div>`,
      ).join('')

      const input = `<div class="container">${largeContent}</div>`

      const startTime = performance.now()
      const result = formatStxContent(input)
      const endTime = performance.now()

      // Should format efficiently even for large content
      expect(endTime - startTime).toBeLessThan(1000) // Less than 1 second

      expect(result).toContain('<div class="container">')
      expect(result).toContain('  <div class="item-0">')
      expect(result).toContain('  <div class="item-999">')
      expect(result.endsWith('\n')).toBe(true)
    })

    it('should handle deeply nested structures', () => {
      const deepNesting = Array.from({ length: 20 }).fill(0).reduce((content, _, i) =>
        `<div class="level-${i}">${content}</div>`, '<span>Deep content</span>')

      const result = formatStxContent(deepNesting)

      expect(result).toContain('<div class="level-19">')
      expect(result).toContain('<span>Deep content</span>')
      expect(result.split('\n').length).toBeGreaterThan(20)
    })

    it('should preserve critical whitespace in specific contexts', () => {
      const input = `
<p>This is <strong>important</strong> text with <em>emphasis</em> here.</p>
<div>Multiple <span>inline</span> <a href="#">elements</a> in one line.</div>`

      const result = formatStxContent(input)

      expect(result).toContain('<p>This is <strong>important</strong> text with <em>emphasis</em> here.</p>')
      expect(result).toContain('<div>Multiple <span>inline</span> <a href="#">elements</a> in one line.</div>')
    })

    it('should handle mixed content types correctly', () => {
      const input = `
<!DOCTYPE html>
<html>
<head>
<style>
.container { display: flex; justify-content: center; }
.item { margin: 10px; padding: 5px; }
</style>
<script>
function init() {
console.log('Initializing...');
}
</script>
</head>
<body>
<div class="container">
@foreach(items as item)
<div class="item">{{ item }}</div>
@endforeach
</div>
</body>
</html>`

      const result = formatStxContent(input)

      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('<html>')
      expect(result).toContain('  <head>')
      expect(result).toContain('    <style>')
      expect(result).toContain('.container { display: flex;')
      expect(result).toContain('    <script>')
      expect(result).toContain('function init() {')
      expect(result).toContain('    @foreach(items as item)')
      expect(result).toContain('      <div class="item">{{ item }}</div>')
    })
  })
})
