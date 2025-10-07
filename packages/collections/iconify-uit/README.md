# @stx/iconify-uit

Unicons Thin Line icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-uit
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-uit'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-uit'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 216 icons from Unicons Thin Line.

## License

Apache 2.0

License: https://github.com/Iconscout/unicons/blob/master/LICENSE

## Credits

- Icons: Iconscout (https://github.com/Iconscout/unicons)
- Iconify: https://iconify.design/
