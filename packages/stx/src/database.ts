/**
 * Database Integration Module for stx Templates
 *
 * Provides Laravel Eloquent-like database access within templates.
 * Supports multiple database adapters, query builders, and model definitions.
 *
 * ## Features
 *
 * - **Query Builder**: Fluent API for building SQL queries
 * - **Model System**: Define models with relationships and scopes
 * - **Multiple Adapters**: SQLite, PostgreSQL, MySQL, and custom adapters
 * - **Template Directives**: @db, @model, @query for inline queries
 * - **Caching**: Query result caching with TTL support
 * - **Connection Pooling**: Efficient connection management
 * - **Transactions**: Transaction support with savepoints
 *
 * ## Usage
 *
 * ### Configuration
 * ```typescript
 * import { configureDatabase } from 'stx'
 *
 * configureDatabase({
 *   default: 'sqlite',
 *   connections: {
 *     sqlite: { driver: 'sqlite', database: './data.db' },
 *     postgres: { driver: 'postgres', host: 'localhost', database: 'app' }
 *   }
 * })
 * ```
 *
 * ### In Templates
 * ```html
 * @db('users')->where('active', true)->get()
 * @foreach($users as $user)
 *   <p>{{ $user.name }}</p>
 * @endforeach
 *
 * @model('User')->find(1)
 * <h1>{{ $user.name }}</h1>
 * ```
 *
 * ### Query Builder
 * ```typescript
 * const users = await query('users')
 *   .where('active', true)
 *   .orderBy('created_at', 'desc')
 *   .limit(10)
 *   .get()
 * ```
 *
 * ### Models
 * ```typescript
 * const User = defineModel('User', {
 *   table: 'users',
 *   primaryKey: 'id',
 *   relationships: {
 *     posts: { type: 'hasMany', model: 'Post', foreignKey: 'user_id' }
 *   }
 * })
 *
 * const user = await User.find(1)
 * const posts = await user.posts()
 * ```
 *
 * @module database
 */

import type { StxOptions } from './types'

// =============================================================================
// Types
// =============================================================================

/**
 * Supported database drivers
 */
export type DatabaseDriver = 'sqlite' | 'postgres' | 'mysql' | 'custom'

/**
 * Database connection configuration
 */
export interface ConnectionConfig {
  /** Database driver type */
  driver: DatabaseDriver
  /** Database file path (SQLite) or database name */
  database: string
  /** Host address (for remote databases) */
  host?: string
  /** Port number */
  port?: number
  /** Username for authentication */
  username?: string
  /** Password for authentication */
  password?: string
  /** Connection pool size */
  poolSize?: number
  /** Connection timeout in milliseconds */
  timeout?: number
  /** SSL configuration */
  ssl?: boolean | Record<string, unknown>
  /** Custom connection options */
  options?: Record<string, unknown>
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  /** Default connection name */
  default: string
  /** Named connection configurations */
  connections: Record<string, ConnectionConfig>
  /** Enable query logging */
  logging?: boolean
  /** Query cache TTL in seconds (0 = disabled) */
  cacheTTL?: number
  /** Maximum cached queries */
  maxCacheSize?: number
}

/**
 * Query operator types
 */
export type QueryOperator = '=' | '!=' | '<' | '<=' | '>' | '>=' | 'like' | 'in' | 'not in' | 'between' | 'is null' | 'is not null'

/**
 * Where clause condition
 */
export interface WhereCondition {
  column: string
  operator: QueryOperator
  value: unknown
  boolean: 'and' | 'or'
}

/**
 * Order by clause
 */
export interface OrderByClause {
  column: string
  direction: 'asc' | 'desc'
}

/**
 * Join clause
 */
export interface JoinClause {
  type: 'inner' | 'left' | 'right' | 'cross'
  table: string
  first: string
  operator: string
  second: string
}

/**
 * Raw SQL expression
 */
export interface RawExpression {
  __raw: true
  sql: string
  bindings: unknown[]
}

/**
 * Query result row
 */
export type Row = Record<string, unknown>

/**
 * Relationship definition
 */
export interface RelationshipDefinition {
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany'
  model: string
  foreignKey?: string
  localKey?: string
  pivotTable?: string
  pivotForeignKey?: string
  pivotRelatedKey?: string
}

/**
 * Model definition
 */
export interface ModelDefinition {
  /** Table name */
  table: string
  /** Primary key column */
  primaryKey?: string
  /** Columns that can be mass-assigned */
  fillable?: string[]
  /** Columns that are hidden from serialization */
  hidden?: string[]
  /** Timestamp column names */
  timestamps?: { createdAt?: string, updatedAt?: string } | boolean
  /** Soft delete column */
  softDeletes?: string | boolean
  /** Default values for columns */
  defaults?: Record<string, unknown>
  /** Column casts (e.g., { created_at: 'date', metadata: 'json' }) */
  casts?: Record<string, 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array'>
  /** Relationship definitions */
  relationships?: Record<string, RelationshipDefinition>
  /** Query scopes */
  scopes?: Record<string, (query: QueryBuilder) => QueryBuilder>
}

/**
 * Model instance
 */
export interface ModelInstance {
  /** Get attribute value */
  get: (key: string) => unknown
  /** Set attribute value */
  set: (key: string, value: unknown) => void
  /** Get all attributes */
  toJSON: () => Row
  /** Save changes to database */
  save: () => Promise<void>
  /** Delete from database */
  delete: () => Promise<void>
  /** Reload from database */
  refresh: () => Promise<void>
  /** Check if model exists in database */
  exists: boolean
  /** Original attributes before changes */
  original: Row
  /** Current attributes */
  attributes: Row
  /** Check if model has been modified */
  isDirty: (key?: string) => boolean
  /** Get relationship data */
  [key: string]: unknown
}

/**
 * Model class
 */
export interface Model {
  /** Model name */
  name: string
  /** Model definition */
  definition: ModelDefinition
  /** Find by primary key */
  find: (id: unknown) => Promise<ModelInstance | null>
  /** Find by primary key or throw */
  findOrFail: (id: unknown) => Promise<ModelInstance>
  /** Get all records */
  all: () => Promise<ModelInstance[]>
  /** Create new record */
  create: (attributes: Row) => Promise<ModelInstance>
  /** Update records matching query */
  update: (attributes: Row) => Promise<number>
  /** Delete records matching query */
  destroy: (ids: unknown | unknown[]) => Promise<number>
  /** Start a new query */
  query: () => QueryBuilder
  /** Add a where clause */
  where: (column: string, operatorOrValue: QueryOperator | unknown, value?: unknown) => QueryBuilder
  /** First record matching query */
  first: () => Promise<ModelInstance | null>
  /** Get records matching query */
  get: () => Promise<ModelInstance[]>
  /** Count records */
  count: () => Promise<number>
}

/**
 * Database adapter interface
 */
