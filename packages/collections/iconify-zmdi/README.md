# @stx/iconify-zmdi

Material Design Iconic Font icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-zmdi
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-zmdi'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-zmdi'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 777 icons from Material Design Iconic Font.

## License

Open Font License



## Credits

- Icons: MDI Community (https://github.com/zavoloklom/material-design-iconic-font)
- Iconify: https://iconify.design/
