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

// ─── @stacksjs/config ────────────────────────────────────────
section('@stacksjs/config')

await test('@stacksjs/config', 'defineEnv with string default', async () => {
  const { defineEnv } = await import('@stacksjs/config')
  const env = defineEnv({ APP_NAME: { type: 'string', default: 'STX' } })
  if (env.APP_NAME !== 'STX') throw new Error(`got ${env.APP_NAME}`)
})

await test('@stacksjs/config', 'defineEnv with number coercion', async () => {
  const { defineEnv } = await import('@stacksjs/config')
  const env = defineEnv({ PORT: { type: 'number', default: 3000 } })
  if (env.PORT !== 3000) throw new Error(`got ${env.PORT}`)
  if (typeof env.PORT !== 'number') throw new Error(`type=${typeof env.PORT}`)
})

await test('@stacksjs/config', 'defineEnv with boolean coercion', async () => {
  const { defineEnv } = await import('@stacksjs/config')
  const env = defineEnv({ DEBUG: { type: 'boolean', default: false } })
  if (env.DEBUG !== false) throw new Error(`got ${env.DEBUG}`)
  if (typeof env.DEBUG !== 'boolean') throw new Error(`type=${typeof env.DEBUG}`)
})

await test('@stacksjs/config', 'isProduction/isDevelopment/isTest helpers', async () => {
  const { isProduction, isDevelopment, isTest } = await import('@stacksjs/config')
  if (typeof isProduction !== 'function') throw new Error('isProduction not exported')
  if (typeof isDevelopment !== 'function') throw new Error('isDevelopment not exported')
  if (typeof isTest !== 'function') throw new Error('isTest not exported')
  // In test context, isTest() should return true or isProduction() false
  if (isProduction()) throw new Error('should not be production in test')
})

await test('@stacksjs/config', 'defineEnv with multiple vars', async () => {
  const { defineEnv } = await import('@stacksjs/config')
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
  const restored = deserialize(json)
  if (!(restored.created instanceof Date)) throw new Error('Date not restored')
  if (restored.created.toISOString() !== '2025-06-15T12:00:00.000Z') throw new Error(`date=${restored.created}`)
})

await test('@stacksjs/data', 'serialize/deserialize BigInt roundtrip', async () => {
  const { serialize, deserialize } = await import('@stacksjs/data')
  const original = { count: BigInt(9007199254740993) }
  const json = serialize(original)
  const restored = deserialize(json)
  if (typeof restored.count !== 'bigint') throw new Error(`type=${typeof restored.count}`)
})

await test('@stacksjs/data', 'serialize/deserialize Set roundtrip', async () => {
  const { serialize, deserialize } = await import('@stacksjs/data')
  const original = { tags: new Set(['a', 'b', 'c']) }
  const json = serialize(original)
  const restored = deserialize(json)
  if (!(restored.tags instanceof Set)) throw new Error('Set not restored')
  if (restored.tags.size !== 3) throw new Error(`size=${restored.tags.size}`)
})

await test('@stacksjs/data', 'serialize/deserialize Map roundtrip', async () => {
  const { serialize, deserialize } = await import('@stacksjs/data')
  const original = { meta: new Map([['key', 'value']]) }
  const json = serialize(original)
  const restored = deserialize(json)
  if (!(restored.meta instanceof Map)) throw new Error('Map not restored')
  if (restored.meta.get('key') !== 'value') throw new Error(`val=${restored.meta.get('key')}`)
})

// ─── @stacksjs/deploy ───────────────────────────────────────
section('@stacksjs/deploy')

await test('@stacksjs/deploy', 'detectRuntime identifies Bun', async () => {
  const { detectRuntime } = await import('@stacksjs/deploy')
  const runtime = detectRuntime()
  if (runtime.platform !== 'bun') throw new Error(`platform=${runtime.platform}`)
  if (!runtime.version) throw new Error('version missing')
})

await test('@stacksjs/deploy', 'detectRuntime capabilities include sqlite', async () => {
  const { detectRuntime } = await import('@stacksjs/deploy')
  const runtime = detectRuntime()
  if (!runtime.capabilities.includes('sqlite')) throw new Error(`caps=${runtime.capabilities}`)
})

await test('@stacksjs/deploy', 'bunServerAdapter creates named adapter', async () => {
  const { bunServerAdapter } = await import('@stacksjs/deploy')
  const adapter = bunServerAdapter({ port: 4000 })
  if (adapter.name !== 'bun-server') throw new Error(`name=${adapter.name}`)
  if (typeof adapter.build !== 'function') throw new Error('build not a function')
})

await test('@stacksjs/deploy', 'staticAdapter creates named adapter', async () => {
  const { staticAdapter } = await import('@stacksjs/deploy')
  const adapter = staticAdapter()
  if (adapter.name !== 'static') throw new Error(`name=${adapter.name}`)
  if (typeof adapter.build !== 'function') throw new Error('build not a function')
})

await test('@stacksjs/deploy', 'defineAdapter creates custom adapter', async () => {
  const { defineAdapter } = await import('@stacksjs/deploy')
  const adapter = defineAdapter({ name: 'custom', build: async () => ({ success: true, outputDir: './dist' }) })
  if (adapter.name !== 'custom') throw new Error(`name=${adapter.name}`)
})

