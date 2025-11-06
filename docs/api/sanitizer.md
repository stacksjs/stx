# Sanitizer API Reference

`@stacksjs/sanitizer` is a high-performance HTML sanitizer for Bun, providing XSS protection with DOMPurify-like features.

## Overview

`@stacksjs/sanitizer` provides fast, secure HTML sanitization with:

- **Fastest Performance**: 1.7-77x faster than competitors
- **XSS Protection**: Comprehensive security against XSS attacks
- **Configurable**: Multiple security presets and custom configurations
- **DOMPurify Compatible**: Similar API to DOMPurify
- **Bun Optimized**: Built specifically for Bun runtime

### Performance Highlights

- **77.93x faster** than DOMPurify
- **1.70x faster** than xss library
- **1.81x faster** than sanitize-html
- Fastest in all benchmark categories (safe HTML, dangerous HTML, large HTML)

See [Benchmark Results](/guide/benchmarks#html-sanitization-performance) for detailed performance comparisons.

---

## Installation

```bash
bun add @stacksjs/sanitizer
```

Or use it directly in STX templates (already included in `@stacksjs/stx`).

---

## Basic Usage

### sanitize()

Sanitize HTML with default security settings.

```typescript
import { sanitize } from '@stacksjs/sanitizer'

const dirty = '<script>alert("XSS")</script><p>Hello</p>'
const clean = sanitize(dirty)
// Output: <p>Hello</p>

// With custom options
const clean = sanitize(dirty, {
  allowedTags: ['p', 'a', 'strong', 'em'],
  allowedAttributes: {
    'a': ['href', 'title']
  }
})
```

---

## Security Presets

### Available Presets

The sanitizer includes 4 built-in security presets:

#### 1. Strict Preset

Maximum security - only basic text formatting.

```typescript
import { sanitize, strict } from '@stacksjs/sanitizer'

const html = sanitize(dirtyHTML, strict)
```

**Allowed Tags**:
- Text: `p`, `span`, `div`, `br`
- Formatting: `strong`, `b`, `em`, `i`, `u`
- Lists: `ul`, `ol`, `li`
- Headings: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`

**Allowed Attributes**:
- `class` on all elements
- `id` on all elements

**Use When**:
- User-generated content from untrusted sources
- Maximum security is required
- No rich content needed

#### 2. Basic Preset

Basic HTML with links and images.

```typescript
import { sanitize, basic } from '@stacksjs/sanitizer'

const html = sanitize(dirtyHTML, basic)
```

**Allowed Tags**:
- All strict tags, plus:
- Links: `a`
- Images: `img`
- Code: `code`, `pre`
- Quotes: `blockquote`

**Allowed Attributes**:
- All strict attributes, plus:
- `href`, `title` on `<a>`
- `src`, `alt`, `title`, `width`, `height` on `<img>`

**Use When**:
- Blog comments
- Forum posts
- Simple rich text content

#### 3. Markdown Preset

For markdown-generated HTML.

```typescript
import { sanitize, markdown } from '@stacksjs/sanitizer'

const html = sanitize(markdownHTML, markdown)
```

**Allowed Tags**:
- All basic tags, plus:
- Tables: `table`, `thead`, `tbody`, `tr`, `th`, `td`
- Inline code: `code`
- Horizontal rule: `hr`

**Allowed Attributes**:
- All basic attributes, plus:
- `align` on table elements
- `colspan`, `rowspan` on table cells

**Use When**:
- Rendering markdown content
- Documentation
- Technical content with code and tables

#### 4. Relaxed Preset

More permissive - for trusted content.

```typescript
import { sanitize, relaxed } from '@stacksjs/sanitizer'

const html = sanitize(trustedHTML, relaxed)
```

**Allowed Tags**:
- All markdown tags, plus:
- Media: `iframe`, `video`, `audio`, `source`
- Forms: `form`, `input`, `button`, `select`, `option`
- Semantic: `article`, `section`, `nav`, `aside`, `header`, `footer`

**Allowed Attributes**:
- All markdown attributes, plus:
- `style` (inline styles)
- `data-*` (data attributes)
- Media attributes: `src`, `controls`, `autoplay`, etc.
- Form attributes: `type`, `name`, `value`, etc.

**Use When**:
- CMS content from trusted editors
- Internal admin interfaces
- Pre-vetted content

### Using Presets

```typescript
import { sanitize, strict, basic, markdown, relaxed } from '@stacksjs/sanitizer'

// Use preset directly
const cleanStrict = sanitize(html, strict)
const cleanBasic = sanitize(html, basic)
const cleanMarkdown = sanitize(html, markdown)
const cleanRelaxed = sanitize(html, relaxed)

// Get preset by name
import { getPreset } from '@stacksjs/sanitizer'

const preset = getPreset('strict')
const clean = sanitize(html, preset)
```

---

## Custom Configuration

### Allowed Tags

Specify which HTML tags are allowed.

```typescript
import { sanitize } from '@stacksjs/sanitizer'

const clean = sanitize(html, {
  allowedTags: [
    'h1', 'h2', 'h3',
    'p', 'a', 'ul', 'ol', 'li',
    'strong', 'em', 'code'
  ]
})
```

### Allowed Attributes

Specify which attributes are allowed on which tags.

```typescript
const clean = sanitize(html, {
  allowedTags: ['p', 'a', 'img'],
  allowedAttributes: {
    'a': ['href', 'title', 'target'],
    'img': ['src', 'alt', 'width', 'height'],
    '*': ['class', 'id'] // All tags
  }
})
```

### Allowed Schemes

Specify allowed URL schemes for `href` and `src` attributes.

```typescript
const clean = sanitize(html, {
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowDataUri: false // Disallow data: URIs (default: false)
})
```

### Global Attributes

Allow specific attributes on all tags.

```typescript
const clean = sanitize(html, {
  allowedTags: ['p', 'div', 'span'],
  allowedAttributes: {
    '*': ['class', 'id', 'data-*'] // Allowed on all tags
  }
})
```

---

## Advanced Usage

### sanitizeWithInfo()

Get detailed information about sanitization.

```typescript
import { sanitizeWithInfo } from '@stacksjs/sanitizer'

const result = sanitizeWithInfo(dirtyHTML)

console.log(result.clean)          // Sanitized HTML
console.log(result.removed)        // Removed elements
console.log(result.removedCount)   // Number of removed elements
console.log(result.modified)       // Modified elements
console.log(result.modifiedCount)  // Number of modified elements
```

**Example Output**:
```typescript
{
  clean: '<p>Hello</p>',
  removed: [
    { tag: 'script', reason: 'Disallowed tag' },
    { tag: 'iframe', reason: 'Disallowed tag' }
  ],
  removedCount: 2,
  modified: [
    { tag: 'a', attr: 'onclick', reason: 'Disallowed attribute' }
  ],
  modifiedCount: 1
}
```

### isSafe()

Check if HTML is safe without sanitizing.

```typescript
import { isSafe } from '@stacksjs/sanitizer'

const safe = isSafe('<p>Hello</p>')
// Output: true

const unsafe = isSafe('<script>alert("XSS")</script>')
// Output: false
```

### escape()

Escape HTML entities.

```typescript
import { escape } from '@stacksjs/sanitizer'

const escaped = escape('<script>alert("XSS")</script>')
// Output: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;
```

### stripTags()

Remove all HTML tags, keeping only text content.

```typescript
import { stripTags } from '@stacksjs/sanitizer'

const text = stripTags('<p>Hello <strong>World</strong>!</p>')
// Output: Hello World!

// Allow specific tags
const text = stripTags(html, ['strong', 'em'])
// Keeps <strong> and <em> tags
```

---

## Common XSS Patterns

The sanitizer protects against common XSS attacks:

### Script Injection

```typescript
// Blocked: <script> tags
sanitize('<script>alert("XSS")</script>')
// Output: ''

// Blocked: Event handlers
sanitize('<img src="x" onerror="alert(\'XSS\')">')
// Output: '<img src="x">'

// Blocked: JavaScript URLs
sanitize('<a href="javascript:alert(\'XSS\')">Click</a>')
// Output: '<a>Click</a>'
```

### DOM Clobbering

```typescript
// Blocked: Dangerous attributes
sanitize('<form id="body"></form>')
// Output: '<form></form>'

// Blocked: Name attribute conflicts
sanitize('<input name="body">')
// Output: '<input>'
```

### Data URI Attacks

```typescript
// Blocked by default
sanitize('<img src="data:text/html,<script>alert(\'XSS\')</script>">')
// Output: '<img>'

// Allow data URIs with explicit permission
sanitize(html, {
  allowDataUri: true,
  allowedSchemes: ['http', 'https', 'data']
})
```

### CSS Injection

```typescript
// Blocked: Style attributes (unless relaxed preset)
sanitize('<p style="expression(alert(\'XSS\'))">Text</p>')
// Output: '<p>Text</p>'

// Blocked: Style tags
sanitize('<style>body { background: url(javascript:alert(\'XSS\')) }</style>')
// Output: ''
```

---

## STX Template Integration

Use the sanitizer in STX templates with the `{!! !!}` expression:

```stx
@component('UserComment')
  @ts
  interface Props {
    comment: string
    author: string
  }
  @endts

  <div class="comment">
    <strong>{{ author }}</strong>
    <div class="content">
      {!! sanitize(comment, basic) !!}
    </div>
  </div>
@endcomponent
```

Or use it in template processing:

```stx
@ts
import { sanitize, markdown } from '@stacksjs/sanitizer'

const userContent = `
  <h2>My Post</h2>
  <p>Hello <strong>World</strong>!</p>
  <script>alert("XSS")</script>
`

const cleanContent = sanitize(userContent, markdown)
@endts

<article>
  {!! cleanContent !!}
</article>
```

---

## Configuration Options

### SanitizerOptions

```typescript
interface SanitizerOptions {
  // Allowed HTML tags
  allowedTags?: string[]

  // Allowed attributes per tag
  allowedAttributes?: {
    [tag: string]: string[]
  }

  // Allowed URL schemes
  allowedSchemes?: string[]

  // Allow data: URIs
  allowDataUri?: boolean

  // Allow specific protocols
  allowedProtocols?: string[]

  // Transform tags
  transformTags?: {
    [tag: string]: string | ((tag: string, attrs: any) => string)
  }

  // Custom attribute filter
  allowedAttributeFilter?: (tag: string, attr: string, value: string) => boolean
}
```

### Example: Custom Filter

```typescript
const clean = sanitize(html, {
  allowedTags: ['a', 'img'],
  allowedAttributeFilter: (tag, attr, value) => {
    // Allow only HTTPS images
    if (tag === 'img' && attr === 'src') {
      return value.startsWith('https://')
    }

    // Allow only internal links
    if (tag === 'a' && attr === 'href') {
      return value.startsWith('/') || value.startsWith('#')
    }

    return true
  }
})
```

---

## Best Practices

### 1. Choose the Right Preset

```typescript
// User-generated content → strict
const comment = sanitize(userComment, strict)

// Blog posts → basic
const post = sanitize(blogPost, basic)

// Markdown content → markdown
const doc = sanitize(markdownHTML, markdown)

// Trusted editors → relaxed
const cms = sanitize(cmsContent, relaxed)
```

### 2. Validate Before Sanitizing

```typescript
// Check if safe first
if (isSafe(html)) {
  // Use as-is
  return html
} else {
  // Sanitize
  return sanitize(html, basic)
}
```

### 3. Log Removed Content

```typescript
const { clean, removed, removedCount } = sanitizeWithInfo(html)

if (removedCount > 0) {
  console.warn('Removed potentially dangerous content:', removed)
}

return clean
```

### 4. Combine with Content Security Policy

```stx
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; script-src 'none'">
</head>
<body>
  {!! sanitize(userContent, strict) !!}
</body>
</html>
```

---

## Security Considerations

### Defense in Depth

Always combine sanitization with other security measures:

1. **Content Security Policy (CSP)**: Limit script execution
2. **Input Validation**: Validate data before storage
3. **Output Encoding**: Encode data for context (HTML, JSON, etc.)
4. **HTTPS**: Prevent man-in-the-middle attacks

### Regular Updates

Keep the sanitizer updated to protect against new XSS vectors:

```bash
bun update @stacksjs/sanitizer
```

### Test Your Configuration

Always test your sanitization rules:

```typescript
const testCases = [
  '<script>alert("XSS")</script>',
  '<img src="x" onerror="alert(\'XSS\')">',
  '<a href="javascript:alert(\'XSS\')">Click</a>',
  // Add more test cases
]

testCases.forEach(test => {
  const clean = sanitize(test, yourConfig)
  console.assert(!clean.includes('script'), 'Script detected!')
  console.assert(!clean.includes('javascript:'), 'JavaScript URL detected!')
})
```

---

## API Summary

| Function | Purpose | Returns |
|----------|---------|---------|
| `sanitize(html, options?)` | Sanitize HTML | `string` |
| `sanitizeWithInfo(html, options?)` | Sanitize with details | `SanitizeResult` |
| `isSafe(html, options?)` | Check if HTML is safe | `boolean` |
| `escape(html)` | Escape HTML entities | `string` |
| `stripTags(html, allowedTags?)` | Remove HTML tags | `string` |
| `getPreset(name)` | Get security preset | `SanitizerOptions` |

## Next Steps

- Review [Benchmark Results](/guide/benchmarks#html-sanitization-performance)
- Learn about [Security Best Practices](/guide/security)
- Explore [Template Expressions](/api/template-syntax#expressions)
- Understand [XSS Protection](/guide/security#xss-protection)
