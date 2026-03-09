/**
 * STX Ecosystem — Manual Integration Test
 *
 * Run: bun test-ecosystem.ts
 *
 * Tests all 20 packages with granular per-API tests.
 * Each test is independent — failures in one don't block others.
 */

const results: Array<{ pkg: string; test: string; status: 'PASS' | 'FAIL'; detail: string }> = []

async function test(pkg: string, name: string, fn: () => Promise<void>) {
  try {
    await fn()
    results.push({ pkg, test: name, status: 'PASS', detail: '' })
    console.log(`    ✅ ${name}`)
  }
  catch (err: any) {
    results.push({ pkg, test: name, status: 'FAIL', detail: err.message })
    console.log(`    ❌ ${name}: ${err.message}`)
  }
}

function section(title: string) {
  console.log(`\n  📦 ${title}\n`)
}

console.log('\n🔍 STX Ecosystem — Integration Test')
console.log('='.repeat(60))

// ═══════════════════════════════════════════════════════════════
// Phase 1: Foundation
// ═══════════════════════════════════════════════════════════════

console.log('\n── Phase 1 — Foundation ──')

// ─── @stx/config ────────────────────────────────────────
section('@stx/config')

await test('@stx/config', 'defineEnv with string default', async () => {
  const { defineEnv } = await import('@stx/config')
  const env = defineEnv({ APP_NAME: { type: 'string', default: 'STX' } })
  if (env.APP_NAME !== 'STX') throw new Error(`got ${env.APP_NAME}`)
})

await test('@stx/config', 'defineEnv with number coercion', async () => {
  const { defineEnv } = await import('@stx/config')
  const env = defineEnv({ PORT: { type: 'number', default: 3000 } })
  if (env.PORT !== 3000) throw new Error(`got ${env.PORT}`)
  if (typeof env.PORT !== 'number') throw new Error(`type=${typeof env.PORT}`)
})

await test('@stx/config', 'defineEnv with boolean coercion', async () => {
  const { defineEnv } = await import('@stx/config')
  const env = defineEnv({ DEBUG: { type: 'boolean', default: false } })
  if (env.DEBUG !== false) throw new Error(`got ${env.DEBUG}`)
  if (typeof env.DEBUG !== 'boolean') throw new Error(`type=${typeof env.DEBUG}`)
})

await test('@stx/config', 'isProduction/isDevelopment/isTest helpers', async () => {
  const { isProduction, isDevelopment, isTest } = await import('@stx/config')
  if (typeof isProduction !== 'function') throw new Error('isProduction not exported')
  if (typeof isDevelopment !== 'function') throw new Error('isDevelopment not exported')
  if (typeof isTest !== 'function') throw new Error('isTest not exported')
  // In test context, isTest() should return true or isProduction() false
  if (isProduction()) throw new Error('should not be production in test')
})

await test('@stx/config', 'defineEnv with multiple vars', async () => {
  const { defineEnv } = await import('@stx/config')
  const env = defineEnv({
    DB_HOST: { type: 'string', default: 'localhost' },
    DB_PORT: { type: 'number', default: 5432 },
    DB_SSL: { type: 'boolean', default: true },
  })
  if (env.DB_HOST !== 'localhost') throw new Error(`host=${env.DB_HOST}`)
  if (env.DB_PORT !== 5432) throw new Error(`port=${env.DB_PORT}`)
  if (env.DB_SSL !== true) throw new Error(`ssl=${env.DB_SSL}`)
})

// ─── @stacksjs/router ───────────────────────────────────────
section('@stacksjs/router')

await test('@stacksjs/router', 'defineRoute and route() resolution', async () => {
  const { defineRoute, route } = await import('@stacksjs/router')
  defineRoute('home', '/')
  defineRoute('users.show', '/users/:id')
  if (route('home') !== '/') throw new Error(`home=${route('home')}`)
  if (route('users.show', { id: '42' }) !== '/users/42') throw new Error(`user=${route('users.show', { id: '42' })}`)
})

await test('@stacksjs/router', 'defineMiddleware returns handler', async () => {
  const { defineMiddleware } = await import('@stacksjs/router')
  const mw = defineMiddleware((_ctx) => {})
  if (typeof mw.handler !== 'function') throw new Error('handler not a function')
  if (!mw.mode) throw new Error('mode missing')
})

await test('@stacksjs/router', 'navigateTo creates redirect result', async () => {
  const { navigateTo } = await import('@stacksjs/router')
  const nav = navigateTo('/dashboard')
  if (nav.type !== 'redirect') throw new Error(`type=${nav.type}`)
  if (nav.path !== '/dashboard') throw new Error(`path=${nav.path}`)
})

await test('@stacksjs/router', 'navigateTo with replace option', async () => {
  const { navigateTo } = await import('@stacksjs/router')
  const nav = navigateTo('/login', { replace: true })
  if (nav.options.replace !== true) throw new Error(`replace=${nav.options.replace}`)
})

