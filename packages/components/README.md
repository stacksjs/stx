# @stacksjs/components

A modern, accessible component library built with STX, featuring headwind utility classes and TypeScript syntax highlighting.

## Features

- 🚀 Built with STX templating engine
- 🎨 Styled with headwind utility-first CSS
- 🎯 TypeScript syntax highlighting with ts-syntax-highlighter
- ♿ Accessible by default (WAI-ARIA compliant)
- 🌙 Dark mode support
- 📦 Tree-shakeable
- 🔧 Fully customizable
- ⚡ Optimized for performance

## Installation

```bash
bun add @stacksjs/components
```

Or with other package managers:

```bash
npm install @stacksjs/components
pnpm add @stacksjs/components
yarn add @stacksjs/components
```

## Components

### UI Components (20)

- **Auth** - Login, Signup, and 2FA components
- **Audio** - Audio player with waveform visualization
- **Button** - Versatile button with multiple variants and sizes
- **Drawer** - Slide-out panel from any direction
- **Image** - Optimized images with lazy loading
- **Select** - Native-style select dropdown
- **Storage** - localStorage/sessionStorage utilities
- **Switch** - Modern toggle switch component
- **Video** - Video player with aspect ratio support
- **Dropdown** - Menu dropdown component with keyboard navigation
- **Dialog** - Modal dialog component with backdrop
- **Radio Group** - Radio button group with single selection
- **Popover** - Floating panel component with positioning
- **Listbox** - Custom select component with keyboard support
- **Combobox** - Searchable select with filtering
- **Notification** - Toast notifications with auto-hide
- **Stepper** - Multi-step progress indicator
- **Transition** - Enter/leave animations
- **Table** - Responsive table with sorting/filtering
- **Command Palette** - Searchable command menu

### Utility Components

- **CodeBlock** - Syntax highlighted code blocks with copy functionality
- **Hero** - Hero section component
- **Footer** - Footer component with social links
- **Installation** - Installation instructions component

### More Coming Soon!

We're actively migrating 12 more components including:
- Dropdown
- Dialog/Modal
- Radio Group
- Select
- Combobox
- Command Palette
- Popover
- Notification/Toast
- Table
- Calendar
- Stepper
- Listbox
- Transition
- And more...

## Component Syntax

stx provides multiple ways to use components, giving you flexibility to choose the syntax that best fits your project:

### 1. @component Directive with Object Shorthand (Recommended)

The most concise syntax using ES6 object shorthand:

```stx
<script>
export const title = 'Welcome'
export const variant = 'primary'
export const onClick = () => console.log('clicked')
</script>

@component('Button', {
  title,
  variant,
  onClick
})
@endcomponent
```

### 2. @component Directive with Full Props

Traditional explicit prop mapping:

```stx
@component('Button', {
  title: title,
  variant: variant,
  onClick: onClick
})
@endcomponent
```

### 3. PascalCase Component Tags with Dynamic Binding (Vue-like)

Use `:prop` syntax for dynamic values from context:

```stx
<script>
export const title = 'Welcome'
export const variant = 'primary'
</script>

<Button
  :title="title"
  :variant="variant"
  :onClick="onClick"
/>
```

### 4. PascalCase Component Tags with Static Values

Use regular attributes for static strings:

```stx
<Button
  title="Welcome"
  variant="primary"
/>
```

### 5. Mixed Static and Dynamic Props

Combine static strings and dynamic bindings:

```stx
<Button
  title="Static Title"
  :variant="dynamicVariant"
  size="large"
/>
```

All these syntaxes are equivalent and fully interchangeable. Choose the one that fits your coding style!

## Usage

### Basic Example

```stx
<script>
import { Button, Switch } from '@stacksjs/components'

let notifications = true

function handleNotificationChange(checked) {
  notifications = checked
}

module.exports = { notifications, handleNotificationChange }
</script>

<div class="p-6">
  <h1 class="text-2xl font-bold mb-4">Settings</h1>

  @component('Switch', {
    checked: notifications,
    label: 'Enable notifications',
    onChange: handleNotificationChange
  })

  <div class="mt-4">
    @component('Button', { variant: 'primary' })
      Save Changes
    @endcomponent
  </div>
</div>
```

### With Code Highlighting

```stx
<script>
import { CodeBlock } from '@stacksjs/components'

const code = `
function greet(name: string) {
  console.log(\`Hello, \${name}!\`)
}
`

module.exports = { code }
</script>

@component('CodeBlock', {
  code: code,
  language: 'typescript',
  copyable: true
})
```

### Using Composables

```stx
<script>
import { useDarkMode, useCopyCode } from '@stacksjs/components'

const { isDark, toggle } = useDarkMode()

module.exports = { isDark, toggle }
</script>

<button @click="toggle">
  @if(isDark)
    Switch to Light Mode
  @else
    Switch to Dark Mode
  @endif
</button>
```

## Configuration

### Headwind Configuration

The components use headwind for utility classes. You can customize the design system by creating a `headwind.config.ts` file:

```typescript
import type { HeadwindConfig } from '@stacksjs/headwind'

export default {
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#your-color',
        },
      },
    },
  },
} satisfies HeadwindConfig
```

### Syntax Highlighting Themes

Configure syntax highlighting themes for code blocks:

```typescript
import { createHighlighter } from 'ts-syntax-highlighter'

const highlighter = await createHighlighter({
  themes: ['github-light', 'github-dark'],
  languages: ['typescript', 'javascript', 'html'],
})
```

## Component APIs

### Button

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
  onClick?: () => void
}
```

### Switch

```typescript
interface SwitchProps {
  checked?: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onChange?: (checked: boolean) => void
  label?: string
}
```

### CodeBlock

```typescript
interface CodeBlockProps {
  code: string
  language?: string
  theme?: 'light' | 'dark' | 'auto'
  lineNumbers?: boolean
  copyable?: boolean
  className?: string
}
```

## Composables

### useDarkMode

```typescript
const { isDark, theme, toggle, setTheme } = useDarkMode({
  storageKey: 'theme',
  defaultTheme: 'system',
})
```

### useCopyCode

```typescript
const { copied, copy, reset } = useCopyCode({
  code: 'const foo = "bar"',
  onSuccess: () => console.log('Copied!'),
  timeout: 2000,
})
```

### useSEO

```typescript
useSEO({
  title: 'My Page',
  description: 'Page description',
  ogImage: 'https://example.com/og.png',
})
```

## Development

```bash
# Install dependencies
bun install

# Build the library
bun run build

# Run tests
bun test

# Watch mode
bun run dev
```

## Contributing

Contributions are welcome! Please read our [contributing guidelines](../../CONTRIBUTING.md) before submitting a PR.

## Migration Status

This library is actively being migrated from Vue to STX. Check our [TODO.md](../../TODO.md) for the complete migration roadmap and progress.

**Completed:**
- ✅ Infrastructure setup
- ✅ Composables (useDarkMode, useCopyCode, useSEO)
- ✅ Base components (CodeBlock, Hero, Footer, Installation)
- ✅ 9 UI Components (Button, Switch, Dropdown, Dialog, Radio Group, Popover, Listbox, Combobox, Notification)

**In Progress:**
- 🔄 Migrating 12 more components from Vue

## License

MIT © [Chris Breuer](https://github.com/chrisbbreuer)

## Credits

- Built with [STX](https://github.com/stacksjs/stx)
- Styled with [Headwind](https://github.com/stacksjs/headwind)
- Syntax highlighting by [ts-syntax-highlighter](https://github.com/stacksjs/ts-syntax-highlighter)
- Inspired by [Headless UI](https://headlessui.com)
