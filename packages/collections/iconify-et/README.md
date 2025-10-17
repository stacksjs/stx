# @stacksjs/iconify-et

Elegant icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-et
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-et'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-et'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 100 icons from Elegant.

## License

GPL 3.0

License: https://www.gnu.org/licenses/gpl.html

## Credits

- Icons: Kenny Sing (https://github.com/pprince/etlinefont-bower)
- Iconify: https://iconify.design/
