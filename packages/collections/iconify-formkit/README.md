# @stacksjs/iconify-formkit

FormKit Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-formkit
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-formkit'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-formkit'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 144 icons from FormKit Icons.

## License

MIT

License: https://github.com/formkit/formkit/blob/master/packages/icons/LICENSE

## Credits

- Icons: FormKit, Inc (https://github.com/formkit/formkit/tree/master/packages/icons)
- Iconify: https://iconify.design/
