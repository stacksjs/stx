# @stacksjs/iconify-codex

CodeX Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-codex
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-codex'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-codex'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 78 icons from CodeX Icons.

## License

MIT

License: https://github.com/codex-team/icons/blob/master/LICENSE

## Credits

- Icons: CodeX (https://github.com/codex-team/icons)
- Iconify: https://iconify.design/
