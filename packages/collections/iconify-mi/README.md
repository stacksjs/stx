# @stacksjs/iconify-mi

Mono Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-mi
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-mi'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-mi'
import { renderIcon } from '@stacksjs/iconify-core'

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