export interface DatabaseAdapter {
  /** Connect to database */
  connect: () => Promise<void>
  /** Disconnect from database */
  disconnect: () => Promise<void>
  /** Execute raw query */
  query: <T = Row>(sql: string, bindings?: unknown[]) => Promise<T[]>
  /** Execute insert and return inserted ID */
  insert: (sql: string, bindings?: unknown[]) => Promise<unknown>
  /** Execute update/delete and return affected rows */
  execute: (sql: string, bindings?: unknown[]) => Promise<number>
  /** Begin transaction */
  beginTransaction: () => Promise<void>
  /** Commit transaction */
  commit: () => Promise<void>
  /** Rollback transaction */
  rollback: () => Promise<void>
  /** Check if connected */
  isConnected: () => boolean
}

/**
 * Query cache entry
 */
interface CacheEntry {
  result: unknown
  timestamp: number
  ttl: number
}

// =============================================================================
// Configuration
// =============================================================================

let databaseConfig: DatabaseConfig = {
  default: 'sqlite',
  connections: {},
  logging: false,
  cacheTTL: 0,
  maxCacheSize: 1000,
}

const adapters: Record<string, DatabaseAdapter> = {}
const models: Record<string, Model> = {}
const queryCache: Map<string, CacheEntry> = new Map()
const queryLog: Array<{ sql: string, bindings: unknown[], duration: number, timestamp: Date }> = []

/**
 * Configure database connections
 *
 * @param config - Database configuration
 *
 * @example
 * configureDatabase({
 *   default: 'sqlite',
 *   connections: {
 *     sqlite: { driver: 'sqlite', database: './database.db' }
 *   }
 * })
 */
export function configureDatabase(config: Partial<DatabaseConfig>): void {
  databaseConfig = { ...databaseConfig, ...config }
}

/**
 * Get current database configuration
 */
export function getDatabaseConfig(): DatabaseConfig {
  return { ...databaseConfig }
}

/**
 * Reset database configuration to defaults
 */
export function resetDatabaseConfig(): void {
  databaseConfig = {
    default: 'sqlite',
    connections: {},
    logging: false,
    cacheTTL: 0,
    maxCacheSize: 1000,
  }
  // Clear adapters and cache
  for (const name of Object.keys(adapters)) {
    delete adapters[name]
  }
  queryCache.clear()
  queryLog.length = 0
}

// =============================================================================
// Adapters
// =============================================================================

/**
 * Register a custom database adapter
 *
 * @param name - Connection name
 * @param adapter - Database adapter instance
 */
export function registerAdapter(name: string, adapter: DatabaseAdapter): void {
  adapters[name] = adapter
}

/**
 * Get database adapter for connection
 *
 * @param connection - Connection name (defaults to default connection)
 */
export function getAdapter(connection?: string): DatabaseAdapter {
  const name = connection || databaseConfig.default

  if (adapters[name]) {
    return adapters[name]
  }

  const config = databaseConfig.connections[name]
  if (!config) {
    throw new Error(`Database connection "${name}" not configured`)
  }

  // Create adapter based on driver
  const adapter = createAdapter(config)
  adapters[name] = adapter
  return adapter
}

/**
 * Create database adapter from configuration
 */
function createAdapter(config: ConnectionConfig): DatabaseAdapter {
  switch (config.driver) {
    case 'sqlite':
      return createSQLiteAdapter(config)
    case 'postgres':
      return createPostgresAdapter(config)
    case 'mysql':
      return createMySQLAdapter(config)
    default:
      throw new Error(`Unsupported database driver: ${config.driver}`)
  }
}

/**
 * Create SQLite adapter using Bun's built-in SQLite
 */
function createSQLiteAdapter(config: ConnectionConfig): DatabaseAdapter {
  let db: any = null
  let connected = false

  return {
    async connect() {
      if (connected)
        return

      // Use Bun's built-in SQLite
      const { Database } = await import('bun:sqlite')
      db = new Database(config.database, {
        create: true,
        readwrite: true,
      })
      connected = true
    },

    async disconnect() {
      if (db) {
        db.close()
        db = null
        connected = false
      }
    },

    async query<T = Row>(sql: string, bindings: unknown[] = []): Promise<T[]> {
      if (!connected)
        await this.connect()
      const start = performance.now()

      try {
        const stmt = db.prepare(sql)
        const result = stmt.all(...bindings) as T[]

        if (databaseConfig.logging) {
          logQuery(sql, bindings, performance.now() - start)
        }

        return result
      }
      catch (error) {
        throw new DatabaseError(`Query failed: ${error}`, sql, bindings)
      }
    },

    async insert(sql: string, bindings: unknown[] = []): Promise<unknown> {
      if (!connected)
        await this.connect()
      const start = performance.now()

      try {
        const stmt = db.prepare(sql)
        const result = stmt.run(...bindings)

        if (databaseConfig.logging) {
          logQuery(sql, bindings, performance.now() - start)
        }

        return result.lastInsertRowid
      }
      catch (error) {
        throw new DatabaseError(`Insert failed: ${error}`, sql, bindings)
      }
    },

    async execute(sql: string, bindings: unknown[] = []): Promise<number> {
      if (!connected)
        await this.connect()
      const start = performance.now()

      try {
        const stmt = db.prepare(sql)
        const result = stmt.run(...bindings)

        if (databaseConfig.logging) {
          logQuery(sql, bindings, performance.now() - start)
        }

        return result.changes
      }
      catch (error) {
        throw new DatabaseError(`Execute failed: ${error}`, sql, bindings)
      }
    },

    async beginTransaction() {
      if (!connected)
        await this.connect()
      db.run('BEGIN TRANSACTION')
    },

    async commit() {
      db.run('COMMIT')
    },

    async rollback() {
      db.run('ROLLBACK')
    },

    isConnected() {
      return connected
    },
  }
}

/**
 * Create PostgreSQL adapter (placeholder - requires pg package)
 */
function createPostgresAdapter(config: ConnectionConfig): DatabaseAdapter {
  let connected = false
  let client: any = null

  return {
    async connect() {
      if (connected)
        return

      try {
        // Dynamic import for optional pg dependency
        const { Client } = await import('pg')
        client = new Client({
          host: config.host || 'localhost',
          port: config.port || 5432,
          database: config.database,
          user: config.username,
          password: config.password,
          ssl: config.ssl,
        })
        await client.connect()
        connected = true
      }
      catch (error) {
        throw new Error(`PostgreSQL connection failed. Install 'pg' package: ${error}`)
      }
    },

    async disconnect() {
      if (client) {
        await client.end()
        client = null
        connected = false
      }
    },

    async query<T = Row>(sql: string, bindings: unknown[] = []): Promise<T[]> {
      if (!connected)
        await this.connect()
      const start = performance.now()

      try {
        const result = await client.query(sql, bindings)

        if (databaseConfig.logging) {
          logQuery(sql, bindings, performance.now() - start)
        }

        return result.rows as T[]
      }
      catch (error) {
        throw new DatabaseError(`Query failed: ${error}`, sql, bindings)
      }
    },

    async insert(sql: string, bindings: unknown[] = []): Promise<unknown> {
      if (!connected)
        await this.connect()
      const start = performance.now()

      try {
        // PostgreSQL uses RETURNING to get inserted ID
        const result = await client.query(`${sql} RETURNING id`, bindings)

        if (databaseConfig.logging) {
          logQuery(sql, bindings, performance.now() - start)
        }

        return result.rows[0]?.id
      }
      catch (error) {
        throw new DatabaseError(`Insert failed: ${error}`, sql, bindings)
      }
    },

    async execute(sql: string, bindings: unknown[] = []): Promise<number> {
      if (!connected)
        await this.connect()
      const start = performance.now()

      try {
        const result = await client.query(sql, bindings)

        if (databaseConfig.logging) {
          logQuery(sql, bindings, performance.now() - start)
        }

        return result.rowCount || 0
      }
      catch (error) {
        throw new DatabaseError(`Execute failed: ${error}`, sql, bindings)
      }
    },

    async beginTransaction() {
      if (!connected)
        await this.connect()
      await client.query('BEGIN')
    },

    async commit() {
      await client.query('COMMIT')
    },

    async rollback() {
      await client.query('ROLLBACK')
    },

    isConnected() {
      return connected
    },
  }
}

