# TypeScript Integration

STX provides first-class TypeScript support out of the box. This guide covers how to use TypeScript effectively in your STX applications.

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

STX provides built-in type declarations. Install the types:

```bash
bun add -D @stacksjs/stx
```

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

STX provides useful utility types:

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

Extend STX's types:

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