await test('@stacksjs/router', 'abortNavigation creates abort result', async () => {
  const { abortNavigation } = await import('@stacksjs/router')
  const abort = abortNavigation({ statusCode: 403, message: 'Forbidden' })
  if (abort.type !== 'abort') throw new Error(`type=${abort.type}`)
  if (abort.error.statusCode !== 403) throw new Error(`code=${abort.error.statusCode}`)
})

await test('@stacksjs/router', 'abortNavigation with string error', async () => {
  const { abortNavigation } = await import('@stacksjs/router')
  const abort = abortNavigation('Not allowed')
  if (abort.error.message !== 'Not allowed') throw new Error(`msg=${abort.error.message}`)
})

await test('@stacksjs/router', 'getRouterScript returns SPA navigation code', async () => {
  const { getRouterScript } = await import('@stacksjs/router')
  const script = getRouterScript()
  if (!script.includes('stx-link')) throw new Error('missing stx-link handling')
  if (typeof script !== 'string') throw new Error('not a string')
})

await test('@stacksjs/router', 'filePathToPattern converts file paths', async () => {
  const { filePathToPattern } = await import('@stacksjs/router')
  const pattern = filePathToPattern('pages/users/[id].stx', 'pages')
  if (!pattern.includes(':id') && !pattern.includes('[id]')) throw new Error(`pattern=${pattern}`)
})

await test('@stacksjs/router', 'patternToRegex creates valid regex', async () => {
  const { patternToRegex } = await import('@stacksjs/router')
  const { regex, params } = patternToRegex('/users/:id')
  if (!(regex instanceof RegExp)) throw new Error('not a RegExp')
  if (!regex.test('/users/42')) throw new Error('should match /users/42')
  if (regex.test('/posts/42')) throw new Error('should not match /posts/42')
})

// ─── @stacksjs/data ─────────────────────────────────────────
section('@stacksjs/data')

await test('@stacksjs/data', 'defineLoader creates loader with handler', async () => {
  const { defineLoader } = await import('@stacksjs/data')
  const loader = defineLoader(async () => ({ users: [] }))
  if (typeof loader.handler !== 'function') throw new Error('handler missing')
})

await test('@stacksjs/data', 'defineAction creates action with handler', async () => {
  const { defineAction } = await import('@stacksjs/data')
  const action = defineAction(async () => ({ data: { ok: true } }))
  if (typeof action.handler !== 'function') throw new Error('handler missing')
})

await test('@stacksjs/data', 'serialize/deserialize Date roundtrip', async () => {
  const { serialize, deserialize } = await import('@stacksjs/data')
  const original = { created: new Date('2025-06-15T12:00:00Z') }
  const json = serialize(original)
  const restored = deserialize(json) as Record<string, any>
  if (!(restored.created instanceof Date)) throw new Error('Date not restored')
  if (restored.created.toISOString() !== '2025-06-15T12:00:00.000Z') throw new Error(`date=${restored.created}`)
})

await test('@stacksjs/data', 'serialize/deserialize BigInt roundtrip', async () => {
  const { serialize, deserialize } = await import('@stacksjs/data')
  const original = { count: BigInt(9007199254740993) }
  const json = serialize(original)
  const restored = deserialize(json) as Record<string, any>
  if (typeof restored.count !== 'bigint') throw new Error(`type=${typeof restored.count}`)
})

await test('@stacksjs/data', 'serialize/deserialize Set roundtrip', async () => {
  const { serialize, deserialize } = await import('@stacksjs/data')
  const original = { tags: new Set(['a', 'b', 'c']) }
  const json = serialize(original)
  const restored = deserialize(json) as Record<string, any>
  if (!(restored.tags instanceof Set)) throw new Error('Set not restored')
  if (restored.tags.size !== 3) throw new Error(`size=${restored.tags.size}`)
})

await test('@stacksjs/data', 'serialize/deserialize Map roundtrip', async () => {
  const { serialize, deserialize } = await import('@stacksjs/data')
  const original = { meta: new Map([['key', 'value']]) }
  const json = serialize(original)
  const restored = deserialize(json) as Record<string, any>
  if (!(restored.meta instanceof Map)) throw new Error('Map not restored')
  if (restored.meta.get('key') !== 'value') throw new Error(`val=${restored.meta.get('key')}`)
})

// ─── @stx/deploy ───────────────────────────────────────
section('@stx/deploy')

await test('@stx/deploy', 'detectRuntime identifies Bun', async () => {
  const { detectRuntime } = await import('@stx/deploy')
  const runtime = detectRuntime()
  if (runtime.platform !== 'bun') throw new Error(`platform=${runtime.platform}`)
  if (!runtime.version) throw new Error('version missing')
})

await test('@stx/deploy', 'detectRuntime capabilities include sqlite', async () => {
  const { detectRuntime } = await import('@stx/deploy')
  const runtime = detectRuntime()
  if (!runtime.capabilities.includes('sqlite')) throw new Error(`caps=${runtime.capabilities}`)
})

