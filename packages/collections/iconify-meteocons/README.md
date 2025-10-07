# @stx/iconify-meteocons

Meteocons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-meteocons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-meteocons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-meteocons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 450 icons from Meteocons.

## License

MIT

License: https://github.com/basmilius/weather-icons/blob/dev/LICENSE

## Credits

- Icons: Bas Milius (https://github.com/basmilius/weather-icons)
- Iconify: https://iconify.design/
