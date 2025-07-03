# Examples & Tutorials

This section provides practical examples and step-by-step tutorials to help you master STX.

## Basic Examples

### Counter Component
A simple counter component demonstrating state management and events:

```stx
@ts
interface Props {
  initialCount?: number
}
@endts

@component('Counter', {
  props: {
    initialCount: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    const count = ref(props.initialCount)
    
    const increment = () => count.value++
    const decrement = () => count.value--
    
    return { count, increment, decrement }
  }
})
  <div class="counter">
    <button @click="decrement">-</button>
    <span>{{ count }}</span>
    <button @click="increment">+</button>
  </div>

  <style scoped>
    .counter {
      @apply flex items-center gap-4;
    }
    button {
      @apply px-4 py-2 bg-blue-500 text-white rounded;
    }
    span {
      @apply text-xl font-bold;
    }
  </style>
@endcomponent
```

### Todo List
A complete todo list application showing component composition and state management:

```stx
@ts
interface Todo {
  id: number
  text: string
  completed: boolean
}

interface TodoListProps {
  title?: string
}
@endts

@component('TodoList', {
  props: {
    title: {
      type: String,
      default: 'Todo List'
    }
  },
  setup() {
    const todos = ref<Todo[]>([])
    const newTodo = ref('')

    const addTodo = () => {
      if (!newTodo.value.trim()) return
      
      todos.value.push({
        id: Date.now(),
        text: newTodo.value,
        completed: false
      })
      newTodo.value = ''
    }

    const toggleTodo = (id: number) => {
      const todo = todos.value.find(t => t.id === id)
      if (todo) todo.completed = !todo.completed
    }

    const removeTodo = (id: number) => {
      todos.value = todos.value.filter(t => t.id !== id)
    }

    return {
      todos,
      newTodo,
      addTodo,
      toggleTodo,
      removeTodo
    }
  }
})
  <div class="todo-list">
    <h2>{{ title }}</h2>
    
    <div class="add-todo">
      <input 
        type="text" 
        v-model="newTodo"
        @keyup.enter="addTodo"
        placeholder="Add new todo"
      >
      <button @click="addTodo">Add</button>
    </div>

    <ul>
      @foreach(todos as todo)
        <li :class="{ completed: todo.completed }">
          <input
            type="checkbox"
            :checked="todo.completed"
            @change="toggleTodo(todo.id)"
          >
          <span>{{ todo.text }}</span>
          <button @click="removeTodo(todo.id)">Delete</button>
        </li>
      @endforeach
    </ul>
  </div>

  <style scoped>
    .todo-list {
      @apply max-w-md mx-auto p-4;
    }
    .add-todo {
      @apply flex gap-2 mb-4;
    }
    input[type="text"] {
      @apply flex-1 px-4 py-2 border rounded;
    }
    button {
      @apply px-4 py-2 bg-blue-500 text-white rounded;
    }
    ul {
      @apply space-y-2;
    }
    li {
      @apply flex items-center gap-2 p-2 border rounded;
    }
    .completed span {
      @apply line-through text-gray-500;
    }
  </style>
@endcomponent
```

## Tutorials

### Building a Blog

#### 1. Project Setup
First, create a new STX project:

```bash
# Create new project
bunx create-stx-app my-blog
cd my-blog

# Install dependencies
bun install
```

#### 2. Create Post Component
Create a reusable post component (`components/Post.stx`):

```stx
@ts
interface Post {
  id: number
  title: string
  content: string
  author: string
  date: string
}

interface Props {
  post: Post
}
@endts

@component('Post', {
  props: {
    post: {
      type: Object as PropType<Post>,
      required: true
    }
  }
})
  <article class="post">
    <h2>{{ post.title }}</h2>
    <div class="meta">
      <span>By {{ post.author }}</span>
      <span>{{ post.date }}</span>
    </div>
    <div class="content">
      {{ post.content }}
    </div>
  </article>

  <style scoped>
    .post {
      @apply max-w-2xl mx-auto p-6 bg-white rounded shadow;
    }
    h2 {
      @apply text-2xl font-bold mb-4;
    }
    .meta {
      @apply text-sm text-gray-500 mb-4;
    }
    .content {
      @apply prose;
    }
  </style>
@endcomponent
```

#### 3. Create Blog Layout
Create a layout component (`layouts/Blog.stx`):

```stx
@component('BlogLayout')
  <div class="blog-layout">
    <header>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
    </header>

    <main>
      <slot></slot>
    </main>

    <footer>
      <p>&copy; 2024 My Blog</p>
    </footer>
  </div>

  <style>
    .blog-layout {
      @apply min-h-screen flex flex-col;
    }
    header {
      @apply bg-white shadow;
    }
    nav {
      @apply max-w-7xl mx-auto px-4 py-6 flex gap-4;
    }
    main {
      @apply flex-1 max-w-7xl mx-auto px-4 py-8;
    }
    footer {
      @apply bg-gray-100 py-6 text-center;
    }
  </style>
@endcomponent
```

#### 4. Create Blog Home Page
Create the home page (`pages/index.stx`):

