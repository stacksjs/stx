# Security

stx provides comprehensive security features to help you build secure applications by default. This page covers all security capabilities and best practices in the stx ecosystem.

## Built-in Security Features

### Cross-Site Scripting (XSS) Prevention

stx automatically escapes output by default:

```stx
<!-- Safe: automatically escaped -->
<div>{{ userInput }}</div>

<!-- Raw HTML: use with caution -->
<div>&#123;&#123;&#123; trustedHtml &#125;&#125;&#125;</div>
```

### CSRF Protection

Built-in CSRF token generation and validation:

```typescript
// Automatic CSRF protection
app.use(csrf({
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  }
}))
```

### Content Security Policy

Configure CSP headers:

```typescript
app.use(csp({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'", "'nonce-{random}'"],
    imgSrc: ["'self'", "data:", "https:"]
  }
}))
```

## Authentication & Authorization

### Authentication Middleware

```typescript
import { auth } from '@stacksjs/auth'

// Route protection
app.use('/dashboard', auth.requireAuth())

// Role-based access
app.use('/admin', auth.requireRole('admin'))
```

### Session Security

```typescript
// Secure session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  },
  rolling: true
}))
```

### JWT Security

```typescript
import { jwt } from '@stacksjs/auth'

// Secure JWT configuration
const jwtConfig = {
  algorithm: 'HS256',
  expiresIn: '15m',
  issuer: 'stx-app',
  audience: 'stx-users'
}

// Token validation
app.use(jwt.verify(jwtConfig))
```

## Input Validation & Sanitization

### Form Validation

```typescript
import { validate } from '@stacksjs/validation'

const userSchema = {
  email: 'email|required',
  password: 'string|min:8|required',
  name: 'string|max:100|required'
}

app.post('/users', validate(userSchema), (req, res) => {
  // Validated data is safe to use
  const { email, password, name } = req.validated
})
```

### SQL Injection Prevention

```typescript
// Parameterized queries (safe)
const user = await db.query(
  'SELECT * FROM users WHERE email = ?',
  [email]
)

// ORM usage (safe)
const user = await User.where('email', email).first()
```

### File Upload Security

```typescript
import { upload } from '@stacksjs/upload'

app.post('/upload', upload({
  allowedTypes: ['image/jpeg', 'image/png'],
  maxSize: 5 * 1024 * 1024, // 5MB
  sanitizeFilename: true,
  virusScan: true
}))
```

## Security Headers

### Comprehensive Header Setup

```typescript
app.use(helmet({
  // XSS Protection
  xssFilter: true,

  // Content Type Options
  noSniff: true,

  // Frame Options
  frameguard: { action: 'deny' },

  // HSTS
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },

  // Referrer Policy
  referrerPolicy: 'strict-origin-when-cross-origin'
}))
```

## Encryption & Hashing

### Password Hashing

```typescript
import { hash, verify } from '@stacksjs/crypto'

// Hash password
const hashedPassword = await hash.password(plainPassword, {
  algorithm: 'argon2id',
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4
})

// Verify password
const isValid = await verify.password(plainPassword, hashedPassword)
```

### Data Encryption

```typescript
import { encrypt, decrypt } from '@stacksjs/crypto'

// Encrypt sensitive data
const encrypted = await encrypt(sensitiveData, {
  algorithm: 'aes-256-gcm',
  key: process.env.ENCRYPTION_KEY
})

// Decrypt data
const decrypted = await decrypt(encrypted, {
  key: process.env.ENCRYPTION_KEY
})
```

## Rate Limiting

### Request Rate Limiting

```typescript
import { rateLimit } from '@stacksjs/security'

// Global rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
}))

// API-specific rate limiting
app.use('/api', rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10 // 10 requests per minute
}))
```

### Brute Force Protection

```typescript
import { bruteForce } from '@stacksjs/security'

app.post('/login', bruteForce.protect(), async (req, res) => {
  // Login logic with automatic brute force protection
})
```

## Security Monitoring

### Security Event Logging

```typescript
import { securityLogger } from '@stacksjs/logging'

// Log security events
securityLogger.warn('Failed login attempt', {
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  email: req.body.email
})

// Log successful authentication
securityLogger.info('User authenticated', {
  userId: user.id,
  ip: req.ip
})
```

### Intrusion Detection

```typescript
import { ids } from '@stacksjs/security'

// Configure intrusion detection
app.use(ids({
  enabled: true,
  rules: [
    'detect_sql_injection',
    'detect_xss_attempts',
    'detect_path_traversal'
  ],
  onDetection: (threat) => {
    securityLogger.alert('Security threat detected', threat)
  }
}))
```

## Security Testing

### Automated Security Scans

```bash
# Run security audit
bun audit

# Run SAST (Static Application Security Testing)
bun run security:scan

# Run dependency vulnerability check
bun run security:deps
```

### Penetration Testing

```typescript
// Security test suite
import { securityTest } from '@stacksjs/testing'

securityTest('XSS protection', () => {
  const maliciousInput = '<script>alert("xss")</script>'
  const result = render(template, { input: maliciousInput })
  expect(result).not.toContain('<script>')
})

securityTest('CSRF protection', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({ name: 'Test' })

  expect(response.status).toBe(403) // CSRF token missing
})
```

## Compliance & Standards

### OWASP Top 10 Protection

stx addresses the OWASP Top 10 security risks:

1. **Injection**: Parameterized queries and input validation
2. **Broken Authentication**: Secure session management
3. **Sensitive Data Exposure**: Built-in encryption utilities
4. **XML External Entities**: Safe XML parsing
5. **Broken Access Control**: Role-based authorization
6. **Security Misconfiguration**: Secure defaults
7. **Cross-Site Scripting**: Automatic output escaping
8. **Insecure Deserialization**: Safe serialization practices
9. **Known Vulnerabilities**: Automated dependency scanning
10. **Insufficient Logging**: Comprehensive security logging

### Data Protection Compliance

```typescript
// GDPR compliance helpers
import { gdpr } from '@stacksjs/compliance'

// Data anonymization
const anonymized = gdpr.anonymize(userData)

// Right to be forgotten
await gdpr.deleteUserData(userId)

// Data export
const exportData = gdpr.exportUserData(userId)
```

## Related Resources

- [Security Guide](/guide/security) - Comprehensive security guide
- [Component API](/api/component) - Component authentication patterns
- [Deployment Guide](/guide/deployment) - Secure deployment practices
- [Testing Guide](/guide/testing) - Security testing strategies