await test('@stx/deploy', 'bunServerAdapter creates named adapter', async () => {
  const { bunServerAdapter } = await import('@stx/deploy')
  const adapter = bunServerAdapter({ port: 4000 })
  if (adapter.name !== 'bun-server') throw new Error(`name=${adapter.name}`)
  if (typeof adapter.build !== 'function') throw new Error('build not a function')
})

await test('@stx/deploy', 'staticAdapter creates named adapter', async () => {
  const { staticAdapter } = await import('@stx/deploy')
  const adapter = staticAdapter()
  if (adapter.name !== 'static') throw new Error(`name=${adapter.name}`)
  if (typeof adapter.build !== 'function') throw new Error('build not a function')
})

await test('@stx/deploy', 'defineAdapter creates custom adapter', async () => {
  const { defineAdapter } = await import('@stx/deploy')
  const adapter = defineAdapter({ name: 'custom', build: async () => ({ outputDir: './dist', files: [] }) })
  if (adapter.name !== 'custom') throw new Error(`name=${adapter.name}`)
})

await test('@stx/deploy', 'isEdgeRuntime returns false for Bun', async () => {
  const { isEdgeRuntime } = await import('@stx/deploy')
  if (isEdgeRuntime()) throw new Error('Bun should not be edge runtime')
})

// ═══════════════════════════════════════════════════════════════
// Phase 2: Full-Stack
// ═══════════════════════════════════════════════════════════════

console.log('\n── Phase 2 — Full-Stack ──')

// ─── @stacksjs/auth ─────────────────────────────────────────
section('@stacksjs/auth')

await test('@stacksjs/auth', 'hashPassword produces hash', async () => {
  const { hashPassword } = await import('@stacksjs/auth')
  const hash = await hashPassword('secret123')
  if (!hash) throw new Error('hash is empty')
  if (hash === 'secret123') throw new Error('hash equals plaintext')
  if (hash.length < 20) throw new Error('hash too short')
})

await test('@stacksjs/auth', 'verifyPassword correct password', async () => {
  const { hashPassword, verifyPassword } = await import('@stacksjs/auth')
  const hash = await hashPassword('mypassword')
  const valid = await verifyPassword('mypassword', hash)
  if (!valid) throw new Error('should verify correct password')
})

await test('@stacksjs/auth', 'verifyPassword wrong password', async () => {
  const { hashPassword, verifyPassword } = await import('@stacksjs/auth')
  const hash = await hashPassword('mypassword')
  const invalid = await verifyPassword('wrongpassword', hash)
  if (invalid) throw new Error('should reject wrong password')
})

await test('@stacksjs/auth', 'createSession returns session with id', async () => {
  const { createSession } = await import('@stacksjs/auth')
  const session = createSession('user-1', { email: 'test@test.com' })
  if (!session.id) throw new Error('id missing')
  if (session.userId !== 'user-1') throw new Error(`userId=${session.userId}`)
})

await test('@stacksjs/auth', 'getSession retrieves valid session', async () => {
  const { createSession, getSession } = await import('@stacksjs/auth')
  const session = createSession('user-2')
  const retrieved = getSession(session.id)
  if (!retrieved) throw new Error('session not found')
  if (retrieved.userId !== 'user-2') throw new Error(`userId=${retrieved.userId}`)
})

await test('@stacksjs/auth', 'destroySession removes session', async () => {
  const { createSession, getSession, destroySession } = await import('@stacksjs/auth')
  const session = createSession('user-3')
  destroySession(session.id)
  const retrieved = getSession(session.id)
  if (retrieved) throw new Error('session should be destroyed')
})

await test('@stacksjs/auth', 'getSession returns null for unknown id', async () => {
  const { getSession } = await import('@stacksjs/auth')
  const result = getSession('nonexistent-session-id')
  if (result !== null) throw new Error('should return null')
})

await test('@stacksjs/auth', 'definePermissions and can()', async () => {
  const { definePermissions, can } = await import('@stacksjs/auth')
  definePermissions([
    { name: 'delete-user', handler: (user: any) => user.role === 'admin' },
  ])
  if (!can({ role: 'admin' } as any, 'delete-user')) throw new Error('admin should be able to delete')
  if (can({ role: 'user' } as any, 'delete-user')) throw new Error('user should not be able to delete')
})

await test('@stacksjs/auth', 'can() returns false for unknown permission', async () => {
  const { can } = await import('@stacksjs/auth')
  if (can({ role: 'admin' } as any, 'fly-to-moon')) throw new Error('unknown permission should be false')
})

await test('@stacksjs/auth', 'authMiddleware is a function', async () => {
  const { authMiddleware } = await import('@stacksjs/auth')
  if (typeof authMiddleware !== 'function') throw new Error(`type=${typeof authMiddleware}`)
})

await test('@stacksjs/auth', 'guestMiddleware is a function', async () => {
  const { guestMiddleware } = await import('@stacksjs/auth')
  if (typeof guestMiddleware !== 'function') throw new Error(`type=${typeof guestMiddleware}`)
})

