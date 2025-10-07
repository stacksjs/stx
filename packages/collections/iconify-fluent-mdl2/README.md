# @stx/iconify-fluent-mdl2

Fluent UI MDL2 icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-fluent-mdl2
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-fluent-mdl2'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-fluent-mdl2'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1735 icons from Fluent UI MDL2.

## License

MIT

License: https://github.com/microsoft/fluentui/blob/master/packages/react-icons-mdl2/LICENSE

## Credits

- Icons: Microsoft Corporation (https://github.com/microsoft/fluentui/tree/master/packages/react-icons-mdl2)
- Iconify: https://iconify.design/
