# @stacksjs/iconify-codicon

Codicons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-codicon
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-codicon'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-codicon'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 501 icons from Codicons.

## License

CC BY 4.0

License: https://github.com/microsoft/vscode-codicons/blob/main/LICENSE

## Credits

- Icons: Microsoft Corporation (https://github.com/microsoft/vscode-codicons)
- Iconify: https://iconify.design/
