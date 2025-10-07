# @stx/iconify-medical-icon

Medical Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-medical-icon
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-medical-icon'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-medical-icon'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 144 icons from Medical Icons.

## License

MIT

License: https://github.com/samcome/webfont-medical-icons/blob/master/LICENSE

## Credits

- Icons: Samuel Frémondière (https://github.com/samcome/webfont-medical-icons)
- Iconify: https://iconify.design/