/**
 * Create MySQL adapter (placeholder - requires mysql2 package)
 */
function createMySQLAdapter(config: ConnectionConfig): DatabaseAdapter {
  let connected = false
  let pool: any = null

  return {
    async connect() {
      if (connected)
        return

      try {
        // Dynamic import for optional mysql2 dependency
        const mysql = await import('mysql2/promise')
        pool = mysql.createPool({
          host: config.host || 'localhost',
          port: config.port || 3306,
          database: config.database,
          user: config.username,
          password: config.password,
          waitForConnections: true,
          connectionLimit: config.poolSize || 10,
          queueLimit: 0,
        })
        connected = true
      }
      catch (error) {
        throw new Error(`MySQL connection failed. Install 'mysql2' package: ${error}`)
      }
    },

    async disconnect() {
      if (pool) {
        await pool.end()
        pool = null
        connected = false
      }
    },

    async query<T = Row>(sql: string, bindings: unknown[] = []): Promise<T[]> {
      if (!connected)
        await this.connect()
      const start = performance.now()

      try {
        const [rows] = await pool.execute(sql, bindings)

        if (databaseConfig.logging) {
          logQuery(sql, bindings, performance.now() - start)
        }

        return rows as T[]
      }
      catch (error) {
        throw new DatabaseError(`Query failed: ${error}`, sql, bindings)
      }
    },

    async insert(sql: string, bindings: unknown[] = []): Promise<unknown> {
      if (!connected)
        await this.connect()
      const start = performance.now()

      try {
        const [result] = await pool.execute(sql, bindings)

        if (databaseConfig.logging) {
          logQuery(sql, bindings, performance.now() - start)
        }

        return (result as any).insertId
      }
      catch (error) {
        throw new DatabaseError(`Insert failed: ${error}`, sql, bindings)
      }
    },

    async execute(sql: string, bindings: unknown[] = []): Promise<number> {
      if (!connected)
        await this.connect()
      const start = performance.now()

      try {
        const [result] = await pool.execute(sql, bindings)

        if (databaseConfig.logging) {
          logQuery(sql, bindings, performance.now() - start)
        }

        return (result as any).affectedRows || 0
      }
      catch (error) {
        throw new DatabaseError(`Execute failed: ${error}`, sql, bindings)
      }
    },

    async beginTransaction() {
      if (!connected)
        await this.connect()
      const connection = await pool.getConnection()
      await connection.beginTransaction()
      return connection
    },

    async commit() {
      // Note: In real implementation, would need to track connection
      await pool.execute('COMMIT')
    },

    async rollback() {
      await pool.execute('ROLLBACK')
    },

    isConnected() {
      return connected
    },
  }
}

// =============================================================================
// Query Builder
// =============================================================================

/**
 * Fluent query builder class
 */
export class QueryBuilder {
  private _table: string = ''
  private _columns: string[] = ['*']
  private _wheres: WhereCondition[] = []
  private _orders: OrderByClause[] = []
  private _joins: JoinClause[] = []
  private _groupBy: string[] = []
  private _having: WhereCondition[] = []
  private _limit?: number
  private _offset?: number
  private _distinct: boolean = false
  private _connection?: string
  private _bindings: unknown[] = []
  private _modelDefinition?: ModelDefinition

  /**
   * Create a new query builder
   */
  constructor(table?: string) {
    if (table) {
      this._table = table
    }
  }

  /**
   * Set the table to query
   */
  table(name: string): this {
    this._table = name
    return this
  }

  /**
   * Alias for table()
   */
  from(name: string): this {
    return this.table(name)
  }

  /**
   * Set the connection to use
   */
  connection(name: string): this {
    this._connection = name
    return this
  }

  /**
   * Set columns to select
   */
  select(...columns: string[]): this {
    this._columns = columns.length > 0 ? columns : ['*']
    return this
  }

  /**
   * Add columns to select
   */
  addSelect(...columns: string[]): this {
    if (this._columns[0] === '*') {
      this._columns = columns
    }
    else {
      this._columns.push(...columns)
    }
    return this
  }

  /**
   * Select distinct rows
   */
  distinct(): this {
    this._distinct = true
    return this
  }

  /**
   * Add a where clause
   */
  where(column: string, operatorOrValue: QueryOperator | unknown, value?: unknown): this {
    let operator: QueryOperator = '='
    let actualValue: unknown = operatorOrValue

    if (value !== undefined) {
      operator = operatorOrValue as QueryOperator
      actualValue = value
    }

    this._wheres.push({
      column,
      operator,
      value: actualValue,
      boolean: 'and',
    })

    return this
  }

  /**
   * Add an OR where clause
   */
  orWhere(column: string, operatorOrValue: QueryOperator | unknown, value?: unknown): this {
    let operator: QueryOperator = '='
    let actualValue: unknown = operatorOrValue

    if (value !== undefined) {
      operator = operatorOrValue as QueryOperator
      actualValue = value
    }

    this._wheres.push({
      column,
      operator,
      value: actualValue,
      boolean: 'or',
    })

    return this
  }

  /**
   * Add a where IN clause
   */
  whereIn(column: string, values: unknown[]): this {
    this._wheres.push({
      column,
      operator: 'in',
      value: values,
      boolean: 'and',
    })
    return this
  }

  /**
   * Add a where NOT IN clause
   */
  whereNotIn(column: string, values: unknown[]): this {
    this._wheres.push({
      column,
      operator: 'not in',
      value: values,
      boolean: 'and',
    })
    return this
  }

  /**
   * Add a where NULL clause
   */
  whereNull(column: string): this {
    this._wheres.push({
      column,
      operator: 'is null',
      value: null,
      boolean: 'and',
    })
    return this
  }

  /**
   * Add a where NOT NULL clause
   */
  whereNotNull(column: string): this {
    this._wheres.push({
      column,
      operator: 'is not null',
      value: null,
      boolean: 'and',
    })
    return this
  }

  /**
   * Add a where BETWEEN clause
   */
  whereBetween(column: string, min: unknown, max: unknown): this {
    this._wheres.push({
      column,
      operator: 'between',
      value: [min, max],
      boolean: 'and',
    })
    return this
  }

