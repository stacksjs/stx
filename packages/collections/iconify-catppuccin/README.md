# @stacksjs/iconify-catppuccin

Catppuccin Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-catppuccin
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-catppuccin'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-catppuccin'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 659 icons from Catppuccin Icons.

## License

MIT

License: https://github.com/catppuccin/vscode-icons/blob/main/LICENSE

## Credits

- Icons: Catppuccin (https://github.com/catppuccin/vscode-icons)
- Iconify: https://iconify.design/
