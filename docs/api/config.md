# Configuration API Reference

This document covers stx's configuration options, including strict mode for DOM API validation.

## Strict Mode

Strict mode validates `<script client>` blocks for raw browser API usage (`document.*`, `window.*`) and suggests stx composable alternatives. This helps enforce framework best practices and eliminates the need for developers to write raw DOM manipulation code.

### Enabling Strict Mode

```ts
// stx.config.ts
export default {
  // Simple boolean: enables warnings on prohibited patterns
  strict: true,
}
```

### Detailed Configuration

```ts
// stx.config.ts
export default {
  strict: {
    enabled: true,
    failOnViolation: true,     // Throw build errors instead of warnings
    allowPatterns: ['cookie'],  // Allow specific patterns through validation
  },
}
```

### StrictModeConfig Interface

```ts
interface StrictModeConfig {
  /** Enable strict mode validation */
  enabled: boolean
  /** Throw errors instead of warnings (default: false) */
  failOnViolation?: boolean
  /** Pattern strings to allow through validation */
  allowPatterns?: string[]
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable strict mode validation |
| `failOnViolation` | `boolean` | `false` | `true` = build errors, `false` = console warnings |
| `allowPatterns` | `string[]` | `[]` | Pattern strings matched against rule messages or regex sources to skip |

### Prohibited Patterns

When strict mode is enabled, these raw browser API patterns are flagged:

#### document.* Patterns

| Pattern | Alternative |
|---------|-------------|
| `document.getElementById()` | `useRef("name")` |
| `document.querySelector()` | `useRef("name")` |
| `document.querySelectorAll()` | `useRef("name")` and access children |
| `document.getElementsBy*()` | `useRef("name")` |
| `document.createElement()` | Template directives or component composition |
| `document.title = ...` | `useTitle()` from composables |
| `document.cookie` | `useCookie()` from composables |
| `document.addEventListener()` | `useEventListener()` or template `@event` directives |
| `document.activeElement` | `useRef()` to track focused elements |

#### window.* Patterns

| Pattern | Alternative |
|---------|-------------|
| `window.location` | `navigate()` or `useRoute()` |
| `window.history` | `navigate()`, `goBack()`, `goForward()` |
| `window.addEventListener()` | `useEventListener()` or `@click` directives |
| `window.localStorage` | `useLocalStorage()` from composables |
| `window.sessionStorage` | `useSessionStorage()` from composables |
| `window.scrollTo()` | `useScroll().scrollTo()` from composables |
| `window.alert()` | stx modal/dialog APIs |
| `window.confirm()` | stx modal/dialog APIs |
| `window.prompt()` | stx modal/dialog APIs |

#### Bare Location Patterns

| Pattern | Alternative |
|---------|-------------|
| `location.href = ...` | `navigate()` |
| `location.assign()` | `navigate()` |
| `location.replace()` | `navigate()` |

### Examples

```html
<!-- Bad: raw DOM APIs (will trigger warnings/errors in strict mode) -->
<script client>
const el = document.getElementById('myBtn')
window.location.href = '/about'
window.localStorage.setItem('key', 'value')
document.addEventListener('click', handler)
</script>

<!-- Good: stx composables (clean, auto-imported) -->
<script client>
const btn = useRef('myBtn')
navigate('/about')
const storage = useLocalStorage('key', 'default')
useEventListener('click', handler)
</script>
```

### Allowing Specific Patterns

If you need to use a specific browser API that strict mode prohibits, use `allowPatterns`:

```ts
// stx.config.ts
export default {
  strict: {
    enabled: true,
    failOnViolation: true,
    allowPatterns: [
      'querySelector',  // Allow document.querySelector
      'cookie',         // Allow document.cookie
    ],
  },
}
```
