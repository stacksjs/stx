# @stx/iconify-gridicons

Gridicons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-gridicons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-gridicons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-gridicons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 207 icons from Gridicons.

## License

GPL 2.0

License: https://github.com/Automattic/gridicons/blob/trunk/LICENSE.md

## Credits

- Icons: Automattic (https://github.com/Automattic/gridicons)
- Iconify: https://iconify.design/