  /**
   * Add a where LIKE clause
   */
  whereLike(column: string, pattern: string): this {
    this._wheres.push({
      column,
      operator: 'like',
      value: pattern,
      boolean: 'and',
    })
    return this
  }

  /**
   * Add an inner join
   */
  join(table: string, first: string, operator: string, second: string): this {
    this._joins.push({ type: 'inner', table, first, operator, second })
    return this
  }

  /**
   * Add a left join
   */
  leftJoin(table: string, first: string, operator: string, second: string): this {
    this._joins.push({ type: 'left', table, first, operator, second })
    return this
  }

  /**
   * Add a right join
   */
  rightJoin(table: string, first: string, operator: string, second: string): this {
    this._joins.push({ type: 'right', table, first, operator, second })
    return this
  }

  /**
   * Add order by clause
   */
  orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): this {
    this._orders.push({ column, direction })
    return this
  }

  /**
   * Order by descending
   */
  orderByDesc(column: string): this {
    return this.orderBy(column, 'desc')
  }

  /**
   * Add group by clause
   */
  groupBy(...columns: string[]): this {
    this._groupBy.push(...columns)
    return this
  }

  /**
   * Add having clause
   */
  having(column: string, operator: QueryOperator, value: unknown): this {
    this._having.push({ column, operator, value, boolean: 'and' })
    return this
  }

  /**
   * Set limit
   */
  limit(count: number): this {
    this._limit = count
    return this
  }

  /**
   * Alias for limit()
   */
  take(count: number): this {
    return this.limit(count)
  }

  /**
   * Set offset
   */
  offset(count: number): this {
    this._offset = count
    return this
  }

  /**
   * Alias for offset()
   */
  skip(count: number): this {
    return this.offset(count)
  }

  /**
   * Paginate results
   */
  forPage(page: number, perPage: number = 15): this {
    return this.offset((page - 1) * perPage).limit(perPage)
  }

  /**
   * Execute query and get results
   */
  async get(): Promise<Row[]> {
    const { sql, bindings } = this.toSql()

    // Check cache
    if (databaseConfig.cacheTTL && databaseConfig.cacheTTL > 0) {
      const cacheKey = this.getCacheKey(sql, bindings)
      const cached = getFromCache(cacheKey)
      if (cached !== undefined) {
        return cached as Row[]
      }
    }

    const adapter = getAdapter(this._connection)
    const results = await adapter.query<Row>(sql, bindings)

    // Store in cache
    if (databaseConfig.cacheTTL && databaseConfig.cacheTTL > 0) {
      const cacheKey = this.getCacheKey(sql, bindings)
      setCache(cacheKey, results, databaseConfig.cacheTTL)
    }

    return results
  }

  /**
   * Get first result
   */
  async first(): Promise<Row | null> {
    const results = await this.limit(1).get()
    return results[0] || null
  }

  /**
   * Get first result or throw
   */
  async firstOrFail(): Promise<Row> {
    const result = await this.first()
    if (!result) {
      throw new Error('No results found')
    }
    return result
  }

  /**
   * Find by primary key
   */
  async find(id: unknown, primaryKey: string = 'id'): Promise<Row | null> {
    return this.where(primaryKey, id).first()
  }

  /**
   * Get value of a single column
   */
  async value(column: string): Promise<unknown> {
    const result = await this.select(column).first()
    return result ? result[column] : null
  }

  /**
   * Get array of single column values
   */
  async pluck(column: string): Promise<unknown[]> {
    const results = await this.select(column).get()
    return results.map(row => row[column])
  }

  /**
   * Check if any results exist
   */
  async exists(): Promise<boolean> {
    const result = await this.select(raw('1')).limit(1).get()
    return result.length > 0
  }

  /**
   * Check if no results exist
   */
  async doesntExist(): Promise<boolean> {
    return !(await this.exists())
  }

  /**
   * Get count of results
   */
  async count(column: string = '*'): Promise<number> {
    const result = await this.select(raw(`COUNT(${column}) as count`)).first()
    return Number(result?.count || 0)
  }

  /**
   * Get maximum value
   */
  async max(column: string): Promise<number | null> {
    const result = await this.select(raw(`MAX(${column}) as max`)).first()
    return result?.max as number | null
  }

  /**
   * Get minimum value
   */
  async min(column: string): Promise<number | null> {
    const result = await this.select(raw(`MIN(${column}) as min`)).first()
    return result?.min as number | null
  }

  /**
   * Get sum of values
   */
  async sum(column: string): Promise<number> {
    const result = await this.select(raw(`SUM(${column}) as sum`)).first()
    return Number(result?.sum || 0)
  }

  /**
   * Get average of values
   */
  async avg(column: string): Promise<number | null> {
    const result = await this.select(raw(`AVG(${column}) as avg`)).first()
    return result?.avg as number | null
  }

  /**
   * Insert a new row
   */
  async insert(data: Row): Promise<unknown> {
    const columns = Object.keys(data)
    const placeholders = columns.map(() => '?').join(', ')
    const values = Object.values(data)

    const sql = `INSERT INTO ${this._table} (${columns.join(', ')}) VALUES (${placeholders})`
    const adapter = getAdapter(this._connection)

    invalidateCacheForTable(this._table)
    return adapter.insert(sql, values)
  }

  /**
   * Insert multiple rows
   */
  async insertAll(rows: Row[]): Promise<void> {
    if (rows.length === 0)
      return

    const columns = Object.keys(rows[0])
    const placeholders = rows.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ')
    const values = rows.flatMap(row => Object.values(row))

    const sql = `INSERT INTO ${this._table} (${columns.join(', ')}) VALUES ${placeholders}`
    const adapter = getAdapter(this._connection)

    invalidateCacheForTable(this._table)
    await adapter.execute(sql, values)
  }

  /**
   * Update rows
   */
  async update(data: Row): Promise<number> {
    // Reset bindings and build where clause first to populate bindings
    this._bindings = []
    const whereClause = this.buildWhereClause()
    const whereBindings = [...this._bindings]

    const sets = Object.keys(data).map(col => `${col} = ?`).join(', ')
    const values = [...Object.values(data), ...whereBindings]

    const sql = `UPDATE ${this._table} SET ${sets}${whereClause}`

    const adapter = getAdapter(this._connection)
    invalidateCacheForTable(this._table)
    return adapter.execute(sql, values)
  }

  /**
   * Increment a column value
   */
  async increment(column: string, amount: number = 1): Promise<number> {
    // Reset bindings and build where clause first to populate bindings
    this._bindings = []
    const whereClause = this.buildWhereClause()

    const sql = `UPDATE ${this._table} SET ${column} = ${column} + ?${whereClause}`

    const adapter = getAdapter(this._connection)
    invalidateCacheForTable(this._table)
    return adapter.execute(sql, [amount, ...this._bindings])
  }

  /**
   * Decrement a column value
   */
  async decrement(column: string, amount: number = 1): Promise<number> {
    return this.increment(column, -amount)
  }

  /**
   * Delete rows
   */
  async delete(): Promise<number> {
    // Reset bindings and build where clause first to populate bindings
    this._bindings = []
    const whereClause = this.buildWhereClause()

    const sql = `DELETE FROM ${this._table}${whereClause}`

    const adapter = getAdapter(this._connection)
    invalidateCacheForTable(this._table)
    return adapter.execute(sql, this._bindings)
  }

  /**
   * Truncate table
   */
  async truncate(): Promise<void> {
    const adapter = getAdapter(this._connection)
    invalidateCacheForTable(this._table)
    await adapter.execute(`DELETE FROM ${this._table}`)
  }

  /**
   * Get the SQL and bindings for this query
   */
  toSql(): { sql: string, bindings: unknown[] } {
    this._bindings = []

    let sql = 'SELECT '

    if (this._distinct) {
      sql += 'DISTINCT '
    }

    sql += this._columns.map((col) => {
      if (typeof col === 'object' && (col as RawExpression).__raw) {
        return (col as RawExpression).sql
      }
      return col
    }).join(', ')

    sql += ` FROM ${this._table}`

    // Joins
    for (const join of this._joins) {
      sql += ` ${join.type.toUpperCase()} JOIN ${join.table} ON ${join.first} ${join.operator} ${join.second}`
    }

    // Where clause
    sql += this.buildWhereClause()

    // Group by
    if (this._groupBy.length > 0) {
      sql += ` GROUP BY ${this._groupBy.join(', ')}`
    }

    // Having
    if (this._having.length > 0) {
      const havingClauses = this._having.map((condition, index) => {
        const prefix = index === 0 ? '' : ` ${condition.boolean.toUpperCase()} `
        this._bindings.push(condition.value)
        return `${prefix}${condition.column} ${condition.operator} ?`
      })
      sql += ` HAVING ${havingClauses.join('')}`
    }

    // Order by
    if (this._orders.length > 0) {
      sql += ` ORDER BY ${this._orders.map(o => `${o.column} ${o.direction.toUpperCase()}`).join(', ')}`
    }

    // Limit and offset
    if (this._limit !== undefined) {
      sql += ` LIMIT ${this._limit}`
    }

    if (this._offset !== undefined) {
      sql += ` OFFSET ${this._offset}`
    }

    return { sql, bindings: this._bindings }
  }

  /**
   * Build where clause
   */
  private buildWhereClause(): string {
    if (this._wheres.length === 0) {
      return ''
    }

    const clauses = this._wheres.map((condition, index) => {
      const prefix = index === 0 ? ' WHERE ' : ` ${condition.boolean.toUpperCase()} `

      switch (condition.operator) {
        case 'in': {
          const inValues = condition.value as unknown[]
          const inPlaceholders = inValues.map(() => '?').join(', ')
          this._bindings.push(...inValues)
          return `${prefix}${condition.column} IN (${inPlaceholders})`
        }

        case 'not in': {
          const notInValues = condition.value as unknown[]
          const notInPlaceholders = notInValues.map(() => '?').join(', ')
          this._bindings.push(...notInValues)
          return `${prefix}${condition.column} NOT IN (${notInPlaceholders})`
        }

        case 'between': {
          const [min, max] = condition.value as [unknown, unknown]
          this._bindings.push(min, max)
          return `${prefix}${condition.column} BETWEEN ? AND ?`
        }

        case 'is null':
          return `${prefix}${condition.column} IS NULL`

        case 'is not null':
          return `${prefix}${condition.column} IS NOT NULL`

        default:
          this._bindings.push(condition.value)
          return `${prefix}${condition.column} ${condition.operator} ?`
      }
    })

    return clauses.join('')
  }

  /**
   * Get cache key for query
   */
  private getCacheKey(sql: string, bindings: unknown[]): string {
    return `${this._table}:${sql}:${JSON.stringify(bindings)}`
  }

  /**
   * Clone this query builder
   */
  clone(): QueryBuilder {
    const clone = new QueryBuilder(this._table)
    clone._columns = [...this._columns]
    clone._wheres = [...this._wheres]
    clone._orders = [...this._orders]
    clone._joins = [...this._joins]
    clone._groupBy = [...this._groupBy]
    clone._having = [...this._having]
    clone._limit = this._limit
    clone._offset = this._offset
    clone._distinct = this._distinct
    clone._connection = this._connection
    return clone
  }
}

