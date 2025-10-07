# @stx/iconify-wpf

Icons8 Windows 8 Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-wpf
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-wpf'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-wpf'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 200 icons from Icons8 Windows 8 Icons.

## License

MIT



## Credits

- Icons: Icons8 (https://github.com/icons8/WPF-UI-Framework)
- Iconify: https://iconify.design/
