# @stx/iconify-picon

Pico-icon icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-picon
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-picon'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-picon'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 824 icons from Pico-icon.

## License

Open Font License

License: https://github.com/yne/picon/blob/master/OFL.txt

## Credits

- Icons: Picon Contributors (https://github.com/yne/picon)
- Iconify: https://iconify.design/