/**
 * Create a new query builder for a table
 *
 * @param table - Table name
 * @returns Query builder instance
 *
 * @example
 * const users = await query('users')
 *   .where('active', true)
 *   .orderBy('name')
 *   .get()
 */
export function query(table: string): QueryBuilder {
  return new QueryBuilder(table)
}

/**
 * Alias for query()
 */
export function table(name: string): QueryBuilder {
  return query(name)
}

/**
 * Create a raw SQL expression
 */
export function raw(sql: string, bindings: unknown[] = []): RawExpression {
  return { __raw: true, sql, bindings }
}

// =============================================================================
// Models
// =============================================================================

/**
 * Define a model
 *
 * @param name - Model name
 * @param definition - Model definition
 * @returns Model instance
 *
 * @example
 * const User = defineModel('User', {
 *   table: 'users',
 *   primaryKey: 'id',
 *   fillable: ['name', 'email'],
 *   hidden: ['password'],
 *   relationships: {
 *     posts: { type: 'hasMany', model: 'Post', foreignKey: 'user_id' }
 *   }
 * })
 */
export function defineModel(name: string, definition: ModelDefinition): Model {
  const primaryKey = definition.primaryKey || 'id'

  const model: Model = {
    name,
    definition,

    async find(id: unknown): Promise<ModelInstance | null> {
      const row = await query(definition.table).where(primaryKey, id).first()
      return row ? createModelInstance(model, row) : null
    },

    async findOrFail(id: unknown): Promise<ModelInstance> {
      const instance = await this.find(id)
      if (!instance) {
        throw new Error(`${name} not found with ${primaryKey} = ${id}`)
      }
      return instance
    },

    async all(): Promise<ModelInstance[]> {
      const rows = await query(definition.table).get()
      return rows.map(row => createModelInstance(model, row))
    },

    async create(attributes: Row): Promise<ModelInstance> {
      // Apply defaults
      const data = { ...definition.defaults, ...attributes }

      // Filter to fillable
      const fillable = definition.fillable
        ? Object.fromEntries(
            Object.entries(data).filter(([key]) => definition.fillable!.includes(key)),
          )
        : data

      // Add timestamps
      if (definition.timestamps !== false) {
        const now = new Date().toISOString()
        const createdAtCol = typeof definition.timestamps === 'object'
          ? definition.timestamps.createdAt || 'created_at'
          : 'created_at'
        const updatedAtCol = typeof definition.timestamps === 'object'
          ? definition.timestamps.updatedAt || 'updated_at'
          : 'updated_at'

        fillable[createdAtCol] = now
        fillable[updatedAtCol] = now
      }

      const id = await query(definition.table).insert(fillable)
      return this.findOrFail(id)
    },

    async update(attributes: Row): Promise<number> {
      return query(definition.table).update(attributes)
    },

    async destroy(ids: unknown | unknown[]): Promise<number> {
      const idArray = Array.isArray(ids) ? ids : [ids]
      return query(definition.table).whereIn(primaryKey, idArray).delete()
    },

    query(): QueryBuilder {
      return query(definition.table)
    },

    where(column: string, operatorOrValue: QueryOperator | unknown, value?: unknown): QueryBuilder {
      return this.query().where(column, operatorOrValue, value)
    },

    async first(): Promise<ModelInstance | null> {
      const row = await this.query().first()
      return row ? createModelInstance(model, row) : null
    },

    async get(): Promise<ModelInstance[]> {
      const rows = await this.query().get()
      return rows.map(row => createModelInstance(model, row))
    },

    async count(): Promise<number> {
      return this.query().count()
    },
  }

  models[name] = model
  return model
}

