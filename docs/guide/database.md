# Database Integration

stx provides Laravel Eloquent-like database integration, allowing you to query databases directly from your templates. This guide covers configuration, query building, models, and template directives.

## Quick Start

```typescript
import { configureDatabase, query, defineModel } from 'stx'

// Configure database connection
configureDatabase({
  default: 'sqlite',
  connections: {
    sqlite: { driver: 'sqlite', database: './database.db' }
  }
})

// Query data
const users = await query('users').where('active', true).get()

// Or use models
const User = defineModel('User', { table: 'users' })
const user = await User.find(1)
```

## Configuration

### Basic Setup

Configure your database connections in your application startup:

```typescript
import { configureDatabase } from 'stx'

configureDatabase({
  // Default connection to use
  default: 'sqlite',

  // Named connections
  connections: {
    sqlite: {
      driver: 'sqlite',
      database: './data/app.db'
    },
    postgres: {
      driver: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'myapp',
      username: 'user',
      password: 'secret'
    },
    mysql: {
      driver: 'mysql',
      host: 'localhost',
      port: 3306,
      database: 'myapp',
      username: 'root',
      password: 'secret',
      poolSize: 10
    }
  },

  // Enable query logging (useful for debugging)
  logging: true,

  // Cache query results (seconds, 0 = disabled)
  cacheTTL: 60,

  // Maximum cached queries
  maxCacheSize: 1000
})
```

### Supported Drivers

| Driver | Package Required | Notes |
|--------|-----------------|-------|
| `sqlite` | None (Bun built-in) | Uses Bun's native SQLite |
| `postgres` | `pg` | Install with `bun add pg` |
| `mysql` | `mysql2` | Install with `bun add mysql2` |

## Query Builder

The query builder provides a fluent interface for constructing SQL queries.

### Basic Queries

```typescript
import { query } from 'stx'

// Select all columns
const users = await query('users').get()

// Select specific columns
const names = await query('users').select('id', 'name', 'email').get()

// Get first result
const user = await query('users').where('id', 1).first()

// Check if records exist
const hasAdmins = await query('users').where('role', 'admin').exists()
```

### Where Clauses

```typescript
// Simple equality
query('users').where('active', true)

// With operator
query('users').where('age', '>=', 18)

// Multiple conditions (AND)
query('users')
  .where('active', true)
  .where('role', 'admin')

// OR conditions
query('users')
  .where('role', 'admin')
  .orWhere('role', 'superadmin')

// WHERE IN
query('users').whereIn('status', ['active', 'pending'])

// WHERE NOT IN
query('users').whereNotIn('role', ['banned', 'suspended'])

// WHERE NULL / NOT NULL
query('users').whereNull('deleted_at')
query('users').whereNotNull('email_verified_at')

// WHERE BETWEEN
query('users').whereBetween('age', 18, 65)

// WHERE LIKE
query('users').whereLike('email', '%@gmail.com')
```

### Ordering and Limiting

```typescript
// Order by column
query('posts').orderBy('created_at', 'desc')

// Multiple order clauses
query('posts')
  .orderBy('featured', 'desc')
  .orderBy('created_at', 'desc')

// Limit results
query('posts').limit(10)

// Offset (skip)
query('posts').limit(10).offset(20)

// Pagination helper
query('posts').forPage(3, 15)  // Page 3, 15 per page
```

### Joins

```typescript
// Inner join
query('posts')
  .join('users', 'posts.author_id', '=', 'users.id')
  .select('posts.*', 'users.name as author_name')

// Left join
query('users')
  .leftJoin('profiles', 'users.id', '=', 'profiles.user_id')

// Right join
query('orders')
  .rightJoin('products', 'orders.product_id', '=', 'products.id')
```

### Aggregates

```typescript
// Count
const totalUsers = await query('users').count()

// Sum
const totalRevenue = await query('orders').sum('amount')

// Average
const avgAge = await query('users').avg('age')

// Min/Max
const oldestUser = await query('users').max('age')
const youngestUser = await query('users').min('age')
```

### Grouping

```typescript
// Group by with aggregates
const ordersByStatus = await query('orders')
  .select('status', raw('COUNT(*) as count'), raw('SUM(amount) as total'))
  .groupBy('status')
  .get()
```

### Insert, Update, Delete

