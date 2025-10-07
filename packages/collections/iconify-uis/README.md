# @stx/iconify-uis

Unicons Solid icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-uis
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-uis'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-uis'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 190 icons from Unicons Solid.

## License

Apache 2.0

License: https://github.com/Iconscout/unicons/blob/master/LICENSE

## Credits

- Icons: Iconscout (https://github.com/Iconscout/unicons)
- Iconify: https://iconify.design/
