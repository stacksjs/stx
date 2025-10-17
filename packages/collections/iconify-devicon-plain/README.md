# @stacksjs/iconify-devicon-plain

Devicon Plain icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-devicon-plain
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-devicon-plain'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-devicon-plain'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 729 icons from Devicon Plain.

## License

MIT

License: https://github.com/devicons/devicon/blob/master/LICENSE

## Credits

- Icons: konpa (https://github.com/devicons/devicon/tree/master)
- Iconify: https://iconify.design/