```stx
@ts
import type { Post } from '../types'

interface Props {
  posts: Post[]
}
@endts

@component('HomePage', {
  props: {
    posts: {
      type: Array as PropType<Post[]>,
      required: true
    }
  }
})
  <BlogLayout>
    <h1>Welcome to My Blog</h1>

    <div class="posts">
      @foreach(posts as post)
        <Post :post="post" />
      @endforeach
    </div>
  </BlogLayout>

  <style scoped>
    h1 {
      @apply text-4xl font-bold mb-8 text-center;
    }
    .posts {
      @apply space-y-8;
    }
  </style>
@endcomponent
```

#### 5. Add State Management
Create a store for blog posts (`stores/posts.ts`):

```typescript
import { createStore } from '@stx/store'
import type { Post } from '../types'

export const usePostStore = createStore({
  state: {
    posts: [] as Post[]
  },
  
  actions: {
    async fetchPosts() {
      // Simulate API call
      const response = await fetch('/api/posts')
      this.posts = await response.json()
    },
    
    async addPost(post: Omit<Post, 'id'>) {
      // Simulate API call
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify(post)
      })
      const newPost = await response.json()
      this.posts.push(newPost)
    }
  }
})
```

### Advanced Patterns

#### Form Handling
Create a reusable form component with validation:

```stx
@ts
interface FormField {
  name: string
  type: string
  label: string
  required?: boolean
  pattern?: string
  minLength?: number
  maxLength?: number
}

interface Props {
  fields: FormField[]
  onSubmit: (data: Record<string, any>) => void
}
@endts

@component('Form', {
  props: {
    fields: {
      type: Array as PropType<FormField[]>,
      required: true
    },
    onSubmit: {
      type: Function as PropType<Props['onSubmit']>,
      required: true
    }
  },
  setup(props) {
    const formData = ref<Record<string, any>>({})
    const errors = ref<Record<string, string>>({})

    const validate = () => {
      errors.value = {}
      
      props.fields.forEach(field => {
        const value = formData.value[field.name]
        
        if (field.required && !value) {
          errors.value[field.name] = `${field.label} is required`
        }
        
        if (field.pattern && value && !new RegExp(field.pattern).test(value)) {
          errors.value[field.name] = `${field.label} is invalid`
        }
        
        if (field.minLength && value && value.length < field.minLength) {
          errors.value[field.name] = `${field.label} must be at least ${field.minLength} characters`
        }
        
        if (field.maxLength && value && value.length > field.maxLength) {
          errors.value[field.name] = `${field.label} must be at most ${field.maxLength} characters`
        }
      })
      
      return Object.keys(errors.value).length === 0
    }

    const handleSubmit = (e: Event) => {
      e.preventDefault()
      
      if (validate()) {
        props.onSubmit(formData.value)
      }
    }

    return {
      formData,
      errors,
      handleSubmit
    }
  }
})
  <form @submit="handleSubmit" class="form">
    @foreach(fields as field)
      <div class="form-field">
        <label :for="field.name">{{ field.label }}</label>
        <input
          :id="field.name"
          :type="field.type"
          :name="field.name"
          v-model="formData[field.name]"
          :required="field.required"
          :pattern="field.pattern"
          :minlength="field.minLength"
          :maxlength="field.maxLength"
        >
        @if(errors[field.name])
          <span class="error">{{ errors[field.name] }}</span>
        @endif
      </div>
    @endforeach

    <button type="submit">Submit</button>
  </form>

  <style scoped>
    .form {
      @apply max-w-md mx-auto;
    }
    .form-field {
      @apply mb-4;
    }
    label {
      @apply block mb-2 font-medium;
    }
    input {
      @apply w-full px-4 py-2 border rounded;
    }
    .error {
      @apply text-sm text-red-500 mt-1;
    }
    button {
      @apply w-full px-4 py-2 bg-blue-500 text-white rounded;
    }
  </style>
@endcomponent
```

#### Dynamic Components
Create a component that loads other components dynamically:

```stx
@ts
interface Props {
  componentName: string
  props?: Record<string, any>
}
@endts

@component('DynamicComponent', {
  props: {
    componentName: {
      type: String,
      required: true
    },
    props: {
      type: Object,
      default: () => ({})
    }
  },
  async setup(props) {
    const component = ref(null)
    
    onMounted(async () => {
      try {
        component.value = await import(`../components/${props.componentName}.stx`)
      } catch (error) {
        console.error(`Failed to load component: ${props.componentName}`, error)
      }
    })
    
    return { component }
  }
})
  @if(component)
    <component :is="component" v-bind="props" />
  @else
    <div class="loading">Loading...</div>
  @endif

  <style scoped>
    .loading {
      @apply p-4 text-center text-gray-500;
    }
  </style>
@endcomponent
```

## Best Practices

### Component Organization
Follow these best practices for organizing components:

1. Use a clear directory structure:
```
components/
  ├── common/        # Shared components
  ├── layout/        # Layout components
  ├── features/      # Feature-specific components
  └── pages/         # Page components
```

2. Keep components focused and single-responsibility
3. Use TypeScript interfaces for props and events
4. Document component usage with comments

### Performance Optimization
Tips for optimizing STX applications:

1. Use lazy loading for large components:
```typescript
const MyLargeComponent = () => import('./MyLargeComponent.stx')
```

2. Implement proper caching strategies:
```typescript
const cachedData = useMemo(() => expensiveComputation(), [deps])
```

3. Optimize renders with proper dependency tracking:
```typescript
const derivedValue = computed(() => source.value * 2)
```

4. Use efficient list rendering:
```stx
@foreach(items as item)
  <component :key="item.id" :item="item" />
@endforeach
``` 