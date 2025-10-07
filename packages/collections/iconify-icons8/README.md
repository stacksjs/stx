# @stx/iconify-icons8

Icons8 Windows 10 Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-icons8
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-icons8'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-icons8'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 234 icons from Icons8 Windows 10 Icons.

## License

MIT



## Credits

- Icons: Icons8 (https://github.com/icons8/windows-10-icons)
- Iconify: https://iconify.design/
