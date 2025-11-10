# Storage Utilities

Type-safe utilities for localStorage and sessionStorage with expiration support.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

### Basic Usage

```typescript
import { localStorage, sessionStorage } from '@stacksjs/components'

// Set a value
localStorage.set('user', { name: 'John', age: 30 })

// Get a value
const user = localStorage.get('user')
console.log(user) // { name: 'John', age: 30 }

// Remove a value
localStorage.remove('user')

// Clear all
localStorage.clear()
```

### With Expiration

```typescript
// Expire after 1 hour (3600000 ms)
localStorage.set('token', 'abc123', { expire: 3600000 })

// After 1 hour, get() returns null
const token = localStorage.get('token') // null if expired
```

### With Namespace

```typescript
import { createStorage } from '@stacksjs/components'

const userStorage = createStorage('local', 'user')
const appStorage = createStorage('local', 'app')

userStorage.set('preferences', { theme: 'dark' })
appStorage.set('preferences', { language: 'en' })

// These are stored as 'user:preferences' and 'app:preferences'
```

### Session Storage

```typescript
import { sessionStorage } from '@stacksjs/components'

// Same API as localStorage
sessionStorage.set('tempData', { value: 123 })
const data = sessionStorage.get('tempData')
```

## API

### Storage Methods

#### `set(key: string, value: any, options?: StorageOptions): void`
Store a value with optional expiration.

#### `get<T>(key: string): T | null`
Retrieve a value. Returns null if expired or not found.

#### `remove(key: string): void`
Remove a specific key.

#### `clear(): void`
Clear all items (or all namespaced items).

#### `has(key: string): boolean`
Check if a key exists and hasn't expired.

#### `keys(): string[]`
Get all keys (without namespace prefix).

#### `size(): number`
Get the number of stored items.

## StorageOptions

```typescript
interface StorageOptions {
  expire?: number // Expiration in milliseconds
  namespace?: string // Prefix for keys (in createStorage)
}
```

## Features

- **Type-safe** - Full TypeScript support
- **Expiration** - Automatic expiration handling
- **Namespacing** - Prevent key collisions
- **Error handling** - Graceful error handling
- **JSON serialization** - Automatic serialization/deserialization
- **Both storages** - localStorage and sessionStorage support

## Examples

### User Authentication Token

```typescript
import { localStorage } from '@stacksjs/components'

// Store token with 24-hour expiration
function login(token: string) {
  localStorage.set('auth_token', token, {
    expire: 24 * 60 * 60 * 1000, // 24 hours
  })
}

// Get token (returns null if expired)
function getToken(): string | null {
  return localStorage.get('auth_token')
}

// Check if logged in
function isLoggedIn(): boolean {
  return localStorage.has('auth_token')
}

// Logout
function logout() {
  localStorage.remove('auth_token')
}
```

### User Preferences

```typescript
import { createStorage } from '@stacksjs/components'

const prefs = createStorage('local', 'preferences')

interface UserPreferences {
  theme: 'light' | 'dark'
  language: string
  notifications: boolean
}

// Save preferences
function savePreferences(preferences: UserPreferences) {
  prefs.set('user', preferences)
}

// Load preferences with defaults
function loadPreferences(): UserPreferences {
  const saved = prefs.get<UserPreferences>('user')
  return saved || {
    theme: 'light',
    language: 'en',
    notifications: true,
  }
}
```

### Shopping Cart

```typescript
import { localStorage } from '@stacksjs/components'

interface CartItem {
  id: string
  name: string
  quantity: number
  price: number
}

function addToCart(item: CartItem) {
  const cart = localStorage.get<CartItem[]>('cart') || []
  cart.push(item)
  localStorage.set('cart', cart)
}

function getCart(): CartItem[] {
  return localStorage.get<CartItem[]>('cart') || []
}

function clearCart() {
  localStorage.remove('cart')
}
```
