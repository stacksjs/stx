# @stx/iconify-si-glyph

SmartIcons Glyph icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-si-glyph
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-si-glyph'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-si-glyph'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 799 icons from SmartIcons Glyph.

## License

CC BY SA 4.0

License: https://creativecommons.org/licenses/by-sa/4.0/

## Credits

- Icons: SmartIcons
- Iconify: https://iconify.design/
