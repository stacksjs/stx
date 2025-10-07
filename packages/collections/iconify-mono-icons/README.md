# @stx/iconify-mono-icons

Mono Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-mono-icons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-mono-icons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-mono-icons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 180 icons from Mono Icons.

## License

MIT

License: https://github.com/mono-company/mono-icons/blob/master/LICENSE.md

## Credits

- Icons: Mono (https://github.com/mono-company/mono-icons)
- Iconify: https://iconify.design/
