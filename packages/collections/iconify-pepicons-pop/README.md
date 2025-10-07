# @stx/iconify-pepicons-pop

Pepicons Pop! icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-pepicons-pop
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-pepicons-pop'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-pepicons-pop'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1290 icons from Pepicons Pop!.

## License

CC BY 4.0

License: https://github.com/CyCraft/pepicons/blob/dev/LICENSE

## Credits

- Icons: CyCraft (https://github.com/CyCraft/pepicons)
- Iconify: https://iconify.design/
