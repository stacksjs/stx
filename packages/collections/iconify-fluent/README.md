# @stx/iconify-fluent

Fluent UI System Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-fluent
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-fluent'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-fluent'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 18908 icons from Fluent UI System Icons.

## License

MIT

License: https://github.com/microsoft/fluentui-system-icons/blob/main/LICENSE

## Credits

- Icons: Microsoft Corporation (https://github.com/microsoft/fluentui-system-icons)
- Iconify: https://iconify.design/
