# TypeScript Integration

stx provides first-class TypeScript support out of the box. This guide covers how to use TypeScript effectively in your stx applications.

## Setup

### TypeScript Configuration

Create a `tsconfig.json` in your project root:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "skipLibCheck": true,
    "isolatedModules": true,
    "types": ["@stacksjs/stx/types"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.stx",
    "src/**/*.d.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

### Type Declarations

stx provides built-in type declarations. Install the types:

```bash
bun add -D @stacksjs/stx
```

The package's main `types` entry references an ambient declaration file
(`stx.d.ts`) that ships as part of the package. As soon as `@stacksjs/stx`
is in your `node_modules`, TypeScript automatically picks up:

1. **Module declarations** for `*.stx` and `*.md` imports — so
   `import HomePage from './pages/home.stx'` typechecks without errors.
2. **Runtime globals** injected by the signals runtime into `<script client>`
   blocks (see [Runtime Globals](#runtime-globals) below).
3. **The `window.stx` registry interface** so `window.stx.state(...)` etc.
   are typed in browser code.

You should **not** need to write your own `stx.d.ts` file. If you have one
declaring `state`, `derived`, `useStore`, etc. as a workaround for missing
types, you can delete it — those declarations are now part of the package.
The only legitimate reason to keep an `stx.d.ts` in your project is for
[Module Augmentation](#module-augmentation) — adding your *own* component
or directive types to stx's interfaces.

## Runtime Globals

Inside `<script client>` blocks, the stx signals runtime auto-injects a set
of functions and composables so you can use them without explicit imports.
These are typed automatically through the package's ambient declarations:

```html
<script client>
  // Signals — no import needed
  const count = state(0)
  const doubled = derived(() => count() * 2)
  effect(() => console.log('count is', count()))

  // Lifecycle
  onMount(() => console.log('mounted'))
  onDestroy(() => console.log('cleanup'))

  // Stores
  const session = useStore('session')

  // Composables
  const isMobile = useMediaQuery('(max-width: 768px)')
  const theme = useLocalStorage('theme', 'light')

  // Routing
  navigate('/about')
  const route = useRoute()
</script>
```

The full list of auto-injected globals (matches `STX_AUTO_IMPORTS` in the
runtime):

| Category | Symbols |
|---|---|
| Signals | `state`, `derived`, `effect`, `batch`, `untrack`, `peek`, `isSignal`, `isDerived` |
| Lifecycle | `onMount`, `onDestroy`, `onMounted`, `onUnmounted`, `onBeforeMount`, `onBeforeUnmount`, `onErrorCaptured` |
| Vue compat | `ref`, `reactive`, `computed`, `watch`, `watchEffect` |
| Composition API | `defineProps`, `withDefaults`, `defineEmits`, `defineExpose`, `provide`, `inject`, `nextTick` |
| Stores | `defineStore`, `useStore`, `createStore` |
| Routing | `navigate`, `goBack`, `goForward`, `useRoute`, `useSearchParams`, `setRouteParams` |
| Data | `useFetch`, `useQuery`, `useMutation` |
| DOM | `useRef`, `useEventListener`, `useClickOutside`, `useFocus` |
| Storage | `useLocalStorage`, `useSessionStorage` |
| Timers | `useDebounce`, `useThrottle`, `useInterval`, `useTimeout` |
| State helpers | `useToggle`, `useCounter`, `useAsync` |
| Color mode | `useColorMode`, `useDark` |
| Head/SEO | `useHead`, `useSeoMeta` |
| WebSocket | `useWebSocket` |

You can still write explicit imports if you prefer:

```html
<script client>
  import { state, derived } from '@stacksjs/stx'
  // ...
</script>
```

But the imports get rewritten to globals during template compilation
anyway, so the explicit form is purely for IDE clarity — the auto-injected
form runs identically.

## Using TypeScript in Templates

### Basic Type Usage

Use the `@ts` directive to write TypeScript code:

```stx
@ts
interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
}

const user: User = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user'
}
@endts

<div class="user-card">
  <h2>{{ user.name }}</h2>
  <p>{{ user.email }}</p>
  <span class="badge badge-{{ user.role }}">
    {{ user.role }}
  </span>
</div>
```

### Component Props

Define and use typed props:

```stx
@ts
interface ButtonProps {
  type: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: (event: MouseEvent) => void
}
@endts

@component('Button', {
  props: {
    type: 'primary',
    size: 'md',
    disabled: false,
    onClick: undefined
  } as ButtonProps
})
  <button
    class="btn btn-{{ type }} btn-{{ size }}"
    :disabled="disabled"
    @click="onClick"
  >
    <slot></slot>
  </button>
@endcomponent
```

### Event Handling

Type event handlers properly:

```stx
@ts
interface FormData {
  username: string
  password: string
}

function handleSubmit(event: SubmitEvent) {
  event.preventDefault()
  const form = event.target as HTMLFormElement
  const formData = new FormData(form)

  const data: FormData = {
    username: formData.get('username') as string,
    password: formData.get('password') as string
  }

  // Handle form submission
}
@endts

<form @submit="handleSubmit">
  <input type="text" name="username" />
  <input type="password" name="password" />
  <button type="submit">Submit</button>
</form>
```

## Advanced TypeScript Features

### Generic Components

Create reusable generic components:

```stx
@ts
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => string
}
@endts

@component('List', {
  props: {
    items: [],
    renderItem: (item: any) => String(item)
  }
})
  <ul class="list">
    @foreach(items as item)
      <li>{{ renderItem(item) }}</li>
    @endforeach
  </ul>
@endcomponent

<!-- Usage -->
@ts
interface User {
  id: number
  name: string
}

const users: User[] = [
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' }
]
@endts

<List
  :items="users"
  :renderItem="(user) => user.name"
/>
```

### Type Guards

Use type guards for better type safety:

```stx
@ts
interface SuccessResponse {
  type: 'success'
  data: any
}

interface ErrorResponse {
  type: 'error'
  error: string
}

type Response = SuccessResponse | ErrorResponse

function isSuccess(response: Response): response is SuccessResponse {
  return response.type === 'success'
}
@endts

@component('ResponseHandler')
  @ts
  const response: Response = props.response
  @endts

  <div class="response">
    @if(isSuccess(response))
      <success-view :data="response.data" />
    @else
      <error-view :message="response.error" />
    @endif
  </div>
@endcomponent
```

### Utility Types

stx provides useful utility types:

```stx
@ts
import type { ComponentProps, ComponentEmits, ComponentSlots } from '@stacksjs/stx'

// Props type
type ButtonProps = ComponentProps<typeof Button>

// Emits type
type AlertEmits = ComponentEmits<{
  close: []
  action: [action: string]
}>

// Slots type
type CardSlots = ComponentSlots<{
  header: { title: string }
  default: {}
  footer: { actions: string[] }
}>
@endts
```

### Module Augmentation

Extend stx's types:

```ts
// types/stx.d.ts
import '@stacksjs/stx'

declare module '@stacksjs/stx' {
  interface GlobalComponents {
    Button: typeof import('../components/Button').Button
    Card: typeof import('../components/Card').Card
  }

  interface GlobalDirectives {
    tooltip: typeof import('../directives/tooltip').tooltip
  }
}
```

## Type-Safe APIs

### API Calls

Type your API responses:

```stx
@ts
interface ApiResponse<T> {
  data: T
  status: number
  message: string
}

interface User {
  id: number
  name: string
  email: string
}

async function fetchUser(id: number): Promise<ApiResponse<User>> {
  const response = await fetch(`/api/users/${id}`)
  return response.json()
}
@endts

@component('UserProfile')
  @ts
  const userId = props.userId
  let user: User | null = null
  let error: Error | null = null

  onMounted(async () => {
    try {
      const response = await fetchUser(userId)
      user = response.data
    } catch (e) {
      error = e as Error
    }
  })
  @endts

  <div class="profile">
    @if(error)
      <error-message :error="error" />
    @elseif(user)
      <user-details :user="user" />
    @else
      <loading-spinner />
    @endif
  </div>
@endcomponent
```

### State Management

Type your state properly:

```stx
@ts
interface State {
  user: User | null
  theme: 'light' | 'dark'
  notifications: Notification[]
}

interface Actions {
  setUser: (user: User | null) => void
  toggleTheme: () => void
  addNotification: (notification: Notification) => void
}

const state = reactive<State>({
  user: null,
  theme: 'light',
  notifications: []
})

const actions: Actions = {
  setUser: (user) => {
    state.user = user
  },
  toggleTheme: () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light'
  },
  addNotification: (notification) => {
    state.notifications.push(notification)
  }
}
@endts
```

## Best Practices

1. **Type Safety**
   - Enable strict mode in TypeScript
   - Use explicit type annotations
   - Avoid `any` type
   - Use type guards for type narrowing

2. **Component Types**
   - Define interfaces for props
   - Use union types for variants
   - Type event handlers properly
   - Document complex types

3. **Code Organization**
   - Keep type definitions close to usage
   - Use barrel exports for types
   - Create custom type utilities
   - Maintain type documentation

4. **Performance**
   - Use type-only imports
   - Avoid excessive type complexity
   - Leverage TypeScript's type inference
   - Use const assertions when appropriate

## Next Steps

- Learn about [Component Testing](/advanced/testing)
- Explore [State Management](/advanced/state)
- Understand [Build Configuration](/advanced/build)
- Check out [Performance Optimization](/features/performance)
