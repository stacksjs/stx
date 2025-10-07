# Migration Guides

This section provides detailed guides for migrating from other frameworks to stx, as well as upgrading between stx versions.

## Migrating from Other Frameworks

### From Vue.js

#### Template Syntax Changes

Vue.js templates to stx templates:

```vue
<!-- Vue.js -->
<template>
  <div>
    <h1>{{ title }}</h1>
    <p v-if="showContent">{{ content }}</p>
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>
```

```stx
<!-- stx -->
<div>
  <h1>{{ title }}</h1>
  @if(showContent)
    <p>{{ content }}</p>
  @endif
  @foreach(items as item)
    <li>{{ item.name }}</li>
  @endforeach
</div>
```

#### Component Definition

Vue.js component to stx component:

```vue
<!-- Vue.js -->
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  title: string
  items: string[]
}

const props = defineProps<Props>()
const count = ref(0)
const doubleCount = computed(() => count.value * 2)

const increment = () => count.value++
</script>
```

```stx
<!-- stx -->
@ts
interface Props {
  title: string
  items: string[]
}
@endts

@component('MyComponent', {
  props: {
    title: {
      type: String,
      required: true
    },
    items: {
      type: Array as PropType<string[]>,
      required: true
    }
  },
  setup(props) {
    const count = ref(0)
    const doubleCount = computed(() => count.value * 2)

    const increment = () => count.value++

    return { count, doubleCount, increment }
  }
})
```

#### State Management

Vue.js Pinia store to stx store:

```typescript
// Vue.js (Pinia)
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  actions: {
    increment() {
      this.count++
    }
  },
  getters: {
    doubleCount: (state) => state.count * 2
  }
})
```

```typescript
// stx
import { createStore } from '@stx/store'

export const useCounterStore = createStore({
  state: {
    count: 0
  },
  actions: {
    increment() {
      this.count++
    }
  },
  computed: {
    doubleCount() {
      return this.count * 2
    }
  }
})
```

### From React

#### JSX to stx Templates

React JSX to stx templates:

```jsx
// React
function MyComponent({ title, items }) {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>{title}</h1>
      {showContent && <p>{content}</p>}
      <ul>
        {items.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  )
}
```

```stx
<!-- stx -->
@component('MyComponent', {
  props: {
    title: String,
    items: Array
  },
  setup() {
    const count = ref(0)
    return { count }
  }
})
  <div>
    <h1>{{ title }}</h1>
    @if(showContent)
      <p>{{ content }}</p>
    @endif
    @foreach(items as item)
      <li>{{ item.name }}</li>
    @endforeach
    <button @click="count++">
      Count: {{ count }}
    </button>
  </div>
@endcomponent
```

#### Hooks to Setup

React hooks to stx setup:

```jsx
// React
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue)
  const increment = () => setCount(count + 1)

  useEffect(() => {
    console.log('Count changed:', count)
  }, [count])

  return { count, increment }
}
```

```typescript
// stx
function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  const increment = () => count.value++

  watch(count, (newValue) => {
    console.log('Count changed:', newValue)
  })

  return { count, increment }
}
```

#### Context to Stores

React context to stx stores:

```jsx
// React
const ThemeContext = createContext('light')

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

```typescript
// stx
const useThemeStore = createStore({
  state: {
    theme: 'light'
  },
  actions: {
    setTheme(theme: string) {
      this.theme = theme
    }
  }
})
```

### From Laravel Blade

#### Blade Directives

Blade directives to stx directives:

```blade
{{-- Blade --}}
@if ($user->isAdmin)
    <admin-panel />
@else
    <user-panel />
@endif

@foreach ($users as $user)
    <user-card :user="$user" />
@endforeach

@include('partials.header', ['title' => $title])
```

```stx
<!-- stx -->
@if(user.isAdmin)
  <admin-panel />
@else
  <user-panel />
@endif

@foreach(users as user)
  <user-card :user="user" />
@endforeach

<Header :title="title" />
```

#### Components

Blade components to stx components:

```blade
{{-- Blade --}}
@props(['type' => 'primary', 'size' => 'md'])

<button {{ $attributes->merge(['class' => "btn btn-$type btn-$size"]) }}>
    {{ $slot }}
</button>

@once
<style>
    .btn { /* ... */ }
</style>
@endonce
```

```stx
<!-- stx -->
@ts
interface Props {
  type?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}
@endts

@component('Button', {
  props: {
    type: {
      type: String,
      default: 'primary'
    },
    size: {
      type: String,
      default: 'md'
    }
  }
})
  <button :class="['btn', `btn-${type}`, `btn-${size}`]">
    <slot></slot>
  </button>

  <style scoped>
    .btn { /* ... */ }
  </style>
@endcomponent
```

## Version Migration

### Upgrading to stx 2.0

#### Breaking Changes

1. Template Syntax Updates

```stx
// Before (1.x)
@foreach($items as $item)
  {{ $item }}
@endforeach

// After (2.0)
@foreach(items as item)
  {{ item }}
@endforeach
```

2. Component Definition

```stx
// Before (1.x)
@component('MyComponent')
  export default {
    props: ['title']
  }
@endcomponent

// After (2.0)
@component('MyComponent', {
  props: {
    title: String
  }
})
```

3. TypeScript Integration

```stx
// Before (1.x)
@component('MyComponent')
  interface Props {
    title: string
  }

  export default {
    props: {} as Props
  }
@endcomponent

// After (2.0)
@ts
interface Props {
  title: string
}
@endts

@component('MyComponent', {
  props: {} as Props
})
```

#### Migration Steps

1. Update Dependencies

```bash
# Update stx core
bun install @stx/core@latest

# Update optional packages
bun install @stx/store@latest @stx/router@latest
```

2. Update Configuration

```typescript
// stx.config.ts
import { defineConfig } from '@stx/core'

// Before (1.x)
export default {
  // ...config
}

// After (2.0)
export default defineConfig({
  // ...config
})
```

3. Update Component Imports

```typescript
// Before (1.x)
import { createComponent } from '@stx/core'

// After (2.0)
import { component } from '@stx/core'
```

4. Update Store Usage

```typescript
// Before (1.x)
import { createStore } from '@stx/store'

const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      state.count++
    }
  }
})

// After (2.0)
import { createStore } from '@stx/store'

const store = createStore({
  state: {
    count: 0
  },
  actions: {
    increment() {
      this.count++
    }
  }
})
```

### Automated Migration Tool

stx provides a migration tool to help automate these changes:

```bash
# Install migration tool
bun install -g @stx/migrate

# Run migration
stx-migrate

# Review changes
git diff

# Apply changes
git add .
git commit -m "chore: migrate to stx 2.0"
```

The migration tool handles:

- Template syntax updates
- Component definition changes
- TypeScript integration
- Store mutations to actions
- Configuration file updates

### Post-Migration Checklist

1. Verify Dependencies

```bash
# Check for outdated packages
bun outdated

# Update peer dependencies
bun install
```

2. Test Components

- Run unit tests
- Check component rendering
- Verify component props
- Test component events

3. Update Documentation

- Update component examples
- Update API references
- Update type definitions

4. Performance Check

- Run build process
- Check bundle size
- Test application performance
- Monitor memory usage

5. Clean Up

- Remove deprecated code
- Update import statements
- Remove unused dependencies
- Update type definitions