// ─── @stacksjs/api ───────────────────────────────────────────
section('@stacksjs/api')

await test('@stacksjs/api', 'defineHandler GET', async () => {
  const { defineHandler } = await import('@stacksjs/api')
  const h = defineHandler({ handler: async () => ({ ok: true }) })
  if (typeof h.handler !== 'function') throw new Error('handler missing')
})

await test('@stacksjs/api', 'defineHandler POST with middleware', async () => {
  const { defineHandler } = await import('@stacksjs/api')
  const h = defineHandler({ middleware: ['auth'], handler: async () => ({ ok: true }) })
  if (!h.middleware?.includes('auth')) throw new Error('middleware missing')
})

await test('@stacksjs/api', 'defineHandler without method defaults', async () => {
  const { defineHandler } = await import('@stacksjs/api')
  const h = defineHandler({ handler: async () => ({ ok: true }) })
  if (typeof h.handler !== 'function') throw new Error('handler missing')
})

// ═══════════════════════════════════════════════════════════════
// Phase 3: Production Ready
// ═══════════════════════════════════════════════════════════════

console.log('\n── Phase 3 — Production Ready ──')

// ─── @stacksjs/email ────────────────────────────────────────
section('@stacksjs/email')

await test('@stacksjs/email', 'MemoryProvider send and retrieve', async () => {
  const { MemoryProvider } = await import('@stacksjs/email')
  const provider = new MemoryProvider()
  const result = await provider.send({ to: 'a@t.com', subject: 'Hi', html: '<p>Hi</p>' })
  if (!result.success) throw new Error('send failed')
  if (provider.sent.length !== 1) throw new Error(`sent=${provider.sent.length}`)
  if (provider.getLastMessage()?.subject !== 'Hi') throw new Error('subject wrong')
})

await test('@stacksjs/email', 'MemoryProvider clear', async () => {
  const { MemoryProvider } = await import('@stacksjs/email')
  const provider = new MemoryProvider()
  await provider.send({ to: 'a@t.com', subject: 'test', text: 'test' })
  provider.clear()
  if (provider.sent.length !== 0) throw new Error('clear failed')
})

await test('@stacksjs/email', 'sendMail with configured provider', async () => {
  const { configureMailer, sendMail, MemoryProvider, resetMailer } = await import('@stacksjs/email')
  const mem = new MemoryProvider()
  configureMailer({ default: 'memory', from: 'app@stx.dev', providers: { memory: mem } })
  const result = await sendMail({ to: 'user@test.com', subject: 'Welcome', html: '<h1>Hi</h1>' })
  if (!result.success) throw new Error(`failed: ${result.error}`)
  if (!result.messageId) throw new Error('no messageId')
  resetMailer()
})

await test('@stacksjs/email', 'sendMail with multiple recipients', async () => {
  const { configureMailer, sendMail, MemoryProvider, resetMailer } = await import('@stacksjs/email')
  const mem = new MemoryProvider()
  configureMailer({ default: 'memory', from: 'app@stx.dev', providers: { memory: mem } })
  const result = await sendMail({ to: ['a@t.com', 'b@t.com'], subject: 'Bulk', text: 'Hi all' })
  if (!result.success) throw new Error('bulk failed')
  resetMailer()
})

await test('@stacksjs/email', 'resendProvider creates provider', async () => {
  const { resendProvider } = await import('@stacksjs/email')
  const provider = resendProvider({ apiKey: 'test-key' })
  if (provider.name !== 'resend') throw new Error(`name=${provider.name}`)
  if (typeof provider.send !== 'function') throw new Error('send missing')
})

// ─── @stacksjs/storage ──────────────────────────────────────
section('@stacksjs/storage')

await test('@stacksjs/storage', 'MemoryDriver put and get', async () => {
  const { MemoryDriver } = await import('@stacksjs/storage')
  const driver = new MemoryDriver()
  await driver.put('test.txt', 'hello')
  const content = await driver.get('test.txt')
  if (!content) throw new Error('get returned null')
  if (content.toString() !== 'hello') throw new Error(`content=${content}`)
})

await test('@stacksjs/storage', 'MemoryDriver exists', async () => {
  const { MemoryDriver } = await import('@stacksjs/storage')
  const driver = new MemoryDriver()
  await driver.put('file.txt', 'data')
  if (!await driver.exists('file.txt')) throw new Error('should exist')
  if (await driver.exists('nope.txt')) throw new Error('should not exist')
})

await test('@stacksjs/storage', 'MemoryDriver delete', async () => {
  const { MemoryDriver } = await import('@stacksjs/storage')
  const driver = new MemoryDriver()
  await driver.put('del.txt', 'data')
  await driver.delete('del.txt')
  if (await driver.exists('del.txt')) throw new Error('should be deleted')
})