```typescript
// Insert single record
const id = await query('users').insert({
  name: 'John Doe',
  email: 'john@example.com',
  active: true
})

// Insert multiple records
await query('users').insertAll([
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' }
])

// Update records
await query('users')
  .where('id', 1)
  .update({ name: 'Jane Doe' })

// Increment/Decrement
await query('posts').where('id', 1).increment('views')
await query('products').where('id', 1).decrement('stock', 5)

// Delete records
await query('users').where('id', 1).delete()

// Truncate table
await query('logs').truncate()
```

### Raw Expressions

```typescript
import { raw } from 'stx'

// Use raw SQL in select
query('users')
  .select('name', raw('DATE(created_at) as join_date'))
  .get()

// Raw in aggregates
query('orders')
  .select(raw('YEAR(created_at) as year'), raw('SUM(amount) as total'))
  .groupBy(raw('YEAR(created_at)'))
  .get()
```

## Models

Models provide an object-oriented interface for database tables.

### Defining Models

```typescript
import { defineModel } from 'stx'

const User = defineModel('User', {
  // Table name
  table: 'users',

  // Primary key (default: 'id')
  primaryKey: 'id',

  // Columns that can be mass-assigned
  fillable: ['name', 'email', 'password'],

  // Columns hidden from serialization
  hidden: ['password', 'remember_token'],

  // Auto-manage timestamps
  timestamps: true,  // Uses created_at, updated_at
  // Or customize:
  // timestamps: { createdAt: 'created_date', updatedAt: 'modified_date' }

  // Soft deletes
  softDeletes: true,  // Uses deleted_at
  // Or customize: softDeletes: 'removed_at'

  // Default values
  defaults: {
    role: 'user',
    active: true
  },

  // Type casting
  casts: {
    created_at: 'date',
    settings: 'json',
    active: 'boolean'
  },

  // Relationships
  relationships: {
    posts: {
      type: 'hasMany',
      model: 'Post',
      foreignKey: 'user_id'
    },
    profile: {
      type: 'hasOne',
      model: 'Profile',
      foreignKey: 'user_id'
    },
    roles: {
      type: 'belongsToMany',
      model: 'Role',
      pivotTable: 'user_roles'
    }
  }
})
```

### Using Models

```typescript
// Find by primary key
const user = await User.find(1)

// Find or throw error
const user = await User.findOrFail(1)

// Get all records
const users = await User.all()

// Create new record
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com'
})

// Query with model
const admins = await User.where('role', 'admin').get()

// Count
const userCount = await User.count()

// Delete by ID(s)
await User.destroy(1)
await User.destroy([1, 2, 3])
```

### Model Instances

```typescript
const user = await User.find(1)

// Access attributes
console.log(user.get('name'))
console.log(user.name)  // Also works via proxy

// Modify attributes
user.set('name', 'Jane Doe')
user.name = 'Jane Doe'  // Also works

// Save changes
await user.save()

// Delete record
await user.delete()

// Reload from database
await user.refresh()

// Check if modified
if (user.isDirty()) {
  await user.save()
}

// Serialize to JSON (respects hidden fields)
const json = user.toJSON()
```

### Relationships

```typescript
// Define related models
const Post = defineModel('Post', {
  table: 'posts',
  relationships: {
    author: {
      type: 'belongsTo',
      model: 'User',
      foreignKey: 'user_id'
    }
  }
})

const User = defineModel('User', {
  table: 'users',
  relationships: {
    posts: {
      type: 'hasMany',
      model: 'Post',
      foreignKey: 'user_id'
    }
  }
})

// Load relationships
const user = await User.find(1)
const posts = await user.posts()

const post = await Post.find(1)
const author = await post.author()
```

## Template Directives

Use database queries directly in your templates.

### @db Directive

Query tables directly:

```stx
<!-- Basic query -->
@db('users')->where('active', true)->get()

@foreach($users as $user)
  <div class="user-card">
    <h3>{{ $user.name }}</h3>
    <p>{{ $user.email }}</p>
  </div>
@endforeach

<!-- With ordering and limit -->
@db('posts')->orderBy('created_at', 'desc')->limit(5)->get()

<div class="recent-posts">
  @foreach($posts as $post)
    <article>
      <h2>{{ $post.title }}</h2>
      <p>{{ $post.excerpt }}</p>
    </article>
  @endforeach
</div>

<!-- Aggregate queries -->
@db('users')->where('role', 'subscriber')->count()
<p>Total subscribers: {{ $users }}</p>
```

### @model Directive

Use models in templates:

```stx
<!-- Find by ID -->
@model('User')->find(1)

<div class="profile">
  <h1>{{ $user.name }}</h1>
  <p>Member since {{ $user.created_at }}</p>
</div>

<!-- Query with model -->
@model('Post')->where('featured', true)->orderBy('created_at', 'desc')->limit(3)->get()

<section class="featured-posts">
  @foreach($post as $item)
    <article>{{ $item.title }}</article>
  @endforeach
</section>
```

### @query Directive

Execute raw SQL:

```stx
@query('SELECT COUNT(*) as total FROM users WHERE role = ?', ['admin']) as $stats

<p>Total admins: {{ $stats[0].total }}</p>

@query('SELECT u.name, COUNT(p.id) as post_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.user_id
        GROUP BY u.id
        ORDER BY post_count DESC
        LIMIT 5') as $topAuthors

<h2>Top Authors</h2>
<ul>
  @foreach($topAuthors as $author)
    <li>{{ $author.name }} ({{ $author.post_count }} posts)</li>
  @endforeach
</ul>
```

## Transactions

Wrap multiple operations in a transaction:

```typescript
import { transaction } from 'stx'

await transaction(async () => {
  // All operations in this callback are atomic
  const userId = await query('users').insert({
    name: 'John',
    email: 'john@example.com'
  })

  await query('profiles').insert({
    user_id: userId,
    bio: 'Hello world'
  })

  await query('settings').insert({
    user_id: userId,
    theme: 'dark'
  })
})
// If any operation fails, all are rolled back
```

## Schema Builder

Create and modify database tables:

```typescript
import { schema } from 'stx'

// Create a table
await schema().create('users', (table) => {
  table.id()                          // Auto-increment primary key
  table.string('name')                // VARCHAR(255)
  table.string('email', 100)          // VARCHAR(100)
  table.text('bio')                   // TEXT
  table.integer('age')                // INTEGER
  table.boolean('active')             // BOOLEAN
  table.datetime('email_verified_at') // DATETIME
  table.json('settings')              // JSON (TEXT in SQLite)
  table.timestamps()                  // created_at, updated_at
  table.softDeletes()                 // deleted_at

  // Indexes
  table.index('email')
  table.unique(['username'])
})

// Drop a table
await schema().drop('users')

// Rename a table
await schema().rename('users', 'members')

// Check if table exists
if (await schema().hasTable('users')) {
  // ...
}
```

## Caching

Query results can be cached automatically:

```typescript
// Enable caching in config
configureDatabase({
  cacheTTL: 60,      // Cache for 60 seconds
  maxCacheSize: 1000 // Maximum cached queries
})

// Clear cache manually
import { clearQueryCache, getQueryCacheStats } from 'stx'

clearQueryCache()

const stats = getQueryCacheStats()
console.log(`Cached queries: ${stats.size}`)
```

## Query Logging

Debug your queries:

```typescript
import { enableQueryLogging, getQueryLog, clearQueryLog } from 'stx'

// Enable logging
enableQueryLogging(true)

// Run some queries
await query('users').get()
await query('posts').where('published', true).get()

// Get log
const log = getQueryLog()
log.forEach(entry => {
  console.log(`${entry.sql} (${entry.duration}ms)`)
})

// Clear log
clearQueryLog()
```

## Error Handling

```typescript
import { DatabaseError } from 'stx'

try {
  await query('users').insert({ invalid_column: 'value' })
} catch (error) {
  if (error instanceof DatabaseError) {
    console.error('Query:', error.sql)
    console.error('Bindings:', error.bindings)
    console.error('Message:', error.message)
  }
}
```

## Best Practices

1. **Use Models for Business Logic**: Define models for entities you work with frequently.

2. **Use Query Builder for Complex Queries**: The query builder is more flexible for complex joins and aggregates.

3. **Enable Caching in Production**: Reduce database load with query caching.

4. **Use Transactions for Multi-Step Operations**: Ensure data consistency.

5. **Log Queries in Development**: Identify slow queries early.

6. **Use Prepared Statements**: The query builder uses parameterized queries automatically, preventing SQL injection.

```typescript
// Safe - uses prepared statements
query('users').where('email', userInput).first()

// Also safe
query('users').whereIn('id', userInputArray).get()
```

## Connection Management

```typescript
import { getAdapter, registerAdapter } from 'stx'

// Get adapter for a connection
const adapter = getAdapter('sqlite')

// Check connection status
if (!adapter.isConnected()) {
  await adapter.connect()
}

// Register custom adapter
registerAdapter('custom', myCustomAdapter)
```