await test('@stacksjs/deploy', 'isEdgeRuntime returns false for Bun', async () => {
  const { isEdgeRuntime } = await import('@stacksjs/deploy')
  if (isEdgeRuntime()) throw new Error('Bun should not be edge runtime')
})

// ═══════════════════════════════════════════════════════════════
// Phase 2: Full-Stack
// ═══════════════════════════════════════════════════════════════

console.log('\n── Phase 2 — Full-Stack ──')

// ─── @stacksjs/db ────────────────────────────────────────────
section('@stacksjs/db')

await test('@stacksjs/db', 'db() convenience creates QueryBuilder', async () => {
  const { db } = await import('@stacksjs/db')
  const { sql } = db('users').toSQL()
  if (sql !== 'SELECT * FROM users') throw new Error(`sql=${sql}`)
})

await test('@stacksjs/db', 'QueryBuilder select with columns', async () => {
  const { QueryBuilder } = await import('@stacksjs/db')
  const { sql } = new QueryBuilder('users').select('id', 'name').toSQL()
  if (sql !== 'SELECT id, name FROM users') throw new Error(`sql=${sql}`)
})

await test('@stacksjs/db', 'QueryBuilder where clause', async () => {
  const { db } = await import('@stacksjs/db')
  const { sql, bindings } = db('users').where('active', true).toSQL()
  if (!sql.includes('WHERE active = ?')) throw new Error(`sql=${sql}`)
  if (bindings[0] !== true) throw new Error(`binding=${bindings[0]}`)
})

await test('@stacksjs/db', 'QueryBuilder where with operator', async () => {
  const { db } = await import('@stacksjs/db')
  const { sql, bindings } = db('users').where('age', '>=', 18).toSQL()
  if (!sql.includes('age >= ?')) throw new Error(`sql=${sql}`)
  if (bindings[0] !== 18) throw new Error(`binding=${bindings[0]}`)
})

await test('@stacksjs/db', 'QueryBuilder multiple where (AND)', async () => {
  const { db } = await import('@stacksjs/db')
  const { sql, bindings } = db('users').where('active', true).where('role', 'admin').toSQL()
  if (!sql.includes('AND role = ?')) throw new Error(`sql=${sql}`)
  if (bindings.length !== 2) throw new Error(`bindings=${bindings.length}`)
})

await test('@stacksjs/db', 'QueryBuilder orWhere', async () => {
  const { db } = await import('@stacksjs/db')
  const { sql } = db('users').where('role', 'admin').orWhere('role', 'super').toSQL()
  if (!sql.includes('OR role = ?')) throw new Error(`sql=${sql}`)
})

await test('@stacksjs/db', 'QueryBuilder whereNull', async () => {
  const { db } = await import('@stacksjs/db')
  const { sql } = db('users').whereNull('deleted_at').toSQL()
  if (!sql.includes('deleted_at IS NULL')) throw new Error(`sql=${sql}`)
})

await test('@stacksjs/db', 'QueryBuilder whereIn', async () => {
  const { db } = await import('@stacksjs/db')
  const { sql, bindings } = db('users').whereIn('id', [1, 2, 3]).toSQL()
  if (!sql.includes('IN (?, ?, ?)')) throw new Error(`sql=${sql}`)
  if (bindings.length !== 3) throw new Error(`bindings=${bindings.length}`)
})

await test('@stacksjs/db', 'QueryBuilder whereBetween', async () => {
  const { db } = await import('@stacksjs/db')
  const { sql, bindings } = db('users').whereBetween('age', [18, 65]).toSQL()
  if (!sql.includes('BETWEEN ? AND ?')) throw new Error(`sql=${sql}`)
  if (bindings.length !== 2) throw new Error(`bindings=${bindings.length}`)
})

await test('@stacksjs/db', 'QueryBuilder orderBy/limit/offset', async () => {
  const { db } = await import('@stacksjs/db')
  const { sql } = db('users').orderBy('name').limit(10).offset(20).toSQL()
  if (!sql.includes('ORDER BY name ASC')) throw new Error('orderBy missing')
  if (!sql.includes('LIMIT 10')) throw new Error('limit missing')
  if (!sql.includes('OFFSET 20')) throw new Error('offset missing')
})

await test('@stacksjs/db', 'QueryBuilder orderBy desc', async () => {
  const { db } = await import('@stacksjs/db')
  const { sql } = db('users').orderBy('created_at', 'desc').toSQL()
  if (!sql.includes('ORDER BY created_at DESC')) throw new Error(`sql=${sql}`)
})

await test('@stacksjs/db', 'QueryBuilder distinct', async () => {
  const { db } = await import('@stacksjs/db')
  const { sql } = db('users').distinct().toSQL()
  if (!sql.includes('SELECT DISTINCT')) throw new Error(`sql=${sql}`)
})

await test('@stacksjs/db', 'QueryBuilder groupBy', async () => {
  const { db } = await import('@stacksjs/db')
  const { sql } = db('orders').groupBy('status').toSQL()
  if (!sql.includes('GROUP BY status')) throw new Error(`sql=${sql}`)
})

await test('@stacksjs/db', 'QueryBuilder join', async () => {
  const { db } = await import('@stacksjs/db')
  const { sql } = db('users').join('posts', 'users.id', '=', 'posts.user_id').toSQL()
  if (!sql.includes('INNER JOIN posts ON users.id = posts.user_id')) throw new Error(`sql=${sql}`)
})