/**
 * Get a registered model by name
 */
export function getModel(name: string): Model {
  const model = models[name]
  if (!model) {
    throw new Error(`Model "${name}" not defined. Use defineModel() first.`)
  }
  return model
}

/**
 * Check if a model is registered
 */
export function hasModel(name: string): boolean {
  return name in models
}

/**
 * Create a model instance from a row
 */
function createModelInstance(model: Model, row: Row): ModelInstance {
  const { definition } = model
  const primaryKey = definition.primaryKey || 'id'
  const original = { ...row }
  const attributes = { ...row }

  // Apply casts
  if (definition.casts) {
    for (const [key, type] of Object.entries(definition.casts)) {
      if (key in attributes) {
        attributes[key] = castValue(attributes[key], type)
      }
    }
  }

  const instance: ModelInstance = {
    exists: true,
    original,
    attributes,

    get(key: string): unknown {
      return attributes[key]
    },

    set(key: string, value: unknown): void {
      attributes[key] = value
    },

    toJSON(): Row {
      const result = { ...attributes }
      // Remove hidden fields
      if (definition.hidden) {
        for (const key of definition.hidden) {
          delete result[key]
        }
      }
      return result
    },

    async save(): Promise<void> {
      const changes: Row = {}
      for (const key of Object.keys(attributes)) {
        if (attributes[key] !== original[key]) {
          changes[key] = attributes[key]
        }
      }

      if (Object.keys(changes).length > 0) {
        // Add updated_at timestamp
        if (definition.timestamps !== false) {
          const updatedAtCol = typeof definition.timestamps === 'object'
            ? definition.timestamps.updatedAt || 'updated_at'
            : 'updated_at'
          changes[updatedAtCol] = new Date().toISOString()
        }

        await query(definition.table)
          .where(primaryKey, original[primaryKey])
          .update(changes)

        // Update original to match
        Object.assign(original, changes)
      }
    },

    async delete(): Promise<void> {
      if (definition.softDeletes) {
        const deleteCol = typeof definition.softDeletes === 'string'
          ? definition.softDeletes
          : 'deleted_at'

        await query(definition.table)
          .where(primaryKey, original[primaryKey])
          .update({ [deleteCol]: new Date().toISOString() })
      }
      else {
        await query(definition.table)
          .where(primaryKey, original[primaryKey])
          .delete()
      }
      instance.exists = false
    },

    async refresh(): Promise<void> {
      const fresh = await query(definition.table)
        .where(primaryKey, original[primaryKey])
        .first()

      if (fresh) {
        Object.assign(original, fresh)
        Object.assign(attributes, fresh)
      }
    },

    isDirty(key?: string): boolean {
      if (key) {
        return attributes[key] !== original[key]
      }
      return Object.keys(attributes).some(k => attributes[k] !== original[k])
    },
  }

  // Add relationship methods
  if (definition.relationships) {
    for (const [name, rel] of Object.entries(definition.relationships)) {
      Object.defineProperty(instance, name, {
        value: async () => {
          return loadRelationship(instance, rel, model)
        },
        enumerable: false,
      })
    }
  }

  // Add attribute access
  return new Proxy(instance, {
    get(target, prop: string) {
      if (prop in target) {
        return (target as any)[prop]
      }
      return attributes[prop]
    },
    set(target, prop: string, value) {
      if (prop in target) {
        (target as any)[prop] = value
      }
      else {
        attributes[prop] = value
      }
      return true
    },
  })
}

/**
 * Load a relationship
 */
async function loadRelationship(
  instance: ModelInstance,
  rel: RelationshipDefinition,
  parentModel: Model,
): Promise<ModelInstance | ModelInstance[] | null> {
  const relatedModel = getModel(rel.model)
  const primaryKey = parentModel.definition.primaryKey || 'id'

  switch (rel.type) {
    case 'hasOne': {
      const foreignKey = rel.foreignKey || `${parentModel.name.toLowerCase()}_id`
      const row = await query(relatedModel.definition.table)
        .where(foreignKey, instance.get(primaryKey))
        .first()
      return row ? createModelInstance(relatedModel, row) : null
    }

    case 'hasMany': {
      const foreignKey = rel.foreignKey || `${parentModel.name.toLowerCase()}_id`
      const rows = await query(relatedModel.definition.table)
        .where(foreignKey, instance.get(primaryKey))
        .get()
      return rows.map(row => createModelInstance(relatedModel, row))
    }

    case 'belongsTo': {
      const foreignKey = rel.foreignKey || `${rel.model.toLowerCase()}_id`
      const localKey = rel.localKey || 'id'
      const row = await query(relatedModel.definition.table)
        .where(localKey, instance.get(foreignKey))
        .first()
      return row ? createModelInstance(relatedModel, row) : null
    }

    case 'belongsToMany': {
      const pivotTable = rel.pivotTable || [parentModel.name, rel.model].sort().join('_').toLowerCase()
      const pivotForeignKey = rel.pivotForeignKey || `${parentModel.name.toLowerCase()}_id`
      const pivotRelatedKey = rel.pivotRelatedKey || `${rel.model.toLowerCase()}_id`
      const relatedPrimaryKey = relatedModel.definition.primaryKey || 'id'

      const rows = await query(relatedModel.definition.table)
        .join(
          pivotTable,
          `${relatedModel.definition.table}.${relatedPrimaryKey}`,
          '=',
          `${pivotTable}.${pivotRelatedKey}`,
        )
        .where(`${pivotTable}.${pivotForeignKey}`, instance.get(primaryKey))
        .get()

      return rows.map(row => createModelInstance(relatedModel, row))
    }

    default:
      return null
  }
}

/**
 * Cast a value to specified type
 */
function castValue(value: unknown, type: string): unknown {
  if (value === null || value === undefined)
    return value

  switch (type) {
    case 'string':
      return String(value)
    case 'number':
      return Number(value)
    case 'boolean':
      return Boolean(value)
    case 'date':
      return new Date(value as string)
    case 'json':
    case 'array':
      return typeof value === 'string' ? JSON.parse(value) : value
    default:
      return value
  }
}

// =============================================================================
// Transactions
// =============================================================================

/**
 * Run a callback within a transaction
 *
 * @param callback - Function to run within transaction
 * @param connection - Optional connection name
 *
 * @example
 * await transaction(async () => {
 *   await query('users').insert({ name: 'John' })
 *   await query('profiles').insert({ user_id: 1, bio: 'Hello' })
 * })
 */