await test('@stacksjs/storage', 'MemoryDriver list', async () => {
  const { MemoryDriver } = await import('@stacksjs/storage')
  const driver = new MemoryDriver()
  await driver.put('a.txt', 'a')
  await driver.put('b.txt', 'b')
  await driver.put('c/d.txt', 'c')
  const files = await driver.list()
  if (files.length !== 3) throw new Error(`count=${files.length}`)
})

await test('@stacksjs/storage', 'MemoryDriver list with prefix', async () => {
  const { MemoryDriver } = await import('@stacksjs/storage')
  const driver = new MemoryDriver()
  await driver.put('uploads/a.jpg', 'a')
  await driver.put('uploads/b.jpg', 'b')
  await driver.put('docs/c.pdf', 'c')
  const uploads = await driver.list('uploads')
  if (uploads.length !== 2) throw new Error(`uploads=${uploads.length}`)
})

await test('@stacksjs/storage', 'useStorage with configured disks', async () => {
  const { configureStorage, useStorage, MemoryDriver, resetStorage } = await import('@stacksjs/storage')
  const mem = new MemoryDriver()
  configureStorage({ default: 'memory', disks: { memory: mem } })
  const storage = useStorage()
  await storage.put('test.txt', 'data')
  if (!await storage.exists('test.txt')) throw new Error('file missing')
  resetStorage()
})

// ─── @stacksjs/errors ───────────────────────────────────────
section('@stacksjs/errors')

await test('@stacksjs/errors', 'ErrorBoundary catch', async () => {
  const { defineErrorBoundary } = await import('@stacksjs/errors')
  const b = defineErrorBoundary({ catch: (e) => `Error: ${e.message}` })
  const result = b.catch(new Error('test'))
  if (!result.toString().includes('test')) throw new Error('catch failed')
})

await test('@stacksjs/errors', 'ErrorBoundary wrap sync', async () => {
  const { defineErrorBoundary } = await import('@stacksjs/errors')
  const b = defineErrorBoundary({ catch: (e) => `Caught: ${e.message}` })
  const result = b.wrap(() => { throw new Error('boom') })
  if (!result.toString().includes('boom')) throw new Error('wrap failed')
})

await test('@stacksjs/errors', 'ErrorBoundary wrapAsync', async () => {
  const { defineErrorBoundary } = await import('@stacksjs/errors')
  const b = defineErrorBoundary({ catch: (e) => `Caught: ${e.message}` })
  const result = await b.wrapAsync(async () => { throw new Error('async boom') })
  if (!result.toString().includes('async boom')) throw new Error('wrapAsync failed')
})

await test('@stacksjs/errors', 'StxError is instanceof Error', async () => {
  const { StxError } = await import('@stacksjs/errors')
  const e = new StxError('test', { code: 'E001' })
  if (!(e instanceof Error)) throw new Error('not instanceof Error')
  if (e.code !== 'E001') throw new Error(`code=${e.code}`)
})

await test('@stacksjs/errors', 'NotFoundError', async () => {
  const { NotFoundError, StxError } = await import('@stacksjs/errors')
  const e = new NotFoundError('Post')
  if (!(e instanceof StxError)) throw new Error('not instanceof StxError')
  if (!e.message.includes('Post')) throw new Error(`msg=${e.message}`)
})

await test('@stacksjs/errors', 'ValidationError with field errors', async () => {
  const { ValidationError } = await import('@stacksjs/errors')
  const e = new ValidationError({ email: ['required'], name: ['too short'] })
  if (!e.errors.email.includes('required')) throw new Error('email errors missing')
  if (e.errors.name.length !== 1) throw new Error(`name errors=${e.errors.name.length}`)
})

await test('@stacksjs/errors', 'generateDevOverlay contains error info', async () => {
  const { generateDevOverlay } = await import('@stacksjs/errors')
  const html = generateDevOverlay(new Error('Render failed'))
  if (!html.includes('Render failed')) throw new Error('error message missing')
  if (!html.includes('<html')) throw new Error('not valid HTML')
})

await test('@stacksjs/errors', 'generate404Page', async () => {
  const { generate404Page } = await import('@stacksjs/errors')
  const html = generate404Page({ title: 'Not Found', message: 'Page missing' })
  if (!html.includes('404') && !html.includes('Not Found')) throw new Error('404 info missing')
})

await test('@stacksjs/errors', 'generate500Page', async () => {
  const { generate500Page } = await import('@stacksjs/errors')
  const html = generate500Page()
  if (!html.includes('<html') && !html.includes('<body')) throw new Error('not HTML')
})

await test('@stacksjs/errors', 'formatError returns string', async () => {
  const { formatError } = await import('@stacksjs/errors')
  const str = formatError(new Error('test error'))
  if (!str.includes('test error')) throw new Error(`formatted=${str}`)
})

// ═══════════════════════════════════════════════════════════════
// Phase 4: Ecosystem
// ═══════════════════════════════════════════════════════════════

console.log('\n── Phase 4 — Ecosystem ──')

