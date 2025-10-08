# @stacksjs/iconify-material-icon-theme

Material Icon Theme icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-material-icon-theme
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-material-icon-theme'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-material-icon-theme'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1104 icons from Material Icon Theme.

## License

MIT

License: https://github.com/material-extensions/vscode-material-icon-theme/blob/main/LICENSE

## Credits

- Icons: Material Extensions (https://github.com/material-extensions/vscode-material-icon-theme)
- Iconify: https://iconify.design/
