# @stx/iconify-fluent-emoji-high-contrast

Fluent Emoji High Contrast icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-fluent-emoji-high-contrast
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-fluent-emoji-high-contrast'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-fluent-emoji-high-contrast'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1594 icons from Fluent Emoji High Contrast.

## License

MIT

License: https://github.com/microsoft/fluentui-emoji/blob/main/LICENSE

## Credits

- Icons: Microsoft Corporation (https://github.com/microsoft/fluentui-emoji)
- Iconify: https://iconify.design/
