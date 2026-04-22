# Code Patterns

Real-world patterns for building stx applications. These are the recommended approaches -- follow them consistently.

## Auth Flow Pattern

A shared auth store with token management, guarded pages, and authenticated fetch.

### Store: `stores/auth.ts`

```ts
defineStore('auth', () => {
  const user = state(null)
  const token = state(localStorage.getItem('auth_token') || '')
  const isAuthenticated = derived(() => !!token())

  function login(data: any, authToken: string) {
    user.set(data)
    token.set(authToken)
    localStorage.setItem('auth_token', authToken)
  }

  function logout() {
    user.set(null)
    token.set('')
    localStorage.removeItem('auth_token')
    navigate('/login', true)
  }

  async function authFetch(url: string, options: RequestInit = {}) {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token()}`,
      },
    })
  }

  return { user, token, isAuthenticated, login, logout, authFetch }
})
```

### Page: `pages/dashboard.stx`

```html
<script client>
  const auth = useStore('auth')
  const data = state(null)

  onMount(async () => {
    if (!auth.isAuthenticated()) return navigate('/login', true)
    data.set(await auth.authFetch('/api/dashboard').then(r => r.json()))
  })
</script>

<div :if="!data()">Loading dashboard...</div>
<div :if="data()">
  <h1 :text="`Welcome, ${data().name}`"></h1>
  <p :text="`Last login: ${data().lastLogin}`"></p>
</div>
```

### Page: `pages/login.stx`

```html
<script client>
  const auth = useStore('auth')
  const email = state('')
  const password = state('')
  const error = state('')
  const loading = state(false)

  async function handleLogin() {
    loading.set(true)
    error.set('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email(), password: password() }),
      })
      if (!res.ok) throw new Error('Invalid credentials')
      const { user, token } = await res.json()
      auth.login(user, token)
      navigate('/dashboard', true)
    } catch (e) {
      error.set(e.message)
    }
    loading.set(false)
  }
</script>

<form @submit.prevent="handleLogin()">
  <div :if="error()" class="text-red-500" :text="error()"></div>
  <input type="email" x-model="email" placeholder="Email" class="input" />
  <input type="password" x-model="password" placeholder="Password" class="input" />
  <button type="submit" :disabled="loading()">
    <span :if="loading()">Signing in...</span>
    <span :if="!loading()">Sign In</span>
  </button>
</form>
```

---

## Data Fetching with Loading State

The standard pattern for fetching data with loading, error, and empty states.

```html
<script client>
  const loading = state(true)
  const items = state([])
  const error = state('')

  onMount(async () => {
    try {
      const res = await fetch('/api/items')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      items.set(await res.json())
    } catch (e) {
      error.set(e.message)
    }
    loading.set(false)
  })
</script>

<div :if="loading()" class="flex items-center gap-2">
  <span class="animate-spin">...</span> Loading...
</div>

<div :if="error()" class="text-red-500 p-4 rounded bg-red-50">
  <p :text="error()"></p>
  <button @click="location.reload()">Retry</button>
</div>

<div :if="!loading() && !error() && items().length === 0" class="text-gray-500">
  No items found.
</div>

<div :for="item in items()" :key="item.id" class="p-4 border rounded">
  <h3 :text="item.title"></h3>
  <p :text="item.description"></p>
</div>
```

---

## Form with Validation

Client-side form handling with field-level validation and submission.

```html
<script client>
  const form = state({ name: '', email: '', message: '' })
  const errors = state({})
  const submitting = state(false)
  const submitted = state(false)

  function validate() {
    const e = {}
    const f = form()
    if (!f.name.trim()) e.name = 'Name is required'
    if (!f.email.includes('@')) e.email = 'Valid email is required'
    if (f.message.length < 10) e.message = 'Message must be at least 10 characters'
    errors.set(e)
    return Object.keys(e).length === 0
  }

  function updateField(field, value) {
    form.set({ ...form(), [field]: value })
  }

  async function handleSubmit() {
    if (!validate()) return
    submitting.set(true)
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form()),
      })
      submitted.set(true)
    } catch (e) {
      errors.set({ form: e.message })
    }
    submitting.set(false)
  }
</script>

<div :if="submitted()" class="p-4 bg-green-50 text-green-700 rounded">
  Thanks for your message!
</div>

<form :if="!submitted()" @submit.prevent="handleSubmit()">
  <div :if="errors().form" class="text-red-500" :text="errors().form"></div>

  <div class="space-y-4">
    <div>
      <label>Name</label>
      <input type="text" :value="form().name" @input="updateField('name', $event.target.value)" class="input" />
      <span :if="errors().name" class="text-red-500 text-sm" :text="errors().name"></span>
    </div>

    <div>
      <label>Email</label>
      <input type="email" :value="form().email" @input="updateField('email', $event.target.value)" class="input" />
      <span :if="errors().email" class="text-red-500 text-sm" :text="errors().email"></span>
    </div>

    <div>
      <label>Message</label>
      <textarea :value="form().message" @input="updateField('message', $event.target.value)" class="input"></textarea>
      <span :if="errors().message" class="text-red-500 text-sm" :text="errors().message"></span>
    </div>

    <button type="submit" :disabled="submitting()" class="btn btn-primary">
      <span :if="submitting()">Sending...</span>
      <span :if="!submitting()">Send Message</span>
    </button>
  </div>