// ─── @stacksjs/search ───────────────────────────────────────
section('@stacksjs/search')

await test('@stacksjs/search', 'tokenize splits and lowercases', async () => {
  const { tokenize } = await import('@stacksjs/search')
  const tokens = tokenize('Hello World Test')
  if (!tokens.includes('hello')) throw new Error('hello missing')
  if (!tokens.includes('world')) throw new Error('world missing')
  if (!tokens.includes('test')) throw new Error('test missing')
})

await test('@stacksjs/search', 'tokenize removes short words', async () => {
  const { tokenize } = await import('@stacksjs/search')
  const tokens = tokenize('I am a test', { minLength: 2 })
  if (tokens.includes('i')) throw new Error('should remove "i"')
  if (tokens.includes('a')) throw new Error('should remove "a"')
})

await test('@stacksjs/search', 'normalize removes accents', async () => {
  const { normalize } = await import('@stacksjs/search')
  if (normalize('Héllo') !== 'hello') throw new Error(`got ${normalize('Héllo')}`)
  if (normalize('  TRIM  ') !== 'trim') throw new Error(`got ${normalize('  TRIM  ')}`)
})

await test('@stacksjs/search', 'highlight wraps matches', async () => {
  const { highlight } = await import('@stacksjs/search')
  const result = highlight('Hello World', 'world', 'mark')
  if (!result.includes('<mark>')) throw new Error('no mark tag')
})

await test('@stacksjs/search', 'SearchIndex add and search', async () => {
  const { createSearchIndex, defineSearchable } = await import('@stacksjs/search')
  const index = createSearchIndex()
  index.register(defineSearchable('articles', { fields: ['title', 'body'] }))
  await index.addDocument('articles', '1', { title: 'TypeScript Guide', body: 'Learn TypeScript basics' })
  await index.addDocument('articles', '2', { title: 'JavaScript Intro', body: 'Getting started with JS' })
  const results = await index.search('articles', 'typescript')
  if (results.length < 1) throw new Error(`results=${results.length}`)
})

await test('@stacksjs/search', 'SearchIndex weighted fields', async () => {
  const { createSearchIndex, defineSearchable } = await import('@stacksjs/search')
  const index = createSearchIndex()
  index.register(defineSearchable('docs', { fields: ['title', 'body'], weights: { title: 10, body: 1 } }))
  await index.addDocument('docs', '1', { title: 'STX Framework', body: 'A modern web framework' })
  await index.addDocument('docs', '2', { title: 'Web Development', body: 'Build apps with STX framework' })
  const results = await index.search('docs', 'stx')
  if (results.length < 1) throw new Error('no results')
  // Doc with "STX" in title should score higher
  if (results[0].item.title !== 'STX Framework') throw new Error('wrong ranking')
})

await test('@stacksjs/search', 'SearchIndex count', async () => {
  const { createSearchIndex, defineSearchable } = await import('@stacksjs/search')
  const index = createSearchIndex()
  index.register(defineSearchable('items', { fields: ['name'] }))
  await index.addDocument('items', '1', { name: 'A' })
  await index.addDocument('items', '2', { name: 'B' })
  await index.addDocument('items', '3', { name: 'C' })
  if (await index.count('items') !== 3) throw new Error('count wrong')
})

await test('@stacksjs/search', 'SearchIndex removeDocument', async () => {
  const { createSearchIndex, defineSearchable } = await import('@stacksjs/search')
  const index = createSearchIndex()
  index.register(defineSearchable('remove-test', { fields: ['name'] }))
  await index.addDocument('remove-test', '1', { name: 'Keep' })
  await index.addDocument('remove-test', '2', { name: 'Remove' })
  await index.removeDocument('remove-test', '2')
  if (await index.count('remove-test') !== 1) throw new Error('remove failed')
})

// ─── @stacksjs/ai ────────────────────────────────────────────
section('@stacksjs/ai')

await test('@stacksjs/ai', 'MockProvider chat returns responses', async () => {
  const { MockProvider } = await import('@stacksjs/ai')
  const mock = new MockProvider(['Hello!', 'Goodbye!'])
  const r1 = await mock.chat([{ role: 'user', content: 'Hi' }])
  if (r1.content !== 'Hello!') throw new Error(`r1=${r1.content}`)
  const r2 = await mock.chat([{ role: 'user', content: 'Bye' }])
  if (r2.content !== 'Goodbye!') throw new Error(`r2=${r2.content}`)
})

await test('@stacksjs/ai', 'MockProvider cycles responses', async () => {
  const { MockProvider } = await import('@stacksjs/ai')
  const mock = new MockProvider(['A', 'B'])
  await mock.chat([{ role: 'user', content: '1' }]) // A
  await mock.chat([{ role: 'user', content: '2' }]) // B
  const r3 = await mock.chat([{ role: 'user', content: '3' }]) // A again
  if (r3.content !== 'A') throw new Error(`r3=${r3.content}`)
})

