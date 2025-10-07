# @stx/iconify-circum

Circum Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-circum
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-circum'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-circum'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 288 icons from Circum Icons.

## License

Mozilla Public License 2.0

License: https://github.com/Klarr-Agency/Circum-Icons/blob/main/LICENSE

## Credits

- Icons: Klarr Agency (https://github.com/Klarr-Agency/Circum-Icons)
- Iconify: https://iconify.design/
