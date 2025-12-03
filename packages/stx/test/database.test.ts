import { describe, expect, test, beforeEach, afterEach, afterAll } from 'bun:test'
import { unlinkSync, existsSync } from 'node:fs'
import {
  configureDatabase,
  getDatabaseConfig,
  resetDatabaseConfig,
  query,
  table,
  raw,
  QueryBuilder,
  defineModel,
  getModel,
  hasModel,
  transaction,
  clearQueryCache,
  getQueryCacheStats,
  getQueryLog,
  clearQueryLog,
  enableQueryLogging,
  schema,
  Blueprint,
  processDbDirective,
  processModelDirective,
  processQueryDirective,
  processDatabaseDirectives,
  DatabaseError,
} from '../src/database'
import type { StxOptions } from '../src/types'

const TEST_DB = './test-database.db'

const defaultOptions: StxOptions = {
  debug: false,
}

describe('database', () => {
  beforeEach(() => {
    resetDatabaseConfig()
    clearQueryLog()
    clearQueryCache()

    // Configure test database
    configureDatabase({
      default: 'sqlite',
      connections: {
        sqlite: { driver: 'sqlite', database: TEST_DB },
      },
      logging: true,
    })
  })

  afterEach(async () => {
    resetDatabaseConfig()
  })

  afterAll(() => {
    // Clean up test database
    if (existsSync(TEST_DB)) {
      try {
        unlinkSync(TEST_DB)
      }
      catch {
        // Ignore cleanup errors
      }
    }
  })

  describe('configuration', () => {
    test('configureDatabase sets configuration', () => {
      configureDatabase({
        default: 'postgres',
        connections: {
          postgres: { driver: 'postgres', database: 'test', host: 'localhost' },
        },
      })

      const config = getDatabaseConfig()
      expect(config.default).toBe('postgres')
      expect(config.connections.postgres).toBeDefined()
    })

    test('resetDatabaseConfig restores defaults', () => {
      configureDatabase({
        default: 'mysql',
        cacheTTL: 3600,
      })

      resetDatabaseConfig()

      const config = getDatabaseConfig()
      expect(config.default).toBe('sqlite')
      expect(config.cacheTTL).toBe(0)
    })
  })

  describe('QueryBuilder', () => {
    test('creates query builder for table', () => {
      const qb = query('users')
      expect(qb).toBeInstanceOf(QueryBuilder)
    })

    test('table() is alias for query()', () => {
      const qb = table('posts')
      expect(qb).toBeInstanceOf(QueryBuilder)
    })

    test('generates simple SELECT', () => {
      const { sql, bindings } = query('users').toSql()
      expect(sql).toBe('SELECT * FROM users')
      expect(bindings).toEqual([])
    })

    test('generates SELECT with columns', () => {
      const { sql } = query('users').select('id', 'name', 'email').toSql()
      expect(sql).toBe('SELECT id, name, email FROM users')
    })

    test('generates SELECT DISTINCT', () => {
      const { sql } = query('users').distinct().select('country').toSql()
      expect(sql).toBe('SELECT DISTINCT country FROM users')
    })

    test('generates WHERE clause', () => {
      const { sql, bindings } = query('users').where('active', true).toSql()
      expect(sql).toBe('SELECT * FROM users WHERE active = ?')
      expect(bindings).toEqual([true])
    })

    test('generates WHERE with operator', () => {
      const { sql, bindings } = query('users').where('age', '>=', 18).toSql()
      expect(sql).toBe('SELECT * FROM users WHERE age >= ?')
      expect(bindings).toEqual([18])
    })

    test('generates multiple WHERE clauses', () => {
      const { sql, bindings } = query('users')
        .where('active', true)
        .where('role', 'admin')
        .toSql()

      expect(sql).toBe('SELECT * FROM users WHERE active = ? AND role = ?')
      expect(bindings).toEqual([true, 'admin'])
    })

    test('generates OR WHERE clause', () => {
      const { sql, bindings } = query('users')
        .where('role', 'admin')
        .orWhere('role', 'superadmin')
        .toSql()

      expect(sql).toBe('SELECT * FROM users WHERE role = ? OR role = ?')
      expect(bindings).toEqual(['admin', 'superadmin'])
    })

    test('generates WHERE IN clause', () => {
      const { sql, bindings } = query('users')
        .whereIn('status', ['active', 'pending'])
        .toSql()

      expect(sql).toBe('SELECT * FROM users WHERE status IN (?, ?)')
      expect(bindings).toEqual(['active', 'pending'])
    })

    test('generates WHERE NOT IN clause', () => {
      const { sql, bindings } = query('users')
        .whereNotIn('role', ['banned', 'suspended'])
        .toSql()

      expect(sql).toBe('SELECT * FROM users WHERE role NOT IN (?, ?)')
      expect(bindings).toEqual(['banned', 'suspended'])
    })

    test('generates WHERE NULL clause', () => {
      const { sql } = query('users').whereNull('deleted_at').toSql()
      expect(sql).toBe('SELECT * FROM users WHERE deleted_at IS NULL')
    })

    test('generates WHERE NOT NULL clause', () => {
      const { sql } = query('users').whereNotNull('email_verified_at').toSql()
      expect(sql).toBe('SELECT * FROM users WHERE email_verified_at IS NOT NULL')
    })

    test('generates WHERE BETWEEN clause', () => {
      const { sql, bindings } = query('users')
        .whereBetween('age', 18, 65)
        .toSql()

      expect(sql).toBe('SELECT * FROM users WHERE age BETWEEN ? AND ?')
      expect(bindings).toEqual([18, 65])
    })

    test('generates WHERE LIKE clause', () => {
      const { sql, bindings } = query('users')
        .whereLike('email', '%@gmail.com')
        .toSql()

      expect(sql).toBe('SELECT * FROM users WHERE email like ?')
      expect(bindings).toEqual(['%@gmail.com'])
    })

    test('generates ORDER BY clause', () => {
      const { sql } = query('users').orderBy('created_at', 'desc').toSql()
      expect(sql).toBe('SELECT * FROM users ORDER BY created_at DESC')
    })

    test('generates multiple ORDER BY clauses', () => {
      const { sql } = query('users')
        .orderBy('role')
        .orderByDesc('created_at')
        .toSql()

      expect(sql).toBe('SELECT * FROM users ORDER BY role ASC, created_at DESC')
    })

    test('generates GROUP BY clause', () => {
      const { sql } = query('orders')
        .select('status', raw('COUNT(*) as count'))
        .groupBy('status')
        .toSql()

      expect(sql).toBe('SELECT status, COUNT(*) as count FROM orders GROUP BY status')
    })

    test('generates LIMIT clause', () => {
      const { sql } = query('users').limit(10).toSql()
      expect(sql).toBe('SELECT * FROM users LIMIT 10')
    })

    test('generates OFFSET clause', () => {
      const { sql } = query('users').limit(10).offset(20).toSql()
      expect(sql).toBe('SELECT * FROM users LIMIT 10 OFFSET 20')
    })

    test('forPage generates correct pagination', () => {
      const { sql } = query('users').forPage(3, 15).toSql()
      expect(sql).toBe('SELECT * FROM users LIMIT 15 OFFSET 30')
    })

    test('generates JOIN clause', () => {
      const { sql } = query('users')
        .join('profiles', 'users.id', '=', 'profiles.user_id')
        .toSql()

      expect(sql).toBe('SELECT * FROM users INNER JOIN profiles ON users.id = profiles.user_id')
    })

    test('generates LEFT JOIN clause', () => {
      const { sql } = query('users')
        .leftJoin('posts', 'users.id', '=', 'posts.author_id')
        .toSql()

      expect(sql).toBe('SELECT * FROM users LEFT JOIN posts ON users.id = posts.author_id')
    })

    test('clone creates independent copy', () => {
      const original = query('users').where('active', true)
      const clone = original.clone().where('role', 'admin')

      const { sql: originalSql } = original.toSql()
      const { sql: cloneSql } = clone.toSql()

      expect(originalSql).toBe('SELECT * FROM users WHERE active = ?')
      expect(cloneSql).toBe('SELECT * FROM users WHERE active = ? AND role = ?')
    })
  })

  describe('raw expressions', () => {
    test('creates raw expression', () => {
      const expr = raw('NOW()')
      expect(expr.__raw).toBe(true)
      expect(expr.sql).toBe('NOW()')
    })

    test('raw expression with bindings', () => {
      const expr = raw('DATE_ADD(?, INTERVAL 1 DAY)', ['2024-01-01'])
      expect(expr.bindings).toEqual(['2024-01-01'])
    })
  })

  describe('models', () => {
    test('defineModel creates a model', () => {
      const User = defineModel('User', {
        table: 'users',
        primaryKey: 'id',
        fillable: ['name', 'email'],
      })

      expect(User.name).toBe('User')
      expect(User.definition.table).toBe('users')
    })

    test('getModel retrieves defined model', () => {
      defineModel('Post', {
        table: 'posts',
      })

      const Post = getModel('Post')
      expect(Post.name).toBe('Post')
    })

    test('getModel throws for undefined model', () => {
      expect(() => getModel('NonExistent')).toThrow('Model "NonExistent" not defined')
    })

    test('hasModel checks if model exists', () => {
      defineModel('Comment', { table: 'comments' })

      expect(hasModel('Comment')).toBe(true)
      expect(hasModel('Unknown')).toBe(false)
    })

    test('model.query returns QueryBuilder', () => {
      const Article = defineModel('Article', { table: 'articles' })
      const qb = Article.query()

      expect(qb).toBeInstanceOf(QueryBuilder)
    })

    test('model.where starts a query', () => {
      const Tag = defineModel('Tag', { table: 'tags' })
      const qb = Tag.where('active', true)

      const { sql } = qb.toSql()
      expect(sql).toBe('SELECT * FROM tags WHERE active = ?')
    })
  })

  describe('schema builder', () => {
    test('Blueprint generates column definitions', () => {
      const blueprint = new Blueprint('test_table')
      blueprint
        .id()
        .string('name')
        .text('description')
        .integer('count')
        .boolean('active')
        .timestamps()

      const sql = blueprint.toCreateSQL()
      expect(sql).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT')
      expect(sql).toContain('name VARCHAR(255)')
      expect(sql).toContain('description TEXT')
      expect(sql).toContain('count INTEGER')
      expect(sql).toContain('active BOOLEAN DEFAULT 0')
      expect(sql).toContain('created_at DATETIME')
      expect(sql).toContain('updated_at DATETIME')
    })

    test('Blueprint supports custom string length', () => {
      const blueprint = new Blueprint('test')
      blueprint.string('short_name', 50)

      const sql = blueprint.toCreateSQL()
      expect(sql).toContain('short_name VARCHAR(50)')
    })

    test('Blueprint supports softDeletes', () => {
      const blueprint = new Blueprint('test')
      blueprint.softDeletes()

      const sql = blueprint.toCreateSQL()
      expect(sql).toContain('deleted_at DATETIME')
    })

    test('Blueprint supports json column', () => {
      const blueprint = new Blueprint('test')
      blueprint.json('metadata')

      const sql = blueprint.toCreateSQL()
      expect(sql).toContain('metadata TEXT')
    })

    test('Blueprint supports foreignId', () => {
      const blueprint = new Blueprint('test')
      blueprint.foreignId('user_id')

      const sql = blueprint.toCreateSQL()
      expect(sql).toContain('user_id INTEGER')
    })

    test('Blueprint generates index SQL', () => {
      const blueprint = new Blueprint('users')
      blueprint.index('email')
      blueprint.unique(['first_name', 'last_name'])

      const indices = blueprint.getIndexSQL()
      expect(indices).toContain('CREATE INDEX idx_users_email ON users (email)')
      expect(indices).toContain('CREATE UNIQUE INDEX uniq_users_first_name_last_name ON users (first_name, last_name)')
    })

    test('schema returns SchemaBuilder', () => {
      const sb = schema()
      expect(sb).toBeDefined()
      expect(typeof sb.create).toBe('function')
      expect(typeof sb.drop).toBe('function')
    })
  })

  describe('caching', () => {
    test('clearQueryCache clears cache', () => {
      clearQueryCache()
      const stats = getQueryCacheStats()
      expect(stats.size).toBe(0)
    })

    test('getQueryCacheStats returns cache info', () => {
      clearQueryCache()
      const stats = getQueryCacheStats()
      expect(stats.size).toBe(0)
      expect(stats.keys).toEqual([])
    })
  })

  describe('logging', () => {
    test('enableQueryLogging toggles logging', () => {
      enableQueryLogging(true)
      expect(getDatabaseConfig().logging).toBe(true)

      enableQueryLogging(false)
      expect(getDatabaseConfig().logging).toBe(false)
    })

    test('getQueryLog returns logged queries', () => {
      const log = getQueryLog()
      expect(Array.isArray(log)).toBe(true)
    })

    test('clearQueryLog clears log', () => {
      clearQueryLog()
      const log = getQueryLog()
      expect(log.length).toBe(0)
    })
  })

  describe('DatabaseError', () => {
    test('creates error with message', () => {
      const error = new DatabaseError('Query failed')
      expect(error.message).toBe('Query failed')
      expect(error.name).toBe('DatabaseError')
    })

    test('includes sql and bindings', () => {
      const error = new DatabaseError(
        'Query failed',
        'SELECT * FROM users WHERE id = ?',
        [1],
      )

      expect(error.sql).toBe('SELECT * FROM users WHERE id = ?')
      expect(error.bindings).toEqual([1])
    })
  })

  describe('template directives', () => {
    test('processDbDirective extracts table queries', async () => {
      const template = `@db('users')->where('active', true)->get()`
      const context: Record<string, any> = {}

      // This will fail without actual DB but tests the parsing
      const result = await processDbDirective(template, context, 'test.stx', defaultOptions)

      // Should have processed the directive (may have error comment if no DB)
      expect(result).not.toContain('@db(')
    })

    test('processModelDirective extracts model queries', async () => {
      defineModel('TestUser', { table: 'test_users' })

      const template = `@model('TestUser')->find(1)`
      const context: Record<string, any> = {}

      const result = await processModelDirective(template, context, 'test.stx', defaultOptions)

      // Should have processed the directive
      expect(result).not.toContain('@model(')
    })

    test('processQueryDirective extracts raw queries', async () => {
      const template = `@query('SELECT 1 as test') as $result`
      const context: Record<string, any> = {}

      const result = await processQueryDirective(template, context, 'test.stx', defaultOptions)

      // Should have processed the directive
      expect(result).not.toContain('@query(')
    })

    test('processDatabaseDirectives handles all directives', async () => {
      const template = `
        @db('posts')->limit(5)->get()
        @query('SELECT COUNT(*) FROM users') as $count
      `
      const context: Record<string, any> = {}

      const result = await processDatabaseDirectives(template, context, 'test.stx', defaultOptions)

      // Should have processed all directives
      expect(result).not.toContain('@db(')
      expect(result).not.toContain('@query(')
    })
  })

  describe('database operations with SQLite', () => {
    beforeEach(async () => {
      // Create test table
      await schema().create('test_users', (table) => {
        table.id()
        table.string('name')
        table.string('email')
        table.boolean('active')
        table.timestamps()
      })
    })

    afterEach(async () => {
      try {
        await schema().drop('test_users')
      }
      catch {
        // Ignore if table doesn't exist
      }
    })

    test('insert and get records', async () => {
      await query('test_users').insert({
        name: 'John Doe',
        email: 'john@example.com',
        active: true,
      })

      const users = await query('test_users').get()
      expect(users.length).toBe(1)
      expect(users[0].name).toBe('John Doe')
    })

    test('insert multiple records', async () => {
      await query('test_users').insertAll([
        { name: 'Alice', email: 'alice@example.com', active: true },
        { name: 'Bob', email: 'bob@example.com', active: false },
      ])

      const count = await query('test_users').count()
      expect(count).toBe(2)
    })

    test('update records', async () => {
      await query('test_users').insert({
        name: 'Jane',
        email: 'jane@example.com',
        active: false,
      })

      const affected = await query('test_users')
        .where('email', 'jane@example.com')
        .update({ active: true })

      expect(affected).toBe(1)

      const user = await query('test_users')
        .where('email', 'jane@example.com')
        .first()

      expect(user?.active).toBe(1) // SQLite returns 1 for true
    })

    test('delete records', async () => {
      await query('test_users').insert({
        name: 'Delete Me',
        email: 'delete@example.com',
        active: true,
      })

      const deleted = await query('test_users')
        .where('email', 'delete@example.com')
        .delete()

      expect(deleted).toBe(1)

      const remaining = await query('test_users').count()
      expect(remaining).toBe(0)
    })

    test('first returns single record', async () => {
      await query('test_users').insert({
        name: 'First User',
        email: 'first@example.com',
        active: true,
      })

      const user = await query('test_users').first()
      expect(user).not.toBeNull()
      expect(user?.name).toBe('First User')
    })

    test('first returns null when no records', async () => {
      const user = await query('test_users').first()
      expect(user).toBeNull()
    })

    test('find by primary key', async () => {
      const id = await query('test_users').insert({
        name: 'Find Me',
        email: 'find@example.com',
        active: true,
      })

      const user = await query('test_users').find(id)
      expect(user).not.toBeNull()
      expect(user?.name).toBe('Find Me')
    })

    test('exists returns true when records exist', async () => {
      await query('test_users').insert({
        name: 'Exists',
        email: 'exists@example.com',
        active: true,
      })

      const exists = await query('test_users').exists()
      expect(exists).toBe(true)
    })

    test('exists returns false when no records', async () => {
      const exists = await query('test_users').exists()
      expect(exists).toBe(false)
    })

    test('pluck returns column values', async () => {
      await query('test_users').insertAll([
        { name: 'User 1', email: 'user1@example.com', active: true },
        { name: 'User 2', email: 'user2@example.com', active: true },
      ])

      const names = await query('test_users').pluck('name')
      expect(names).toContain('User 1')
      expect(names).toContain('User 2')
    })

    test('value returns single column value', async () => {
      await query('test_users').insert({
        name: 'Value Test',
        email: 'value@example.com',
        active: true,
      })

      const name = await query('test_users').value('name')
      expect(name).toBe('Value Test')
    })

    test('increment increases value', async () => {
      // Create table with numeric column
      await schema().create('test_counters', (table) => {
        table.id()
        table.string('name')
        table.integer('count')
      })

      await query('test_counters').insert({ name: 'test', count: 5 })
      await query('test_counters').where('name', 'test').increment('count', 3)

      const counter = await query('test_counters').first()
      expect(counter?.count).toBe(8)

      await schema().drop('test_counters')
    })

    test('decrement decreases value', async () => {
      await schema().create('test_counters2', (table) => {
        table.id()
        table.string('name')
        table.integer('count')
      })

      await query('test_counters2').insert({ name: 'test', count: 10 })
      await query('test_counters2').where('name', 'test').decrement('count', 4)

      const counter = await query('test_counters2').first()
      expect(counter?.count).toBe(6)

      await schema().drop('test_counters2')
    })

    test('truncate removes all records', async () => {
      await query('test_users').insertAll([
        { name: 'User 1', email: 'u1@example.com', active: true },
        { name: 'User 2', email: 'u2@example.com', active: true },
      ])

      await query('test_users').truncate()

      const count = await query('test_users').count()
      expect(count).toBe(0)
    })

    test('aggregate functions work', async () => {
      await schema().create('test_products', (table) => {
        table.id()
        table.string('name')
        table.integer('price')
      })

      await query('test_products').insertAll([
        { name: 'A', price: 10 },
        { name: 'B', price: 20 },
        { name: 'C', price: 30 },
      ])

      const sum = await query('test_products').sum('price')
      expect(sum).toBe(60)

      const max = await query('test_products').max('price')
      expect(max).toBe(30)

      const min = await query('test_products').min('price')
      expect(min).toBe(10)

      const avg = await query('test_products').avg('price')
      expect(avg).toBe(20)

      await schema().drop('test_products')
    })

    test('transaction commits on success', async () => {
      await transaction(async () => {
        await query('test_users').insert({
          name: 'Transaction User',
          email: 'tx@example.com',
          active: true,
        })
      })

      const user = await query('test_users')
        .where('email', 'tx@example.com')
        .first()

      expect(user).not.toBeNull()
    })

    test('transaction rolls back on error', async () => {
      try {
        await transaction(async () => {
          await query('test_users').insert({
            name: 'Rollback User',
            email: 'rollback@example.com',
            active: true,
          })
          throw new Error('Force rollback')
        })
      }
      catch {
        // Expected error
      }

      const user = await query('test_users')
        .where('email', 'rollback@example.com')
        .first()

      expect(user).toBeNull()
    })
  })

  describe('model operations with SQLite', () => {
    beforeEach(async () => {
      await schema().create('model_users', (table) => {
        table.id()
        table.string('name')
        table.string('email')
        table.boolean('active')
        table.timestamps()
      })

      defineModel('ModelUser', {
        table: 'model_users',
        fillable: ['name', 'email', 'active'],
        timestamps: true,
      })
    })

    afterEach(async () => {
      try {
        await schema().drop('model_users')
      }
      catch {
        // Ignore
      }
    })

    test('model.create inserts record', async () => {
      const User = getModel('ModelUser')

      const user = await User.create({
        name: 'Model User',
        email: 'model@example.com',
        active: true,
      })

      expect(user.get('name')).toBe('Model User')
      expect(user.exists).toBe(true)
    })

    test('model.find retrieves by primary key', async () => {
      const User = getModel('ModelUser')

      const created = await User.create({
        name: 'Find Model',
        email: 'findmodel@example.com',
        active: true,
      })

      const found = await User.find(created.get('id'))
      expect(found).not.toBeNull()
      expect(found?.get('name')).toBe('Find Model')
    })

    test('model.all retrieves all records', async () => {
      const User = getModel('ModelUser')

      await User.create({ name: 'User 1', email: 'u1@test.com', active: true })
      await User.create({ name: 'User 2', email: 'u2@test.com', active: false })

      const all = await User.all()
      expect(all.length).toBe(2)
    })

    test('model.count returns record count', async () => {
      const User = getModel('ModelUser')

      await User.create({ name: 'Count 1', email: 'c1@test.com', active: true })
      await User.create({ name: 'Count 2', email: 'c2@test.com', active: true })

      const count = await User.count()
      expect(count).toBe(2)
    })

    test('model instance save updates record', async () => {
      const User = getModel('ModelUser')

      const user = await User.create({
        name: 'Save Test',
        email: 'save@test.com',
        active: false,
      })

      user.set('active', true)
      user.set('name', 'Updated Name')
      await user.save()

      const refreshed = await User.find(user.get('id'))
      expect(refreshed?.get('name')).toBe('Updated Name')
      expect(refreshed?.get('active')).toBe(1) // SQLite boolean
    })

    test('model instance delete removes record', async () => {
      const User = getModel('ModelUser')

      const user = await User.create({
        name: 'Delete Test',
        email: 'delete@test.com',
        active: true,
      })

      const id = user.get('id')
      await user.delete()

      const found = await User.find(id)
      expect(found).toBeNull()
    })

    test('model.destroy deletes by id', async () => {
      const User = getModel('ModelUser')

      const user = await User.create({
        name: 'Destroy Test',
        email: 'destroy@test.com',
        active: true,
      })

      const deleted = await User.destroy(user.get('id'))
      expect(deleted).toBe(1)
    })

    test('model instance isDirty tracks changes', async () => {
      const User = getModel('ModelUser')

      const user = await User.create({
        name: 'Dirty Test',
        email: 'dirty@test.com',
        active: true,
      })

      expect(user.isDirty()).toBe(false)

      user.set('name', 'Changed Name')
      expect(user.isDirty()).toBe(true)
      expect(user.isDirty('name')).toBe(true)
      expect(user.isDirty('email')).toBe(false)
    })

    test('model instance toJSON returns attributes', async () => {
      const User = getModel('ModelUser')

      const user = await User.create({
        name: 'JSON Test',
        email: 'json@test.com',
        active: true,
      })

      const json = user.toJSON()
      expect(json.name).toBe('JSON Test')
      expect(json.email).toBe('json@test.com')
    })

    test('model instance refresh reloads from database', async () => {
      const User = getModel('ModelUser')

      const user = await User.create({
        name: 'Refresh Test',
        email: 'refresh@test.com',
        active: true,
      })

      // Update directly in database
      await query('model_users')
        .where('id', user.get('id'))
        .update({ name: 'Database Updated' })

      await user.refresh()
      expect(user.get('name')).toBe('Database Updated')
    })
  })
})