await test('@stacksjs/db', 'QueryBuilder leftJoin', async () => {
  const { db } = await import('@stacksjs/db')
  const { sql } = db('users').leftJoin('posts', 'users.id', '=', 'posts.user_id').toSQL()
  if (!sql.includes('LEFT JOIN posts')) throw new Error(`sql=${sql}`)
})

await test('@stacksjs/db', 'QueryBuilder toInsertSQL', async () => {
  const { QueryBuilder } = await import('@stacksjs/db')
  const { sql, bindings } = new QueryBuilder('users').toInsertSQL({ name: 'Alice', email: 'a@t.com' })
  if (!sql.includes('INSERT INTO users')) throw new Error(`sql=${sql}`)
  if (!sql.includes('VALUES (?, ?)')) throw new Error('values missing')
  if (bindings.length !== 2) throw new Error(`bindings=${bindings.length}`)
})

await test('@stacksjs/db', 'QueryBuilder toUpdateSQL', async () => {
  const { QueryBuilder } = await import('@stacksjs/db')
  const { sql, bindings } = new QueryBuilder('users').where('id', 1).toUpdateSQL({ name: 'Bob' })
  if (!sql.includes('UPDATE users SET name = ?')) throw new Error(`sql=${sql}`)
  if (!sql.includes('WHERE id = ?')) throw new Error('where missing')
  if (bindings.length !== 2) throw new Error(`bindings=${bindings.length}`)
})

await test('@stacksjs/db', 'QueryBuilder toDeleteSQL', async () => {
  const { QueryBuilder } = await import('@stacksjs/db')
  const { sql, bindings } = new QueryBuilder('users').where('id', 1).toDeleteSQL()
  if (!sql.includes('DELETE FROM users')) throw new Error(`sql=${sql}`)
  if (bindings[0] !== 1) throw new Error(`binding=${bindings[0]}`)
})

await test('@stacksjs/db', 'QueryBuilder toCountSQL', async () => {
  const { db } = await import('@stacksjs/db')
  const { sql } = db('users').where('active', true).toCountSQL()
  if (!sql.includes('SELECT COUNT(*)')) throw new Error(`sql=${sql}`)
})

await test('@stacksjs/db', 'raw expression', async () => {
  const { raw } = await import('@stacksjs/db')
  const expr = raw('NOW()')
  if (!expr.__raw) throw new Error('__raw missing')
  if (expr.sql !== 'NOW()') throw new Error(`sql=${expr.sql}`)
})

await test('@stacksjs/db', 'defineTable with all column types', async () => {
  const { defineTable } = await import('@stacksjs/db')
  const schema = defineTable('posts', (t) => {
    t.id()
    t.string('title')
    t.text('body').nullable()
    t.integer('user_id').references('users')
    t.boolean('published').default(false)
    t.timestamps()
    t.softDeletes()
  })
  if (schema.name !== 'posts') throw new Error(`name=${schema.name}`)
  if (schema.columns.length < 7) throw new Error(`cols=${schema.columns.length}`)
})

await test('@stacksjs/db', 'tableSchemaToSQL generates CREATE TABLE', async () => {
  const { defineTable, tableSchemaToSQL } = await import('@stacksjs/db')
  const schema = defineTable('test_table', (t) => {
    t.id()
    t.string('name')
    t.string('email').unique()
    t.integer('age')
    t.boolean('active').default(true)
  })
  const sql = tableSchemaToSQL(schema)
  if (!sql.includes('CREATE TABLE')) throw new Error('CREATE TABLE missing')
  if (!sql.includes('PRIMARY KEY')) throw new Error('PRIMARY KEY missing')
  if (!sql.includes('UNIQUE')) throw new Error('UNIQUE missing')
})

await test('@stacksjs/db', 'tableSchemaToSQL generates FOREIGN KEY', async () => {
  const { defineTable, tableSchemaToSQL } = await import('@stacksjs/db')
  const schema = defineTable('comments', (t) => {
    t.id()
    t.integer('post_id').references('posts')
  })
  const sql = tableSchemaToSQL(schema)
  if (!sql.includes('FOREIGN KEY (post_id) REFERENCES posts(id)')) throw new Error(`sql=${sql}`)
})

await test('@stacksjs/db', 'defineModel creates model with query()', async () => {
  const { defineModel } = await import('@stacksjs/db')
  const Post = defineModel('Post', { table: 'posts', primaryKey: 'id' })
  if (Post.name !== 'Post') throw new Error(`name=${Post.name}`)
  const qb = Post.query()
  if (typeof qb.where !== 'function') throw new Error('query() missing where')
})

await test('@stacksjs/db', 'defineModel where() shortcut', async () => {
  const { defineModel } = await import('@stacksjs/db')
  const User = defineModel('UserWhere', { table: 'users', primaryKey: 'id' })
  const { sql } = User.where('active', true).toSQL()
  if (!sql.includes('WHERE active = ?')) throw new Error(`sql=${sql}`)
})

await test('@stacksjs/db', 'createModelInstance get/set/isDirty', async () => {
  const { createModelInstance } = await import('@stacksjs/db')
  const inst = createModelInstance({ id: 1, name: 'Alice', email: 'alice@test.com' })
  if (inst.get('name') !== 'Alice') throw new Error('get failed')
  if (!inst.exists) throw new Error('exists should be true')
  if (inst.isDirty()) throw new Error('should not be dirty initially')
  inst.set('name', 'Bob')
  if (!inst.isDirty('name')) throw new Error('should be dirty after set')
  if (!inst.isDirty()) throw new Error('global isDirty should be true')
})

