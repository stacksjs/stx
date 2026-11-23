# Security

This guide covers essential security practices and features in stx to help you build secure applications.

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

### Reactive templates without `unsafe-eval`

STX's default runtime compiles template expressions in the browser. Opt into
ahead-of-time compilation to run with a policy that forbids `unsafe-eval`:

```ts
// stx.config.ts
export default {
  csp: {
    enabled: true,
    precompile: true,
    useHashes: true,
    addMetaTag: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
    },
  },
}
```

`precompile` parses the finished template's bindings and emits ordinary JavaScript
functions for reads, handlers, model writes, scoped slots, cloned components and
deferred islands. It also covers the `x-data` bridge. The compiler runs on the
server/build machine; no parser ships to the browser. An invalid binding fails
rendering with a diagnostic. A binding absent from the compiled table cannot fall
back to runtime evaluation. Application code that explicitly uses `eval` or
`Function`, including third-party libraries, still needs replacing.

For **static sites**, `useHashes` hashes inline executable scripts and styles with
SHA-256. Both static builders refresh the policy after asset extraction and
fingerprinting, and write `_stx/csp-manifest.json`. Its `headerName` and `header`
are ready to configure on the static host. Every page authorizes the site's
finite union of script hashes, so the initial document's policy also permits SPA
destinations. The router preserves compiled script bytes during navigation.
Do not rewrite/minify inline code after this final pass without regenerating the
manifest with `finalizeStaticCsp(outDir, cspConfig)`.

The example deliberately permits runtime-generated styles. Adding style hashes
would cause browsers to ignore `unsafe-inline`, so STX retains that explicit
choice. With a stricter style policy it emits style hashes instead; dynamic
styles must then be authorized separately by the application. It never adds
`unsafe-inline` or `unsafe-eval` to the configured policy.

For **per-request SSR**, use `precompile: true` with `useNonce: true` instead of
`useHashes`; the two authorization modes are mutually exclusive. A page's hashes
alone cannot authorize arbitrary future SSR responses on an SPA navigation.
For a custom response pipeline, `collectCspHashes(html)` and
`hashedCspHeader(html, cspConfig)` compute policy data from its final bytes.
Report-only deployments must use the HTTP header; HTML meta cannot express a
report-only policy.

Only trusted application templates should enter compilation. HTML supplied at
runtime through `x-html` is data and cannot introduce new template expressions.

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

stx automatically escapes variables in templates:

```stx
<!-- Safe: Content is automatically escaped -->
<div>{{ userInput }}</div>

<!-- Raw HTML (use with caution) -->
<div>@html(trustedHtml)</div>
```

### Reactive bindings: `:text=` vs `:html=`

stx has two ways to bind dynamic text content to an element. They have very
different safety profiles:

| Directive | Behavior | Safe with user input? |
|---|---|---|
| `:text="expr"` | Sets `el.textContent` — HTML is escaped, no markup interpretation | ✅ Yes — always safe |
| `:html="expr"` | Sets `el.innerHTML` — markup and scripts execute | ❌ No — opt-in raw HTML |

`:html=` is stx's `v-html` / `dangerouslySetInnerHTML` equivalent. Only use it
when the bound value is content you fully control:

```stx
<!-- ✅ Safe: trusted server-rendered markdown -->
<article :html="post.bodyHtml"></article>

<!-- ✅ Safe: sanitizer output -->
<div :html="sanitize(userMarkdown).result"></div>

<!-- ❌ XSS vulnerability: comment.body might contain <script>… -->
<div :html="comment.body"></div>

<!-- ✅ Correct alternative: use :text= for unsanitized user input -->
<div :text="comment.body"></div>
```

If the value could ever flow from user input — comments, search results,
review text, third-party API responses, store fields that may eventually
hold user content — either route it through `@stacksjs/sanitizer`
upstream or switch to `:text=`. When in doubt, `:text=`.

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

### What crosses from `<script server>` to the browser

A `<script client>` block can read values declared in `<script server>` without
a fetch. stx does that by serialising the value into the page and declaring it
as a `var` ahead of your client code — so **anything that crosses ends up in the
HTML response body**, readable in view-source.

Only values your client code actually *references* cross. A name mentioned in a
comment, inside a string, or as somebody else's property does not:

```html
<script server>
const token = cookies.session          // never referenced below → not sent
const posts = await db.posts.all()     // referenced → serialised into the page
</script>

<script client>
  const list = state(posts)            // a real reference
  const who = useStore('session').token()  // a property, not this binding
</script>
```

**Prefix anything holding a credential with `__`.** That is the opt-out, and it
is checked in both places that assemble the bridge, so it holds regardless of
how the value is used:

```html
<script server>
const __apiKey = env.API_KEY                      // never crosses
const __rows = await db.projects.all()
const projects = __rows.map(({ ingest_key, ...p }) => p)  // safe projection
</script>
```

Treat the response body differently from a cookie. A token in a cookie is not
captured by a HAR export attached to a support ticket, "save page as", the disk
cache, a session-replay tool, or a screenshot of view-source — a token in the
body is captured by all of them.

stx warns at build time when it publishes a binding whose name looks like a
credential (`token`, `secret`, `apiKey`, `webhook`, …) or when a single value
exceeds 32KB. A warning means the value **is** in the page; rename it with `__`
and pass a projection instead.

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
