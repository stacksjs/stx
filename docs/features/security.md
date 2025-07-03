# Security

This guide covers essential security practices and features in STX to help you build secure applications.

## Security Headers

### Basic Security Headers

Configure security headers using middleware:

```ts
import helmet from 'helmet'

// Basic security headers
app.use(helmet())

// Custom security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  next()
})
```

### Content Security Policy

Set up CSP to prevent XSS and other injection attacks:

```ts
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://api.example.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"]
  }
}))
```

## CSRF Protection

### Token-based Protection

Implement CSRF protection:

```ts
import { csrf } from '@stacksjs/stx/security'

// Generate CSRF token
app.use(csrf())

// Include token in forms
@component('Form')
  <form method="POST">
    @csrf
    <!-- Form fields -->
  </form>
@endcomponent
```

### Custom CSRF Handling

Create custom CSRF middleware:

```ts
function validateCsrf(token: string): boolean {
  // Implement token validation
  return token === session.csrfToken
}

app.use((req, res, next) => {
  if (req.method === 'POST') {
    const token = req.headers['x-csrf-token']
    if (!validateCsrf(token)) {
      return res.status(403).send('Invalid CSRF token')
    }
  }
  next()
})
```

## XSS Prevention

### Template Security

STX automatically escapes variables in templates:

```stx
<!-- Safe: Content is automatically escaped -->
<div>{{ userInput }}</div>

<!-- Raw HTML (use with caution) -->
<div>@html(trustedHtml)</div>
```

### Content Sanitization

Sanitize user input:

```ts
import { sanitize } from '@stacksjs/stx/security'

function processUserInput(input: string): string {
  return sanitize(input, {
    allowedTags: ['b', 'i', 'em', 'strong'],
    allowedAttributes: {}
  })
}
```

## Authentication

### Basic Authentication

Implement user authentication:

```ts
import { auth } from '@stacksjs/stx/auth'

// Setup authentication
auth.setup({
  providers: ['local', 'oauth'],
  session: {
    driver: 'redis',
    lifetime: '24h'
  }
})

// Protect routes
app.use(auth.middleware())

// In components
@component('ProtectedContent')
  @if(auth.check())
    <div>Protected content</div>
  @else
    <login-form />
  @endif
@endcomponent
```

### OAuth Integration

Set up OAuth authentication:

```ts
auth.setupOAuth({
  providers: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackUrl: '/auth/github/callback'
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: '/auth/google/callback'
    }
  }
})
```

## Authorization

### Role-based Access

Implement role-based authorization:

```ts
@component('AdminPanel')
  @ts
  interface User {
    id: number
    roles: string[]
  }
  @endts

  @if(can('access', 'admin-panel'))
    <div class="admin-panel">
      <!-- Admin content -->
    </div>
  @else
    <access-denied />
  @endif
@endcomponent
```

### Policy-based Authorization

Create authorization policies:

```ts
// policies/PostPolicy.ts
export class PostPolicy {
  static create(user: User): boolean {
    return user.roles.includes('author')
  }

  static update(user: User, post: Post): boolean {
    return user.id === post.authorId || user.roles.includes('editor')
  }
}

// Usage in components
@component('PostEditor')
  @if(can('update', post))
    <edit-form :post="post" />
  @endif
@endcomponent
```

## Data Security

### Input Validation

Validate user input:

```ts
import { validate } from '@stacksjs/stx/validation'

const schema = {
  username: 'required|string|min:3|max:20',
  email: 'required|email',
  password: 'required|string|min:8|regex:/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/'
}

function validateInput(data: any) {
  const result = validate(data, schema)
  if (result.fails()) {
    throw new ValidationError(result.errors())
  }
}
```

### Data Encryption

Encrypt sensitive data:

```ts
import { encrypt, decrypt } from '@stacksjs/stx/security'

// Encrypt data
const encrypted = await encrypt(sensitiveData, {
  algorithm: 'aes-256-gcm',
  key: process.env.ENCRYPTION_KEY
})

// Decrypt data
const decrypted = await decrypt(encrypted, {
  key: process.env.ENCRYPTION_KEY
})
```

## Security Best Practices

1. **Input Validation**
   - Validate all user input
   - Use type checking
   - Sanitize HTML content
   - Prevent SQL injection

2. **Authentication**
   - Use secure password hashing
   - Implement MFA where possible
   - Set secure session settings
   - Use HTTPS only cookies

3. **Authorization**
   - Implement proper access control
   - Use principle of least privilege
   - Validate permissions server-side
   - Audit access logs

4. **Data Protection**
   - Encrypt sensitive data
   - Use secure communication
   - Implement proper backups
   - Regular security audits

## Next Steps

- Learn about [Testing](/features/testing)
- Explore [Deployment](/features/deployment)
- Check out [Performance](/features/performance)
- Review [Monitoring](/features/monitoring) 