await test('@stacksjs/db', 'createModelInstance toJSON', async () => {
  const { createModelInstance } = await import('@stacksjs/db')
  const inst = createModelInstance({ id: 1, name: 'Alice' })
  const json = inst.toJSON()
  if (json.name !== 'Alice') throw new Error('toJSON failed')
  json.name = 'MODIFIED'
  if (inst.get('name') === 'MODIFIED') throw new Error('toJSON should return copy')
})

await test('@stacksjs/db', 'getModel and hasModel', async () => {
  const { defineModel, getModel, hasModel } = await import('@stacksjs/db')
  defineModel('Comment', { table: 'comments', primaryKey: 'id' })
  if (!hasModel('Comment')) throw new Error('hasModel should be true')
  const m = getModel('Comment')
  if (m.name !== 'Comment') throw new Error(`name=${m.name}`)
})

await test('@stacksjs/db', 'configureDatabase and resetDatabaseConfig', async () => {
  const { configureDatabase, getDatabaseConfig, resetDatabaseConfig } = await import('@stacksjs/db')
  configureDatabase({ default: 'postgres', logging: true })
  const config = getDatabaseConfig()
  if (config.default !== 'postgres') throw new Error(`default=${config.default}`)
  if (config.logging !== true) throw new Error('logging not set')
  resetDatabaseConfig()
  const reset = getDatabaseConfig()
  if (reset.default !== 'sqlite') throw new Error('reset failed')
})

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
  const h = defineHandler({ method: 'GET', handler: async () => ({ ok: true }) })
  if (typeof h.handler !== 'function') throw new Error('handler missing')
  if (h.method !== 'GET') throw new Error(`method=${h.method}`)
})

await test('@stacksjs/api', 'defineHandler POST with middleware', async () => {
  const { defineHandler } = await import('@stacksjs/api')
  const h = defineHandler({ method: 'POST', middleware: ['auth'], handler: async () => ({ ok: true }) })
  if (!h.middleware?.includes('auth')) throw new Error('middleware missing')
})

await test('@stacksjs/api', 'defineHandler without method defaults', async () => {
  const { defineHandler } = await import('@stacksjs/api')
  const h = defineHandler({ handler: async () => ({ ok: true }) })
  if (typeof h.handler !== 'function') throw new Error('handler missing')
})

// ─── @stacksjs/forms ────────────────────────────────────────
section('@stacksjs/forms')

await test('@stacksjs/forms', 'Validator required passes for valid input', async () => {
  const { Validator } = await import('@stacksjs/forms')
  const errors = await new Validator().required().validate('hello')
  if (errors.length > 0) throw new Error(`errors=${errors}`)
})

await test('@stacksjs/forms', 'Validator required fails for empty', async () => {
  const { Validator } = await import('@stacksjs/forms')
  const errors = await new Validator().required().validate('')
  if (errors.length === 0) throw new Error('should fail for empty')
})

await test('@stacksjs/forms', 'Validator required fails for null', async () => {
  const { Validator } = await import('@stacksjs/forms')
  const errors = await new Validator().required().validate(null)
  if (errors.length === 0) throw new Error('should fail for null')
})

await test('@stacksjs/forms', 'Validator email passes valid email', async () => {
  const { Validator } = await import('@stacksjs/forms')
  const errors = await new Validator().required().email().validate('test@example.com')
  if (errors.length > 0) throw new Error(`errors=${errors}`)
})

await test('@stacksjs/forms', 'Validator email rejects invalid email', async () => {
  const { Validator } = await import('@stacksjs/forms')
  const errors = await new Validator().required().email().validate('not-an-email')
  if (errors.length === 0) throw new Error('should reject invalid email')
})

await test('@stacksjs/forms', 'Validator min length', async () => {
  const { Validator } = await import('@stacksjs/forms')
  const errors = await new Validator().required().min(5).validate('hi')
  if (errors.length === 0) throw new Error('should reject short string')
})

await test('@stacksjs/forms', 'Validator max length', async () => {
  const { Validator } = await import('@stacksjs/forms')
  const errors = await new Validator().required().max(3).validate('hello')
  if (errors.length === 0) throw new Error('should reject long string')
})

await test('@stacksjs/forms', 'Validator chaining required+email+min', async () => {
  const { Validator } = await import('@stacksjs/forms')
  const v = new Validator().required().email().min(10)
  const passErrors = await v.validate('user@example.com')
  if (passErrors.length > 0) throw new Error(`should pass: ${passErrors}`)
  const failErrors = await v.validate('a@b.c')
  if (failErrors.length === 0) throw new Error('should fail min length')
})

await test('@stacksjs/forms', 'Validator url', async () => {
  const { Validator } = await import('@stacksjs/forms')
  const errors = await new Validator().url().validate('https://example.com')
  if (errors.length > 0) throw new Error(`errors=${errors}`)
  const bad = await new Validator().url().validate('not-a-url')
  if (bad.length === 0) throw new Error('should reject bad url')
})

await test('@stacksjs/forms', 'v shortcut is a Validator', async () => {
  const { v, Validator } = await import('@stacksjs/forms')
  if (!(v instanceof Validator)) throw new Error('v is not Validator')
})