</form>
```

---

## Composable Extraction

When a component grows past ~80 lines of script, extract logic into composables.

### Before: Everything inline (bad)

```html
<script client>
  const items = state([])
  const loading = state(true)
  const error = state('')
  const search = state('')
  const sortBy = state('name')
  const sortDir = state('asc')
  const page = state(1)
  const perPage = 20

  const filtered = derived(() => {
    let result = items()
    if (search()) {
      result = result.filter(i => i.name.toLowerCase().includes(search().toLowerCase()))
    }
    result.sort((a, b) => {
      const dir = sortDir() === 'asc' ? 1 : -1
      return a[sortBy()] > b[sortBy()] ? dir : -dir
    })
    return result
  })

  const paginated = derived(() => {
    const start = (page() - 1) * perPage
    return filtered().slice(start, start + perPage)
  })

  const totalPages = derived(() => Math.ceil(filtered().length / perPage))

  onMount(async () => {
    try {
      items.set(await fetch('/api/items').then(r => r.json()))
    } catch (e) { error.set(e.message) }
    loading.set(false)
  })

  // ... 100 more lines
</script>
```

### After: Composable in `functions/`

**`functions/useFilteredList.ts`**

```ts
export function useFilteredList(fetchUrl: string, perPage = 20) {
  const items = state([])
  const loading = state(true)
  const error = state('')
  const search = state('')
  const sortBy = state('name')
  const sortDir = state('asc')
  const page = state(1)

  const filtered = derived(() => {
    let result = items()
    if (search()) {
      result = result.filter(i =>
        i.name.toLowerCase().includes(search().toLowerCase())
      )
    }
    result.sort((a, b) => {
      const dir = sortDir() === 'asc' ? 1 : -1
      return a[sortBy()] > b[sortBy()] ? dir : -dir
    })
    return result
  })

  const paginated = derived(() => {
    const start = (page() - 1) * perPage
    return filtered().slice(start, start + perPage)
  })

  const totalPages = derived(() => Math.ceil(filtered().length / perPage))

  async function load() {
    try {
      items.set(await fetch(fetchUrl).then(r => r.json()))
    } catch (e) {
      error.set(e.message)
    }
    loading.set(false)
  }

  return { items, loading, error, search, sortBy, sortDir, page, filtered, paginated, totalPages, load }
}
```

**Page (clean):**

```html
<script client>
  import { useFilteredList } from '@/functions/useFilteredList'

  const { loading, error, search, paginated, totalPages, page, load } = useFilteredList('/api/items')

  onMount(() => load())
</script>

<input type="text" x-model="search" placeholder="Search..." class="input" />
<div :if="loading()">Loading...</div>
<div :for="item in paginated()" :key="item.id">
  <span :text="item.name"></span>
</div>
<div class="flex gap-2">
  <button @click="page.set(page() - 1)" :disabled="page() <= 1">Prev</button>
  <span :text="`${page()} / ${totalPages()}`"></span>
  <button @click="page.set(page() + 1)" :disabled="page() >= totalPages()">Next</button>
</div>
```

---

## Responsive Images

Use `<StxImage>` for optimized image rendering with responsive sizes.

```html
<StxImage
  src="/images/hero.jpg"
  alt="Hero banner"
  width="1200"
  height="600"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 1200px"
  loading="lazy"
  class="w-full rounded-lg"
/>
```

For a gallery with multiple images:

```html
<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
  <div :for="photo in photos()" :key="photo.id">
    <StxImage
      :src="photo.url"
      :alt="photo.title"
      width="400"
      height="300"
      loading="lazy"
      class="rounded shadow"
    />
  </div>
</div>
```

---

## Middleware Guard

Protect routes with middleware that runs before page rendering.

### `middleware/auth.ts`

```ts
export default function authMiddleware({ request, redirect }) {
  const token = request.headers.get('cookie')?.match(/auth_token=([^;]+)/)?.[1]
  if (!token) {
    return redirect('/login')
  }
}
```

### Protected page: `pages/settings.stx`

```html
<script server>
  export const meta = {
    middleware: ['auth'],
  }
</script>

<script client>
  const auth = useStore('auth')
  const settings = state(null)

  onMount(async () => {
    settings.set(await auth.authFetch('/api/settings').then(r => r.json()))
  })
</script>

<h1>Account Settings</h1>
<div :if="settings()">
  <!-- settings form -->
</div>
```

---

## SPA Navigation with Layout Transitions

Use `<StxLink>` for SPA navigation. The router handles layout transitions automatically -- even between pages with different layouts, no page reload occurs.

### Layout: `layouts/app.stx`

```html
<!DOCTYPE html>
<html>
<head><title>My App</title></head>
<body class="bg-gray-50">
  <nav class="bg-white shadow p-4 flex gap-4">
    <StxLink to="/" activeClass="text-blue-600 font-bold">Home</StxLink>
    <StxLink to="/dashboard" activeClass="text-blue-600 font-bold">Dashboard</StxLink>
    <StxLink to="/login" activeClass="text-blue-600 font-bold">Login</StxLink>
  </nav>
  <main class="max-w-4xl mx-auto p-8">
    @slot
  </main>
</body>
</html>
```

### Layout: `layouts/auth.stx`

```html
<!DOCTYPE html>
<html>
<head><title>Sign In</title></head>
<body class="bg-gray-900 flex items-center justify-center min-h-screen">
  <div class="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
    @slot
  </div>
</body>
</html>
```

### Navigating between layouts

```html
<!-- From a page using layouts/app.stx -->
<StxLink to="/login">Sign In</StxLink>

<!-- From a page using layouts/auth.stx -->
<StxLink to="/dashboard">Back to Dashboard</StxLink>
```

The router detects that these pages use different layout groups (`app` vs `auth`) and performs a full body swap instead of a fragment swap. Both transitions happen client-side -- no page reload.

**Key distinction**: `<StxLink>` does SPA navigation. A plain `<a href>` always triggers a full page reload. Use `<StxLink>` for in-app links, `<a href>` for external URLs.
