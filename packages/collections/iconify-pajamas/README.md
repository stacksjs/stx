# @stacksjs/iconify-pajamas

Gitlab SVGs icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-pajamas
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-pajamas'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-pajamas'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 414 icons from Gitlab SVGs.

## License

MIT

License: https://gitlab.com/gitlab-org/gitlab-svgs/-/blob/main/LICENSE

## Credits

- Icons: GitLab B.V. (https://gitlab.com/gitlab-org/gitlab-svgs/-/tree/main)
- Iconify: https://iconify.design/