await test('@stacksjs/forms', 'useForm creates form with values and reset', async () => {
  const { useForm } = await import('@stacksjs/forms')
  const form = useForm({ initial: { name: 'Alice', email: '' } })
  if (form.values.name !== 'Alice') throw new Error(`name=${form.values.name}`)
  if (typeof form.reset !== 'function') throw new Error('reset missing')
  if (typeof form.submit !== 'function') throw new Error('submit missing')
})

// ─── @stacksjs/cache ────────────────────────────────────────
section('@stacksjs/cache')

await test('@stacksjs/cache', 'createCache with memory driver', async () => {
  const { createCache } = await import('@stacksjs/cache')
  const cache = createCache({ driver: 'memory' })
  if (typeof cache.get !== 'function') throw new Error('get missing')
  if (typeof cache.set !== 'function') throw new Error('set missing')
})

await test('@stacksjs/cache', 'set and get', async () => {
  const { createCache } = await import('@stacksjs/cache')
  const cache = createCache({ driver: 'memory' })
  await cache.set('key', 'value')
  const val = await cache.get('key')
  if (val !== 'value') throw new Error(`val=${val}`)
})

await test('@stacksjs/cache', 'has returns true for existing key', async () => {
  const { createCache } = await import('@stacksjs/cache')
  const cache = createCache({ driver: 'memory' })
  await cache.set('exists', true)
  if (!await cache.has('exists')) throw new Error('has should be true')
})

await test('@stacksjs/cache', 'has returns false for missing key', async () => {
  const { createCache } = await import('@stacksjs/cache')
  const cache = createCache({ driver: 'memory' })
  if (await cache.has('missing')) throw new Error('has should be false')
})

await test('@stacksjs/cache', 'delete removes key', async () => {
  const { createCache } = await import('@stacksjs/cache')
  const cache = createCache({ driver: 'memory' })
  await cache.set('del', 'me')
  await cache.delete('del')
  if (await cache.has('del')) throw new Error('key should be deleted')
})

await test('@stacksjs/cache', 'remember caches factory result', async () => {
  const { createCache } = await import('@stacksjs/cache')
  const cache = createCache({ driver: 'memory' })
  let calls = 0
  await cache.remember('r', 60, async () => { calls++; return 'val' })
  await cache.remember('r', 60, async () => { calls++; return 'other' })
  if (calls !== 1) throw new Error(`factory called ${calls} times`)
  const val = await cache.get('r')
  if (val !== 'val') throw new Error(`val=${val}`)
})

await test('@stacksjs/cache', 'flush clears all keys', async () => {
  const { createCache } = await import('@stacksjs/cache')
  const cache = createCache({ driver: 'memory' })
  await cache.set('a', 1)
  await cache.set('b', 2)
  await cache.flush()
  if (await cache.has('a') || await cache.has('b')) throw new Error('flush failed')
})