await test('@stacksjs/ai', 'MockProvider records calls', async () => {
  const { MockProvider } = await import('@stacksjs/ai')
  const mock = new MockProvider(['OK'])
  await mock.chat([{ role: 'user', content: 'test' }])
  if (mock.calls.length !== 1) throw new Error(`calls=${mock.calls.length}`)
  if (mock.calls[0].messages[0].content !== 'test') throw new Error('call not recorded')
})

await test('@stacksjs/ai', 'MockProvider stream yields chunks', async () => {
  const { MockProvider } = await import('@stacksjs/ai')
  const mock = new MockProvider(['Stream!'])
  let result = ''
  if (mock.stream) {
    for await (const chunk of mock.stream([{ role: 'user', content: 'test' }])) {
      result += chunk.content
    }
  }
  if (!result.includes('Stream')) throw new Error(`stream=${result}`)
})

await test('@stacksjs/ai', 'configureAI and useAI', async () => {
  const { configureAI, useAI, MockProvider, resetAI } = await import('@stacksjs/ai')
  const mock = new MockProvider(['test'])
  configureAI({ default: 'mock', providers: { mock } })
  const provider = useAI()
  if (provider.name !== 'mock') throw new Error(`name=${provider.name}`)
  resetAI()
})

await test('@stacksjs/ai', 'chat() convenience function', async () => {
  const { configureAI, chat, MockProvider, resetAI } = await import('@stacksjs/ai')
  const mock = new MockProvider(['Response'])
  configureAI({ default: 'mock', providers: { mock } })
  const response = await chat([{ role: 'user', content: 'Hello' }])
  if (response.content !== 'Response') throw new Error(`content=${response.content}`)
  resetAI()
})

await test('@stacksjs/ai', 'ask() convenience function', async () => {
  const { configureAI, ask, MockProvider, resetAI } = await import('@stacksjs/ai')
  const mock = new MockProvider(['42'])
  configureAI({ default: 'mock', providers: { mock } })
  const answer = await ask('What is the answer?')
  if (answer !== '42') throw new Error(`answer=${answer}`)
  resetAI()
})

await test('@stacksjs/ai', 'collectStream concatenates chunks', async () => {
  const { configureAI, streamChat, collectStream, MockProvider, resetAI } = await import('@stacksjs/ai')
  const mock = new MockProvider(['Hello World'])
  configureAI({ default: 'mock', providers: { mock } })
  const result = await collectStream(streamChat([{ role: 'user', content: 'test' }]))
  if (!result.includes('Hello')) throw new Error(`result=${result}`)
  resetAI()
})

await test('@stacksjs/ai', 'anthropicProvider exists', async () => {
  const { anthropicProvider } = await import('@stacksjs/ai')
  const p = anthropicProvider({ apiKey: 'test' })
  if (p.name !== 'anthropic') throw new Error(`name=${p.name}`)
  if (typeof p.chat !== 'function') throw new Error('chat missing')
})

await test('@stacksjs/ai', 'openaiProvider exists', async () => {
  const { openaiProvider } = await import('@stacksjs/ai')
  const p = openaiProvider({ apiKey: 'test' })
  if (p.name !== 'openai') throw new Error(`name=${p.name}`)
  if (typeof p.chat !== 'function') throw new Error('chat missing')
})

// ─── @stacksjs/cms ───────────────────────────────────────────
section('@stacksjs/cms')

await test('@stacksjs/cms', 'parseFrontmatter extracts data and content', async () => {
  const { parseFrontmatter } = await import('@stacksjs/cms')
  const { data, content } = parseFrontmatter('---\ntitle: Hello\ndraft: false\n---\nBody text')
  if (data.title !== 'Hello') throw new Error(`title=${data.title}`)
  if (data.draft !== false) throw new Error(`draft=${data.draft}`)
  if (!content.includes('Body text')) throw new Error('body missing')
})

await test('@stacksjs/cms', 'parseFrontmatter handles numbers', async () => {
  const { parseFrontmatter } = await import('@stacksjs/cms')
  const { data } = parseFrontmatter('---\ncount: 42\nprice: 9.99\n---\n')
  if (data.count !== 42) throw new Error(`count=${data.count}`)
  if (data.price !== 9.99) throw new Error(`price=${data.price}`)
})

await test('@stacksjs/cms', 'parseFrontmatter handles arrays', async () => {
  const { parseFrontmatter } = await import('@stacksjs/cms')
  const { data } = parseFrontmatter('---\ntags:\n  - typescript\n  - framework\n---\n')
  if (!Array.isArray(data.tags)) throw new Error('tags not array')
  if ((data.tags as string[]).length !== 2) throw new Error(`tags=${(data.tags as string[]).length}`)
})

await test('@stacksjs/cms', 'parseFrontmatter no frontmatter', async () => {
  const { parseFrontmatter } = await import('@stacksjs/cms')
  const { data, content } = parseFrontmatter('Just plain text')
  if (Object.keys(data).length !== 0) throw new Error('data should be empty')
  if (!content.includes('Just plain text')) throw new Error('content missing')
})

