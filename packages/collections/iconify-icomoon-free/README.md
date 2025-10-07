# @stx/iconify-icomoon-free

IcoMoon Free icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-icomoon-free
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-icomoon-free'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-icomoon-free'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 491 icons from IcoMoon Free.

## License

GPL

License: https://www.gnu.org/licenses/gpl.html

## Credits

- Icons: Keyamoon (https://github.com/Keyamoon/IcoMoon-Free)
- Iconify: https://iconify.design/