await test('@stacksjs/cache', 'set with complex objects', async () => {
  const { createCache } = await import('@stacksjs/cache')
  const cache = createCache({ driver: 'memory' })
  await cache.set('obj', { users: [{ id: 1, name: 'Alice' }], count: 42 })
  const val = await cache.get<{ users: any[]; count: number }>('obj')
  if (!val) throw new Error('obj is null')
  if (val.count !== 42) throw new Error(`count=${val.count}`)
  if (val.users[0].name !== 'Alice') throw new Error(`name=${val.users[0].name}`)
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

// ─── @stacksjs/testing ──────────────────────────────────────
section('@stacksjs/testing')

await test('@stacksjs/testing', 'renderTemplate interpolates variables', async () => {
  const { renderTemplate } = await import('@stacksjs/testing')
  const r = renderTemplate('<h1>{{ title }}</h1>', { title: 'Hello' })
  if (!r.html.includes('Hello')) throw new Error('interpolation failed')
})

await test('@stacksjs/testing', 'renderTemplate contains()', async () => {
  const { renderTemplate } = await import('@stacksjs/testing')
  const r = renderTemplate('<p>Hello World</p>')
  if (!r.contains('Hello World')) throw new Error('contains failed')
  if (r.contains('Goodbye')) throw new Error('false positive')
})

await test('@stacksjs/testing', 'renderTemplate hasElement()', async () => {
  const { renderTemplate } = await import('@stacksjs/testing')
  const r = renderTemplate('<div><span>x</span></div>')
  if (!r.hasElement('span')) throw new Error('should have span')
  if (r.hasElement('table')) throw new Error('should not have table')
})

await test('@stacksjs/testing', 'createTestRequest defaults', async () => {
  const { createTestRequest } = await import('@stacksjs/testing')
  const req = createTestRequest()
  if (req.method !== 'GET') throw new Error(`method=${req.method}`)
  if (!req.url) throw new Error('url missing')
})

await test('@stacksjs/testing', 'createTestRequest overrides', async () => {
  const { createTestRequest } = await import('@stacksjs/testing')
  const req = createTestRequest({ method: 'POST', url: '/api/users' })
  if (req.method !== 'POST') throw new Error(`method=${req.method}`)
  if (req.url !== '/api/users') throw new Error(`url=${req.url}`)
})

await test('@stacksjs/testing', 'createTestResponse isOk()', async () => {
  const { createTestResponse } = await import('@stacksjs/testing')
  if (!createTestResponse({ status: 200 }).isOk()) throw new Error('200 should be ok')
  if (!createTestResponse({ status: 201 }).isOk()) throw new Error('201 should be ok')
  if (createTestResponse({ status: 404 }).isOk()) throw new Error('404 should not be ok')
})

await test('@stacksjs/testing', 'testLoader with params', async () => {
  const { testLoader } = await import('@stacksjs/testing')
  const data = await testLoader(
    { handler: async (ctx: any) => ({ id: ctx.params?.id }) },
    { params: { id: '99' } },
  )
  if (data.id !== '99') throw new Error(`id=${data.id}`)
})

await test('@stacksjs/testing', 'assertContains passes for match', async () => {
  const { assertContains } = await import('@stacksjs/testing')
  assertContains('<p>hello world</p>', 'hello') // should not throw
})

await test('@stacksjs/testing', 'assertHasElement passes for match', async () => {
  const { assertHasElement } = await import('@stacksjs/testing')
  assertHasElement('<div><img src="x" /></div>', 'img') // should not throw
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

// ─── @stacksjs/image ────────────────────────────────────────
section('@stacksjs/image')

await test('@stacksjs/image', 'generateImageTag basic', async () => {
  const { generateImageTag } = await import('@stacksjs/image')
  const img = generateImageTag({ src: '/hero.jpg', alt: 'Hero' })
  if (!img.includes('<img')) throw new Error('no img tag')
  if (!img.includes('src="/hero.jpg"')) throw new Error('src missing')
  if (!img.includes('alt="Hero"')) throw new Error('alt missing')
})

await test('@stacksjs/image', 'generateImageTag with lazy loading', async () => {
  const { generateImageTag } = await import('@stacksjs/image')
  const img = generateImageTag({ src: '/hero.jpg', alt: 'Hero', lazy: true })
  if (!img.includes('loading="lazy"')) throw new Error('lazy missing')
})

await test('@stacksjs/image', 'generateImageTag with class', async () => {
  const { generateImageTag } = await import('@stacksjs/image')
  const img = generateImageTag({ src: '/hero.jpg', alt: 'Hero', class: 'rounded' })
  if (!img.includes('class="rounded"')) throw new Error('class missing')
})

await test('@stacksjs/image', 'generatePictureTag with formats', async () => {
  const { generatePictureTag } = await import('@stacksjs/image')
  const pic = generatePictureTag({ src: '/hero.jpg', alt: 'Hero', formats: ['webp', 'avif'] })
  if (!pic.includes('<picture')) throw new Error('no picture tag')
  if (!pic.includes('<source')) throw new Error('no source tag')
  if (!pic.includes('<img')) throw new Error('no fallback img')
})

await test('@stacksjs/image', 'buildSrcSet', async () => {
  const { buildSrcSet } = await import('@stacksjs/image')
  const srcset = buildSrcSet([
    { path: '/img-640.webp', width: 640 },
    { path: '/img-1024.webp', width: 1024 },
  ])
  if (!srcset.includes('640w')) throw new Error('640w missing')
  if (!srcset.includes('1024w')) throw new Error('1024w missing')
})

await test('@stacksjs/image', 'buildSizes', async () => {
  const { buildSizes } = await import('@stacksjs/image')
  const sizes = buildSizes([{ width: 640 }, { width: 1024 }])
  if (!sizes.includes('640px')) throw new Error('640px missing')
})

await test('@stacksjs/image', 'generateBlurDataUrl returns data URI', async () => {
  const { generateBlurDataUrl } = await import('@stacksjs/image')
  const blur = generateBlurDataUrl()
  if (!blur.startsWith('data:')) throw new Error('not a data URL')
})

await test('@stacksjs/image', 'processImageDirective replaces @img', async () => {
  const { processImageDirective } = await import('@stacksjs/image')
  const html = processImageDirective('<div>@img(\'photo.jpg\', { alt: \'Photo\' })</div>')
  if (html.includes('@img')) throw new Error('directive not replaced')
  if (!html.includes('<img') && !html.includes('<picture')) throw new Error('no output tag')
})

await test('@stacksjs/image', 'getImageMetadata detects PNG', async () => {
  const { getImageMetadata } = await import('@stacksjs/image')
  const png = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, ...new Array(50).fill(0)])
  const meta = getImageMetadata(png)
  if (meta.format !== 'png') throw new Error(`format=${meta.format}`)
})

await test('@stacksjs/image', 'getImageMetadata detects JPEG', async () => {
  const { getImageMetadata } = await import('@stacksjs/image')
  const jpg = Buffer.from([0xFF, 0xD8, 0xFF, ...new Array(50).fill(0)])
  const meta = getImageMetadata(jpg)
  if (meta.format !== 'jpg' && meta.format !== 'jpeg') throw new Error(`format=${meta.format}`)
})

// ═══════════════════════════════════════════════════════════════
// Phase 4: Ecosystem
// ═══════════════════════════════════════════════════════════════

console.log('\n── Phase 4 — Ecosystem ──')

// ─── @stacksjs/realtime ─────────────────────────────────────
section('@stacksjs/realtime')

await test('@stacksjs/realtime', 'Channel on/emit', async () => {
  const { createChannel } = await import('@stacksjs/realtime')
  const ch = createChannel('test')
  const msgs: string[] = []
  ch.on<string>('msg', (m) => msgs.push(m.data))
  ch.emit('msg', 'hello')
  ch.emit('msg', 'world')
  if (msgs.length !== 2) throw new Error(`msgs=${msgs.length}`)
  ch.destroy()
})

await test('@stacksjs/realtime', 'Channel unsubscribe', async () => {
  const { createChannel } = await import('@stacksjs/realtime')
  const ch = createChannel('unsub-test')
  let count = 0
  const unsub = ch.on('tick', () => { count++ })
  ch.emit('tick', null)
  unsub()
  ch.emit('tick', null)
  if (count !== 1) throw new Error(`count=${count}`)
  ch.destroy()
})

await test('@stacksjs/realtime', 'Channel once fires only once', async () => {
  const { createChannel } = await import('@stacksjs/realtime')
  const ch = createChannel('once-test')
  let count = 0
  ch.once('ping', () => { count++ })
  ch.emit('ping', null)
  ch.emit('ping', null)
  ch.emit('ping', null)
  if (count !== 1) throw new Error(`count=${count}`)
  ch.destroy()
})

await test('@stacksjs/realtime', 'Channel listenerCount', async () => {
  const { createChannel } = await import('@stacksjs/realtime')
  const ch = createChannel('count-test')
  ch.on('a', () => {})
  ch.on('a', () => {})
  ch.on('b', () => {})
  if (ch.listenerCount('a') !== 2) throw new Error(`a=${ch.listenerCount('a')}`)
  if (ch.listenerCount('b') !== 1) throw new Error(`b=${ch.listenerCount('b')}`)
  ch.destroy()
})

await test('@stacksjs/realtime', 'Channel removeAllListeners', async () => {
  const { createChannel } = await import('@stacksjs/realtime')
  const ch = createChannel('remove-test')
  ch.on('x', () => {})
  ch.on('x', () => {})
  ch.removeAllListeners('x')
  if (ch.listenerCount('x') !== 0) throw new Error('listeners not removed')
  ch.destroy()
})

await test('@stacksjs/realtime', 'BroadcastManager manages channels', async () => {
  const { BroadcastManager } = await import('@stacksjs/realtime')
  const bm = new BroadcastManager()
  bm.channel('room1')
  bm.channel('room2')
  bm.channel('room1') // reuse
  if (bm.getChannels().length !== 2) throw new Error(`count=${bm.getChannels().length}`)
  bm.disconnect()
})

await test('@stacksjs/realtime', 'PresenceChannel join/leave/count', async () => {
  const { PresenceChannel } = await import('@stacksjs/realtime')
  const p = new PresenceChannel({ name: 'lobby', presence: true })
  p.join('u1', { name: 'Alice' })
  p.join('u2', { name: 'Bob' })
  p.join('u3', { name: 'Charlie' })
  if (p.count() !== 3) throw new Error(`count=${p.count()}`)
  p.leave('u2')
  if (p.count() !== 2) throw new Error(`after leave=${p.count()}`)
  if (!p.isMember('u1')) throw new Error('u1 should be member')
  if (p.isMember('u2')) throw new Error('u2 should not be member')
  p.destroy()
})

await test('@stacksjs/realtime', 'PresenceChannel getMembers', async () => {
  const { PresenceChannel } = await import('@stacksjs/realtime')
  const p = new PresenceChannel({ name: 'room', presence: true })
  p.join('u1', { role: 'admin' })
  p.join('u2', { role: 'user' })
  const members = p.getMembers()
  if (members.length !== 2) throw new Error(`members=${members.length}`)
  p.destroy()
})

await test('@stacksjs/realtime', 'SSEStream send and toResponse', async () => {
  const { createSSEStream } = await import('@stacksjs/realtime')
  const sse = createSSEStream()
  sse.send('update', { count: 1 })
  sse.send('update', { count: 2 })
  sse.close()
  // Just verify it doesn't throw
})

// ─── @stacksjs/queue ────────────────────────────────────────
section('@stacksjs/queue')

await test('@stacksjs/queue', 'defineJob with defaults', async () => {
  const { defineJob } = await import('@stacksjs/queue')
  const job = defineJob({ name: 'test-job', handle: async () => {} })
  if (job.name !== 'test-job') throw new Error(`name=${job.name}`)
  if (job.retries !== 3) throw new Error(`retries=${job.retries}`)
})

await test('@stacksjs/queue', 'defineJob with custom config', async () => {
  const { defineJob } = await import('@stacksjs/queue')
  const job = defineJob({ name: 'custom', handle: async () => {}, retries: 5, backoff: 2000, timeout: 60000 })
  if (job.retries !== 5) throw new Error(`retries=${job.retries}`)
  if (job.backoff !== 2000) throw new Error(`backoff=${job.backoff}`)
})

await test('@stacksjs/queue', 'dispatch and count', async () => {
  const { defineJob, createQueue } = await import('@stacksjs/queue')
  const job = defineJob({ name: 'count-test', handle: async () => {} })
  const queue = createQueue()
  queue.register(job)
  await queue.dispatch(job, { x: 1 })
  await queue.dispatch(job, { x: 2 })
  const count = await queue.count()
  if (count !== 2) throw new Error(`count=${count}`)
  await queue.clear()
})

await test('@stacksjs/queue', 'Worker processNext runs job', async () => {
  const { defineJob, createQueue, Worker } = await import('@stacksjs/queue')
  const results: number[] = []
  const job = defineJob({ name: 'worker-test', handle: async (d: any) => { results.push(d.n) } })
  const queue = createQueue()
  queue.register(job)
  await queue.dispatch(job, { n: 1 })
  await queue.dispatch(job, { n: 2 })
  const worker = new Worker(queue)
  await worker.processNext()
  await worker.processNext()
  if (results.length !== 2) throw new Error(`results=${results.length}`)
  if (worker.getStats().processed !== 2) throw new Error(`processed=${worker.getStats().processed}`)
  await queue.clear()
})

await test('@stacksjs/queue', 'Worker handles job failure', async () => {
  const { defineJob, createQueue, Worker } = await import('@stacksjs/queue')
  const job = defineJob({ name: 'fail-test', handle: async () => { throw new Error('boom') }, retries: 1 })
  const queue = createQueue()
  queue.register(job)
  await queue.dispatch(job, {})
  const worker = new Worker(queue)
  await worker.processNext()
  if (worker.getStats().failed !== 1) throw new Error(`failed=${worker.getStats().failed}`)
  await queue.clear()
})

await test('@stacksjs/queue', 'getJob retrieves dispatched job', async () => {
  const { defineJob, createQueue } = await import('@stacksjs/queue')
  const job = defineJob({ name: 'get-test', handle: async () => {} })
  const queue = createQueue()
  queue.register(job)
  const id = await queue.dispatch(job, { key: 'value' })
  const retrieved = await queue.getJob(id)
  if (!retrieved) throw new Error('job not found')
  if (retrieved.name !== 'get-test') throw new Error(`name=${retrieved.name}`)
  await queue.clear()
})

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

// ─── @stacksjs/analytics ────────────────────────────────────
section('@stacksjs/analytics')

await test('@stacksjs/analytics', 'trackPageView creates page view', async () => {
  const { configureAnalytics, trackPageView, MemoryAnalyticsStorage, resetAnalytics } = await import('@stacksjs/analytics')
  const storage = new MemoryAnalyticsStorage()
  configureAnalytics({ storage })
  const pv = await trackPageView({ path: '/home', sessionId: 's1' })
  if (!pv.id) throw new Error('id missing')
  if (pv.path !== '/home') throw new Error(`path=${pv.path}`)
  resetAnalytics()
})

await test('@stacksjs/analytics', 'trackEvent creates event', async () => {
  const { configureAnalytics, trackEvent, MemoryAnalyticsStorage, resetAnalytics } = await import('@stacksjs/analytics')
  const storage = new MemoryAnalyticsStorage()
  configureAnalytics({ storage })
  const ev = await trackEvent('signup', { plan: 'pro' })
  if (!ev.id) throw new Error('id missing')
  if (ev.name !== 'signup') throw new Error(`name=${ev.name}`)
  resetAnalytics()
})

await test('@stacksjs/analytics', 'getAnalytics computes stats', async () => {
  const { configureAnalytics, trackPageView, trackEvent, getAnalytics, MemoryAnalyticsStorage, resetAnalytics } = await import('@stacksjs/analytics')
  const storage = new MemoryAnalyticsStorage()
  configureAnalytics({ storage })
  await trackPageView({ path: '/', sessionId: 's1' })
  await trackPageView({ path: '/about', sessionId: 's1' })
  await trackPageView({ path: '/', sessionId: 's2' })
  await trackEvent('click', { target: 'cta' })
  const stats = await getAnalytics()
  if (stats.totalPageViews !== 3) throw new Error(`views=${stats.totalPageViews}`)
  if (stats.uniqueVisitors < 2) throw new Error(`visitors=${stats.uniqueVisitors}`)
  if (stats.topPages.length < 2) throw new Error(`topPages=${stats.topPages.length}`)
  resetAnalytics()
})

await test('@stacksjs/analytics', 'shouldTrack respects ignorePaths', async () => {
  const { shouldTrack, MemoryAnalyticsStorage } = await import('@stacksjs/analytics')
  const config = { storage: new MemoryAnalyticsStorage(), ignorePaths: ['/health', '/api/*'] } as any
  if (!shouldTrack('/blog', config)) throw new Error('/blog should track')
  if (shouldTrack('/health', config)) throw new Error('/health should not track')
  if (shouldTrack('/api/users', config)) throw new Error('/api/* should not track')
})

await test('@stacksjs/analytics', 'processAnalyticsDirective', async () => {
  const { processAnalyticsDirective } = await import('@stacksjs/analytics')
  const html = processAnalyticsDirective('<body>@analytics</body>')
  if (html.includes('@analytics')) throw new Error('not replaced')
  if (!html.includes('<script')) throw new Error('no script')
})

await test('@stacksjs/analytics', 'generateTrackingScript', async () => {
  const { generateTrackingScript } = await import('@stacksjs/analytics')
  const script = generateTrackingScript()
  if (!script.includes('script')) throw new Error('no script tag')
})

await test('@stacksjs/analytics', 'MemoryAnalyticsStorage clear and count', async () => {
  const { configureAnalytics, trackPageView, MemoryAnalyticsStorage, resetAnalytics } = await import('@stacksjs/analytics')
  const storage = new MemoryAnalyticsStorage()
  configureAnalytics({ storage })
  await trackPageView({ path: '/' })
  await trackPageView({ path: '/about' })
  if (await storage.count() !== 2) throw new Error(`count=${await storage.count()}`)
  await storage.clear()
  if (await storage.count() !== 0) throw new Error('clear failed')
  resetAnalytics()
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
