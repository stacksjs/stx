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

### UI Components (35)

- **Accordion** - Expandable content sections with keyboard navigation
- **Auth** - Login, Signup, and 2FA components
- **Audio** - Audio player with waveform visualization
- **Avatar** - User avatars with fallback initials and status indicators
- **Badge** - Labels and tags with color variants and removable option
- **Breadcrumb** - Navigation breadcrumbs with collapse support
- **Button** - Versatile button with loading, icons, 5 sizes (xs-xl), full-width
- **Card** - Content cards with images, variants, and hover effects
- **Drawer** - Slide-out panel from any direction
- **Form** - Form wrapper with validation, error handling, and submit management
- **Image** - Optimized images with lazy loading, srcset, WebP, blur placeholder
- **Pagination** - Page navigation with customizable display
- **Portal** - Render content outside DOM hierarchy
- **Teleport** - Move content to different DOM nodes
- **Payment** - Stripe checkout and payment management (3 components)
- **Progress** - Linear and circular progress indicators
- **Select** - Native-style select dropdown
- **Skeleton** - Loading placeholders with multiple variants
- **Spinner** - Loading spinners with multiple styles (circle, dots, bars, ring)
- **Storage** - Enhanced storage with watch, compression, encryption, batch operations, quota checking
- **Switch** - Modern toggle switch component
- **Tabs** - Tabbed content with horizontal/vertical layouts and multiple variants
- **Tooltip** - Contextual tooltips with positioning options
- **Video** - Video player with aspect ratio support
- **VirtualList** - Windowed list for rendering large datasets efficiently
- **VirtualTable** - Windowed table with columns for large datasets
- **Dropdown** - Menu dropdown component with keyboard navigation
- **Dialog** - Modal dialog component with backdrop
- **Radio Group** - Radio button group with single selection
- **Popover** - Floating panel component with positioning
- **Listbox** - Custom select component with keyboard support
- **Combobox** - Searchable select with filtering
- **Notification** - Toast notifications with auto-hide
- **Stepper** - Multi-step progress indicator
- **Transition** - Enter/leave animations with 7 presets, lifecycle hooks, and custom timing
- **Table** - Responsive table with sorting/filtering
- **Command Palette** - Searchable command menu

### Input Components (5)

- **TextInput** - Base input with icons, clear button, character counter
- **EmailInput** - Email input with validation
- **PasswordInput** - Password input with show/hide toggle & strength indicator
- **NumberInput** - Number input with increment/decrement controls
- **SearchInput** - Search with debounced callback

### Form Components (3)

- **Textarea** - Multi-line input with auto-resize
- **Checkbox** - Checkbox with indeterminate state
- **Radio** - Radio button with descriptions

### Utility Components

- **CodeBlock** - Syntax highlighted code blocks with copy functionality
- **Hero** - Hero section component
- **Footer** - Footer component with social links
- **Installation** - Installation instructions component

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

### Core Composables

#### useDarkMode

```typescript
const { isDark, theme, toggle, setTheme } = useDarkMode({
  storageKey: 'theme',
  defaultTheme: 'system',
})
```

#### useCopyCode

```typescript
const { copied, copy, reset } = useCopyCode({
  code: 'const foo = "bar"',
  onSuccess: () => console.log('Copied!'),
  timeout: 2000,
})
```

#### useSEO

```typescript
useSEO({
  title: 'My Page',
  description: 'Page description',
  ogImage: 'https://example.com/og.png',
})
```

### Utility Composables (5 new)

#### useClickOutside

```typescript
const cleanup = useClickOutside(
  elementRef,
  () => console.log('Clicked outside!'),
  { enabled: true, ignore: ['.modal'] }
)
```

#### useKeyboard

```typescript
useKeyboard([
  { key: 'Escape', handler: () => closeModal() },
  { key: 's', ctrl: true, handler: () => save() },
])
```

#### useFocusTrap

```typescript
const { activate, deactivate } = useFocusTrap(containerRef, {
  initialFocus: firstInputRef,
  returnFocus: true,
})
```

#### useMediaQuery

```typescript
const { matches } = useMediaQuery('(min-width: 768px)')
const { matches: isDark } = useIsDarkMode()
const { matches: isMobile } = useIsMobile()
```

#### useLocalStorage

```typescript
const { value, setValue, removeValue } = useLocalStorage('key', 'initial')
setValue('new value')
```

## Animation Utilities (3 modules)

### Easing Functions (33 functions)

```typescript
import { Easing } from '@stacksjs/components'

// Linear, Quad, Cubic, Quart, Quint, Sine, Expo, Circ, Elastic, Back, Bounce
const value = Easing.easeInOutCubic(time, start, change, duration)
```

### Keyframe Animations (15 presets)

```typescript
import { animate, KeyframeAnimations } from '@stacksjs/components'

// Predefined animations: fadeIn, fadeOut, slideInUp, slideInDown, zoom, bounce, pulse, shake, etc.
animate(element, 'fadeIn', { duration: 500 })
```

### CSS Animation Helpers

```typescript
import { applyAnimation, staggerAnimation, sequenceAnimations } from '@stacksjs/components'

applyAnimation(element, 'slide-in', { duration: '300ms' })
staggerAnimation(elements, 'fade-in', { stagger: 100 })
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
- ✅ 35 UI Components (Accordion, Auth, Audio, Avatar, Badge, Breadcrumb, Button, Card, Drawer, Form, Image, Pagination, Portal, Teleport, Payment, Progress, Select, Skeleton, Spinner, Storage, Switch, Tabs, Tooltip, Video, VirtualList, VirtualTable, Dropdown, Dialog, Radio Group, Popover, Listbox, Combobox, Notification, Stepper, Transition, Table, Command Palette)
- ✅ 5 Input Components (TextInput, EmailInput, PasswordInput, NumberInput, SearchInput)
- ✅ 3 Form Components (Textarea, Checkbox, Radio)
- ✅ 8 Composables (useDarkMode, useCopyCode, useSEO, useClickOutside, useKeyboard, useFocusTrap, useMediaQuery, useLocalStorage)
- ✅ Animation Utilities (33 easing functions, 15 keyframe presets, CSS helpers)
- ✅ **Total: 47 Components + 8 Composables + Animation Utils**

## License

MIT © [Chris Breuer](https://github.com/chrisbbreuer)

## Credits

- Built with [STX](https://github.com/stacksjs/stx)
- Styled with [Headwind](https://github.com/stacksjs/headwind)
- Syntax highlighting by [ts-syntax-highlighter](https://github.com/stacksjs/ts-syntax-highlighter)
- Inspired by [Headless UI](https://headlessui.com)
