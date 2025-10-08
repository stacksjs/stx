# @stacksjs/iconify-pepicons-pencil

Pepicons Pencil icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-pepicons-pencil
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-pepicons-pencil'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-pepicons-pencil'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1275 icons from Pepicons Pencil.

## License

CC BY 4.0

License: https://github.com/CyCraft/pepicons/blob/dev/LICENSE

## Credits

- Icons: CyCraft (https://github.com/CyCraft/pepicons)
- Iconify: https://iconify.design/
