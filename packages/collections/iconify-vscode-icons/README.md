# @stx/iconify-vscode-icons

VSCode Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-vscode-icons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-vscode-icons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-vscode-icons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1400 icons from VSCode Icons.

## License

MIT

License: https://github.com/vscode-icons/vscode-icons/blob/master/LICENSE

## Credits

- Icons: Roberto Huertas (https://github.com/vscode-icons/vscode-icons)
- Iconify: https://iconify.design/
