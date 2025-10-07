# @stx/iconify-openmoji

OpenMoji icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-openmoji
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-openmoji'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-openmoji'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 4219 icons from OpenMoji.

## License

CC BY-SA 4.0

License: https://creativecommons.org/licenses/by-sa/4.0/

## Credits

- Icons: OpenMoji (https://github.com/hfg-gmuend/openmoji)
- Iconify: https://iconify.design/
