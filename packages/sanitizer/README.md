![Social Card of stx](https://github.com/stacksjs/stx/blob/main/.github/art/cover.jpg)

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm downloads][npm-downloads-src]][npm-downloads-href]

# @stacksjs/sanitizer

A fast, native Bun-powered HTML sanitizer with DOMPurify-like features. Protection against XSS and malicious content.

## Installation

```bash
bun add @stacksjs/sanitizer
```

## Usage

```typescript
import { sanitize } from '@stacksjs/sanitizer'

// Basic sanitization
const clean = sanitize('<script>alert("xss")</script><p>Hello</p>')
// => '<p>Hello</p>'
```

### Presets

```typescript
import { sanitize, strict, basic, relaxed, markdown } from '@stacksjs/sanitizer'

// Strict - minimal tags allowed
sanitize(html, strict)

// Basic - common formatting tags
sanitize(html, basic)

// Relaxed - most HTML allowed
sanitize(html, relaxed)

// Markdown - optimized for markdown output
sanitize(html, markdown)
```

### Utilities

```typescript
import { isSafe, escape, stripTags } from '@stacksjs/sanitizer'

// Check if HTML is safe
isSafe('<p>Hello</p>') // true

// Escape HTML entities
escape('<script>') // '&lt;script&gt;'

// Strip all HTML tags
stripTags('<p>Hello <b>world</b></p>') // 'Hello world'
```

## Documentation

- [Full Documentation](https://stx.sh)

## License

MIT

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@stacksjs/sanitizer?style=flat-square
[npm-version-href]: https://npmjs.com/package/@stacksjs/sanitizer
[npm-downloads-src]: https://img.shields.io/npm/dm/@stacksjs/sanitizer?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/@stacksjs/sanitizer
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/stx/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/stx/actions?query=workflow%3Aci