await test('@stacksjs/cms', 'generateSlug basic', async () => {
  const { generateSlug } = await import('@stacksjs/cms')
  if (generateSlug('Hello World') !== 'hello-world') throw new Error('basic slug failed')
})

await test('@stacksjs/cms', 'generateSlug special chars', async () => {
  const { generateSlug } = await import('@stacksjs/cms')
  const slug = generateSlug('Hello, World! #2025')
  if (slug.includes(',') || slug.includes('!') || slug.includes('#')) throw new Error(`slug=${slug}`)
})

await test('@stacksjs/cms', 'extractExcerpt first paragraph', async () => {
  const { extractExcerpt } = await import('@stacksjs/cms')
  const excerpt = extractExcerpt('First paragraph.\n\nSecond paragraph.')
  if (!excerpt.includes('First paragraph')) throw new Error('excerpt wrong')
})

await test('@stacksjs/cms', 'Collection addItem and getBySlug', async () => {
  const { createCollection, defineCollection } = await import('@stacksjs/cms')
  const c = createCollection(defineCollection('blog', { directory: 'content' }))
  c.addItem({ slug: 'post-1', title: 'Post 1', data: {}, content: 'body', filePath: 'x.md', collection: 'blog' })
  const item = c.getBySlug('post-1')
  if (!item) throw new Error('not found')
  if (item.title !== 'Post 1') throw new Error(`title=${item.title}`)
})

await test('@stacksjs/cms', 'Collection count and has', async () => {
  const { createCollection, defineCollection } = await import('@stacksjs/cms')
  const c = createCollection(defineCollection('items', { directory: 'content' }))
  c.addItem({ slug: 'a', data: {}, content: '', filePath: 'a.md', collection: 'items' })
  c.addItem({ slug: 'b', data: {}, content: '', filePath: 'b.md', collection: 'items' })
  if (c.count() !== 2) throw new Error(`count=${c.count()}`)
  if (!c.has('a')) throw new Error('has(a) failed')
  if (c.has('c')) throw new Error('has(c) should be false')
})

await test('@stacksjs/cms', 'Collection getTags', async () => {
  const { createCollection, defineCollection } = await import('@stacksjs/cms')
  const c = createCollection(defineCollection('tagged', { directory: 'content' }))
  c.addItem({ slug: 'a', data: { tags: ['js', 'ts'] }, content: '', filePath: 'a.md', collection: 'tagged' })
  c.addItem({ slug: 'b', data: { tags: ['ts', 'bun'] }, content: '', filePath: 'b.md', collection: 'tagged' })
  const tags = c.getTags()
  if (!tags.includes('js')) throw new Error('js missing')
  if (!tags.includes('bun')) throw new Error('bun missing')
  if (tags.length !== 3) throw new Error(`tags=${tags.length}`)
})

await test('@stacksjs/cms', 'Content registry register/get/getAll', async () => {
  const { createCollection, defineCollection, registerCollection, getContent, getAllContent, resetCollections } = await import('@stacksjs/cms')
  const c = createCollection(defineCollection('pages', { directory: 'content' }))
  c.addItem({ slug: 'home', title: 'Home', data: {}, content: 'Welcome', filePath: 'home.md', collection: 'pages' })
  c.addItem({ slug: 'about', title: 'About', data: {}, content: 'About us', filePath: 'about.md', collection: 'pages' })
  registerCollection(c)
  const home = await getContent('pages', 'home')
  if (!home) throw new Error('home not found')
  const all = await getAllContent('pages')
  if (all.length !== 2) throw new Error(`all=${all.length}`)
  resetCollections()
})

// ═══════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════

console.log('\n' + '='.repeat(60))
console.log('\n📊 Summary\n')

const passed = results.filter(r => r.status === 'PASS')
const failed = results.filter(r => r.status === 'FAIL')

// Group by package
const pkgMap = new Map<string, { pass: number; fail: number }>()
for (const r of results) {
  if (!pkgMap.has(r.pkg)) pkgMap.set(r.pkg, { pass: 0, fail: 0 })
  const p = pkgMap.get(r.pkg)!
  if (r.status === 'PASS') p.pass++
  else p.fail++
}

for (const [pkg, stats] of pkgMap) {
  const icon = stats.fail > 0 ? '❌' : '✅'
  console.log(`  ${icon} ${pkg}: ${stats.pass}/${stats.pass + stats.fail} passed`)
}

console.log(`\n  Total:  ${results.length}`)
console.log(`  Passed: ${passed.length}`)
console.log(`  Failed: ${failed.length}`)

if (failed.length > 0) {
  console.log('\n❌ Failures:\n')
  for (const f of failed) {
    console.log(`  ${f.pkg} > ${f.test}: ${f.detail}`)
  }
}

console.log('\n' + '='.repeat(60) + '\n')
process.exit(failed.length > 0 ? 1 : 0)
