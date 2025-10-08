# @stacksjs/iconify-streamline-flex

Flex free icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-streamline-flex
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-streamline-flex'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-streamline-flex'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1500 icons from Flex free icons.

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: Streamline (https://github.com/webalys-hq/streamline-vectors)
- Iconify: https://iconify.design/