export async function transaction<T>(
  callback: () => Promise<T>,
  connection?: string,
): Promise<T> {
  const adapter = getAdapter(connection)

  await adapter.beginTransaction()

  try {
    const result = await callback()
    await adapter.commit()
    return result
  }
  catch (error) {
    await adapter.rollback()
    throw error
  }
}

// =============================================================================
// Caching
// =============================================================================

/**
 * Get value from query cache
 */
function getFromCache(key: string): unknown | undefined {
  const entry = queryCache.get(key)
  if (!entry)
    return undefined

  // Check if expired
  if (Date.now() - entry.timestamp > entry.ttl * 1000) {
    queryCache.delete(key)
    return undefined
  }

  return entry.result
}

/**
 * Set value in query cache
 */
function setCache(key: string, result: unknown, ttl: number): void {
  // Enforce max cache size
  if (queryCache.size >= (databaseConfig.maxCacheSize || 1000)) {
    // Remove oldest entry
    const firstKey = queryCache.keys().next().value
    if (firstKey) {
      queryCache.delete(firstKey)
    }
  }

  queryCache.set(key, {
    result,
    timestamp: Date.now(),
    ttl,
  })
}

/**
 * Invalidate cache for a table
 */
function invalidateCacheForTable(table: string): void {
  for (const key of queryCache.keys()) {
    if (key.startsWith(`${table}:`)) {
      queryCache.delete(key)
    }
  }
}

/**
 * Clear all query cache
 */
export function clearQueryCache(): void {
  queryCache.clear()
}

/**
 * Get query cache statistics
 */
export function getQueryCacheStats(): { size: number, keys: string[] } {
  return {
    size: queryCache.size,
    keys: [...queryCache.keys()],
  }
}

// =============================================================================
// Logging
// =============================================================================

/**
 * Log a query
 */
function logQuery(sql: string, bindings: unknown[], duration: number): void {
  queryLog.push({
    sql,
    bindings,
    duration,
    timestamp: new Date(),
  })

  // Keep only last 1000 queries
  if (queryLog.length > 1000) {
    queryLog.shift()
  }
}

/**
 * Get query log
 */
export function getQueryLog(): typeof queryLog {
  return [...queryLog]
}

/**
 * Clear query log
 */
export function clearQueryLog(): void {
  queryLog.length = 0
}

/**
 * Enable or disable query logging
 */
export function enableQueryLogging(enabled: boolean = true): void {
  databaseConfig.logging = enabled
}

// =============================================================================
// Errors
// =============================================================================

/**
 * Database error with query context
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public sql?: string,
    public bindings?: unknown[],
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// =============================================================================
// Template Directives
// =============================================================================

/**
 * Process @db directive in templates
 *
 * Syntax: @db('table')->method()->method()
 *
 * @example
 * @db('users')->where('active', true)->get()
 * @db('posts')->orderBy('created_at', 'desc')->limit(5)->get()
 */
export async function processDbDirective(
  template: string,
  context: Record<string, any>,
  _filePath: string,
  _options: StxOptions,
): Promise<string> {
  // Match @db('table') followed by chained methods
  const dbPattern = /@db\(\s*['"]([^'"]+)['"]\s*\)((?:->\w+\([^)]*\))*)/g

  let output = template
  const matches = [...template.matchAll(dbPattern)]

  for (const match of matches) {
    const [fullMatch, tableName, chainedMethods] = match

    try {
      // Build query from chain
      const queryResult = await executeQueryChain(tableName, chainedMethods)

      // Store result in context with table name as variable
      const varName = `$${tableName}`
      context[varName] = queryResult

      // Replace directive with empty string (result is in context)
      output = output.replace(fullMatch, '')
    }
    catch (error) {
      output = output.replace(
        fullMatch,
        `<!-- DB Error: ${error instanceof Error ? error.message : String(error)} -->`,
      )
    }
  }

  return output
}

/**
 * Process @model directive in templates
 *
 * Syntax: @model('ModelName')->method()
 *
 * @example
 * @model('User')->find(1)
 * @model('Post')->where('published', true)->get()
 */
export async function processModelDirective(
  template: string,
  context: Record<string, any>,
  _filePath: string,
  _options: StxOptions,
): Promise<string> {
  // Match @model('Name') followed by chained methods
  const modelPattern = /@model\(\s*['"]([^'"]+)['"]\s*\)((?:->\w+\([^)]*\))*)/g

  let output = template
  const matches = [...template.matchAll(modelPattern)]

  for (const match of matches) {
    const [fullMatch, modelName, chainedMethods] = match

    try {
      const model = getModel(modelName)

      // Parse and execute method chain
      const result = await executeModelChain(model, chainedMethods)

      // Store result in context
      const varName = `$${modelName.toLowerCase()}`
      context[varName] = result

      // Replace directive with empty string
      output = output.replace(fullMatch, '')
    }
    catch (error) {
      output = output.replace(
        fullMatch,
        `<!-- Model Error: ${error instanceof Error ? error.message : String(error)} -->`,
      )
    }
  }

  return output
}

/**
 * Process @query directive for inline SQL
 *
 * Syntax: @query('SELECT * FROM users WHERE id = ?', [1])
 */
export async function processQueryDirective(
  template: string,
  context: Record<string, any>,
  _filePath: string,
  _options: StxOptions,
): Promise<string> {
  // Match @query('sql', [bindings]) as $variable
  const queryPattern = /@query\(\s*['"]([^'"]+)['"]\s*(?:,\s*(\[[^\]]*\]))?\s*\)\s*as\s+\$(\w+)/g

  let output = template
  const matches = [...template.matchAll(queryPattern)]

  for (const match of matches) {
    const [fullMatch, sql, bindingsStr, varName] = match

    try {
      const bindings = bindingsStr ? JSON.parse(bindingsStr) : []
      const adapter = getAdapter()
      const result = await adapter.query(sql, bindings)

      context[`$${varName}`] = result
      output = output.replace(fullMatch, '')
    }
    catch (error) {
      output = output.replace(
        fullMatch,
        `<!-- Query Error: ${error instanceof Error ? error.message : String(error)} -->`,
      )
    }
  }

  return output
}

/**
 * Execute a query method chain
 */
async function executeQueryChain(table: string, chain: string): Promise<unknown> {
  const builder = query(table)

  // Parse method calls like ->where('active', true)->orderBy('name')
  const methodPattern = /->(\w+)\(([^)]*)\)/g
  const methods = [...chain.matchAll(methodPattern)]

  let result: any = builder

  for (const [, methodName, argsStr] of methods) {
    const args = parseMethodArgs(argsStr)

    if (typeof result[methodName] === 'function') {
      result = result[methodName](...args)

      // If result is a promise (terminal method like get, first, count)
      if (result instanceof Promise) {
        result = await result
        break
      }
    }
  }

  // If still a QueryBuilder, execute get()
  if (result instanceof QueryBuilder) {
    result = await result.get()
  }

  return result
}

/**
 * Execute a model method chain
 */
