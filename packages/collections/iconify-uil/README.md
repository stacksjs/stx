# @stx/iconify-uil

Unicons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-uil
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-uil'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-uil'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1216 icons from Unicons.

## License

Apache 2.0

License: https://github.com/Iconscout/unicons/blob/master/LICENSE

## Credits

- Icons: Iconscout (https://github.com/Iconscout/unicons)
- Iconify: https://iconify.design/
