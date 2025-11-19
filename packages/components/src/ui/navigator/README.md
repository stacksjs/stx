# Navigator Component

A versatile navigation component that supports multiple orientations, variants, and styles. Perfect for main navigation, sidebars, tabs, and more.

## Features

- ✅ Multiple variants (default, pills, underline, sidebar)
- ✅ Horizontal and vertical orientations
- ✅ Active state handling
- ✅ Icon support
- ✅ Badge support
- ✅ Disabled states
- ✅ Multiple sizes (sm, md, lg)
- ✅ Custom navigation handlers
- ✅ Dark mode support
- ✅ Accessible with ARIA labels
- ✅ Keyboard navigation support

## Usage

### Basic Horizontal Navigation

```stx
<script>
import { Navigator } from '@stacksjs/components'

const items = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'about', label: 'About', href: '/about' },
  { id: 'contact', label: 'Contact', href: '/contact' },
]

let activeItem = 'home'
</script>

<Navigator items={items} active={activeItem} />
```

### Vertical Sidebar Navigation

```stx
<script>
import { Navigator } from '@stacksjs/components'

const items = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'projects', label: 'Projects', href: '/projects' },
  { id: 'team', label: 'Team', href: '/team' },
  { id: 'settings', label: 'Settings', href: '/settings' },
]
</script>

<Navigator
  items={items}
  active="dashboard"
  orientation="vertical"
  variant="sidebar"
/>
```

### Pills Navigation

```stx
<script>
import { Navigator } from '@stacksjs/components'

const items = [
  { id: 'overview', label: 'Overview', href: '/overview' },
  { id: 'analytics', label: 'Analytics', href: '/analytics' },
  { id: 'reports', label: 'Reports', href: '/reports' },
]
</script>

<Navigator
  items={items}
  active="overview"
  variant="pills"
/>
```

### Underline Tabs

```stx
<script>
import { Navigator } from '@stacksjs/components'

const tabs = [
  { id: 'profile', label: 'Profile', href: '#profile' },
  { id: 'security', label: 'Security', href: '#security' },
  { id: 'notifications', label: 'Notifications', href: '#notifications' },
]
</script>

<Navigator
  items={tabs}
  active="profile"
  variant="underline"
/>
```

### With Icons

```stx
<script>
import { Navigator } from '@stacksjs/components'

const items = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>',
  },
  {
    id: 'search',
    label: 'Search',
    href: '/search',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>',
  },
]
</script>

<Navigator items={items} active="home" />
```

### With Badges

```stx
<script>
import { Navigator } from '@stacksjs/components'

const items = [
  { id: 'inbox', label: 'Inbox', href: '/inbox', badge: '12' },
  { id: 'drafts', label: 'Drafts', href: '/drafts', badge: '3' },
  { id: 'sent', label: 'Sent', href: '/sent' },
]
</script>

<Navigator items={items} active="inbox" variant="sidebar" orientation="vertical" />
```

### With Disabled Items

```stx
<script>
import { Navigator } from '@stacksjs/components'

const items = [
  { id: 'enabled', label: 'Enabled', href: '/enabled' },
  { id: 'disabled', label: 'Disabled (Coming Soon)', href: '/disabled', disabled: true },
  { id: 'another', label: 'Another Link', href: '/another' },
]
</script>

<Navigator items={items} active="enabled" />
```

### With Custom Navigation Handler

```stx
<script>
import { Navigator } from '@stacksjs/components'

const items = [
  { id: 'tab1', label: 'Tab 1' },
  { id: 'tab2', label: 'Tab 2' },
  { id: 'tab3', label: 'Tab 3' },
]

let activeTab = 'tab1'

function handleNavigate(item) {
  activeTab = item.id
  console.log('Navigated to:', item.label)
  // Custom logic here (e.g., switch content, fetch data, etc.)
}
</script>

<Navigator
  items={items}
  active={activeTab}
  onNavigate={handleNavigate}
  variant="underline"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `NavigatorItem[]` | `[]` | Array of navigation items |
| `active` | `string` | `''` | ID or href of the currently active item |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout orientation |
| `variant` | `'default' \| 'pills' \| 'underline' \| 'sidebar'` | `'default'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of navigation items |
| `onNavigate` | `(item: NavigatorItem) => void` | - | Custom navigation handler (prevents default link behavior) |
| `className` | `string` | `''` | Additional CSS classes |

### NavigatorItem Interface

```typescript
interface NavigatorItem {
  id?: string           // Unique identifier
  label: string         // Display text
  href?: string         // Link URL (renders as <a> if provided, <button> otherwise)
  icon?: string         // SVG icon HTML
  badge?: string | number // Badge text/number
  disabled?: boolean    // Whether the item is disabled
}
```

## Variants

### Default
Clean, simple navigation with subtle hover effects.

### Pills
Rounded pill-style navigation with filled active state.

### Underline
Tab-style navigation with bottom border indicator.

### Sidebar
Left-bordered navigation optimized for vertical sidebars.

## Sizes

- **sm**: Compact padding and text
- **md**: Default comfortable size
- **lg**: Large padding and text

## Examples

### App Header Navigation

```stx
<script>
import { Navigator } from '@stacksjs/components'

const mainNav = [
  { id: 'products', label: 'Products', href: '/products' },
  { id: 'pricing', label: 'Pricing', href: '/pricing' },
  { id: 'docs', label: 'Docs', href: '/docs' },
  { id: 'blog', label: 'Blog', href: '/blog' },
]
</script>

<header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
  <div class="max-w-7xl mx-auto px-4 py-4">
    <Navigator items={mainNav} active="/products" />
  </div>
</header>
```

### Dashboard Sidebar

```stx
<script>
import { Navigator } from '@stacksjs/components'

const sidebarNav = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>',
  },
  {
    id: 'projects',
    label: 'Projects',
    href: '/projects',
    badge: '5',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>',
  },
  {
    id: 'team',
    label: 'Team',
    href: '/team',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>',
  },
]
</script>

<aside class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full">
  <Navigator
    items={sidebarNav}
    active="/dashboard"
    orientation="vertical"
    variant="sidebar"
  />
</aside>
```

### Settings Tabs

```stx
<script>
import { Navigator } from '@stacksjs/components'

const settingsTabs = [
  { id: 'general', label: 'General', href: '#general' },
  { id: 'security', label: 'Security', href: '#security' },
  { id: 'notifications', label: 'Notifications', href: '#notifications' },
  { id: 'billing', label: 'Billing', href: '#billing' },
]

let activeTab = 'general'
</script>

<div class="border-b border-gray-200 dark:border-gray-700 mb-6">
  <Navigator
    items={settingsTabs}
    active={activeTab}
    variant="underline"
  />
</div>
```

## Styling

The navigator uses utility-first CSS classes and supports dark mode. Customize appearance by passing additional classes:

```stx
<Navigator
  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2"
  items={items}
  active="home"
/>
```

## Accessibility

- Semantic HTML (`<nav>`, `<a>`, `<button>`)
- ARIA labels for navigation role
- `aria-current="page"` for active items
- `aria-disabled` for disabled items
- Keyboard navigation support
- Focus indicators

## Browser Support

Works in all modern browsers that support:
- CSS Flexbox
- CSS custom properties
- ES6+ JavaScript

## Related Components

- **Breadcrumb**: Hierarchical navigation trail
- **Tabs**: Content switching interface
- **Sidebar**: Full sidebar layout with navigation
- **Menu**: Dropdown menu navigation