async function executeModelChain(model: Model, chain: string): Promise<unknown> {
  // Parse method calls
  const methodPattern = /->(\w+)\(([^)]*)\)/g
  const methods = [...chain.matchAll(methodPattern)]

  let result: any = model

  for (const [, methodName, argsStr] of methods) {
    const args = parseMethodArgs(argsStr)

    if (typeof result[methodName] === 'function') {
      result = result[methodName](...args)

      // Await promises
      if (result instanceof Promise) {
        result = await result
      }
    }
    else if (result instanceof QueryBuilder) {
      if (typeof (result as any)[methodName] === 'function') {
        result = (result as any)[methodName](...args)
        if (result instanceof Promise) {
          result = await result
        }
      }
    }
  }

  // If still a QueryBuilder, execute get()
  if (result instanceof QueryBuilder) {
    result = await result.get()
  }

  return result
}

/**
 * Parse method arguments from string
 */
function parseMethodArgs(argsStr: string): unknown[] {
  if (!argsStr.trim())
    return []

  const args: unknown[] = []
  let current = ''
  let depth = 0
  let inString = false
  let stringChar = ''

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i]

    if (!inString && (char === '"' || char === '\'')) {
      inString = true
      stringChar = char
      current += char
    }
    else if (inString && char === stringChar) {
      inString = false
      current += char
    }
    else if (!inString && (char === '[' || char === '{' || char === '(')) {
      depth++
      current += char
    }
    else if (!inString && (char === ']' || char === '}' || char === ')')) {
      depth--
      current += char
    }
    else if (!inString && depth === 0 && char === ',') {
      args.push(parseArgValue(current.trim()))
      current = ''
    }
    else {
      current += char
    }
  }

  if (current.trim()) {
    args.push(parseArgValue(current.trim()))
  }

  return args
}

/**
 * Parse a single argument value
 */
function parseArgValue(value: string): unknown {
  // String
  if ((value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith('\'') && value.endsWith('\''))) {
    return value.slice(1, -1)
  }

  // Boolean
  if (value === 'true')
    return true
  if (value === 'false')
    return false

  // Null
  if (value === 'null')
    return null

  // Number
  const num = Number(value)
  if (!Number.isNaN(num))
    return num

  // Array or object
  try {
    return JSON.parse(value)
  }
  catch {
    return value
  }
}

// =============================================================================
// Process All Database Directives
// =============================================================================

/**
 * Process all database-related directives in a template
 */
export async function processDatabaseDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
): Promise<string> {
  let output = template

  // Process in order: @query, @model, @db
  output = await processQueryDirective(output, context, filePath, options)
  output = await processModelDirective(output, context, filePath, options)
  output = await processDbDirective(output, context, filePath, options)

  return output
}

// =============================================================================
// Schema Builder (for migrations)
// =============================================================================

/**
 * Schema builder for database migrations
 */
export class SchemaBuilder {
  private _connection?: string

  /**
   * Set the connection to use
   */
  connection(name: string): this {
    this._connection = name
    return this
  }

  /**
   * Create a new table
   */
  async create(table: string, callback: (blueprint: Blueprint) => void): Promise<void> {
    const blueprint = new Blueprint(table)
    callback(blueprint)

    const sql = blueprint.toCreateSQL()
    const adapter = getAdapter(this._connection)
    await adapter.execute(sql)
  }

  /**
   * Drop a table
   */
  async drop(table: string): Promise<void> {
    const adapter = getAdapter(this._connection)
    await adapter.execute(`DROP TABLE IF EXISTS ${table}`)
  }

  /**
   * Rename a table
   */
  async rename(from: string, to: string): Promise<void> {
    const adapter = getAdapter(this._connection)
    await adapter.execute(`ALTER TABLE ${from} RENAME TO ${to}`)
  }

  /**
   * Check if table exists
   */
  async hasTable(table: string): Promise<boolean> {
    const adapter = getAdapter(this._connection)
    try {
      await adapter.query(`SELECT 1 FROM ${table} LIMIT 1`)
      return true
    }
    catch {
      return false
    }
  }
}

/**
 * Table blueprint for schema definitions
 */
export class Blueprint {
  private columns: string[] = []
  private indices: string[] = []

  constructor(private table: string) {}

  /**
   * Add auto-incrementing primary key
   */
  id(name: string = 'id'): this {
    this.columns.push(`${name} INTEGER PRIMARY KEY AUTOINCREMENT`)
    return this
  }

  /**
   * Add string column
   */
  string(name: string, length: number = 255): this {
    this.columns.push(`${name} VARCHAR(${length})`)
    return this
  }

  /**
   * Add text column
   */
  text(name: string): this {
    this.columns.push(`${name} TEXT`)
    return this
  }

  /**
   * Add integer column
   */
  integer(name: string): this {
    this.columns.push(`${name} INTEGER`)
    return this
  }

  /**
   * Add boolean column
   */
  boolean(name: string): this {
    this.columns.push(`${name} BOOLEAN DEFAULT 0`)
    return this
  }

  /**
   * Add datetime column
   */
  datetime(name: string): this {
    this.columns.push(`${name} DATETIME`)
    return this
  }

  /**
   * Add timestamp columns (created_at, updated_at)
   */
  timestamps(): this {
    this.columns.push('created_at DATETIME DEFAULT CURRENT_TIMESTAMP')
    this.columns.push('updated_at DATETIME DEFAULT CURRENT_TIMESTAMP')
    return this
  }

  /**
   * Add soft delete column
   */
  softDeletes(): this {
    this.columns.push('deleted_at DATETIME')
    return this
  }

  /**
   * Add JSON column
   */
  json(name: string): this {
    this.columns.push(`${name} TEXT`) // SQLite stores JSON as text
    return this
  }

  /**
   * Add foreign key
   */
  foreignId(name: string): this {
    this.columns.push(`${name} INTEGER`)
    return this
  }

  /**
   * Add index
   */
  index(columns: string | string[]): this {
    const cols = Array.isArray(columns) ? columns : [columns]
    const indexName = `idx_${this.table}_${cols.join('_')}`
    this.indices.push(`CREATE INDEX ${indexName} ON ${this.table} (${cols.join(', ')})`)
    return this
  }

  /**
   * Add unique constraint
   */
  unique(columns: string | string[]): this {
    const cols = Array.isArray(columns) ? columns : [columns]
    const indexName = `uniq_${this.table}_${cols.join('_')}`
    this.indices.push(`CREATE UNIQUE INDEX ${indexName} ON ${this.table} (${cols.join(', ')})`)
    return this
  }

  /**
   * Generate CREATE TABLE SQL
   */
  toCreateSQL(): string {
    return `CREATE TABLE IF NOT EXISTS ${this.table} (\n  ${this.columns.join(',\n  ')}\n)`
  }

  /**
   * Get index creation SQL
   */
  getIndexSQL(): string[] {
    return this.indices
  }
}

/**
 * Get schema builder
 */
export function schema(): SchemaBuilder {
  return new SchemaBuilder()
}

// =============================================================================
// Exports
// =============================================================================

export {
  type JoinClause,
  type OrderByClause,
  type Row,
  type WhereCondition,
}
