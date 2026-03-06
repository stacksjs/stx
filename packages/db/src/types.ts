export type DatabaseDriver = 'sqlite' | 'postgres' | 'mysql' | 'custom'

export interface ConnectionConfig {
  driver: DatabaseDriver
  database: string
  host?: string
  port?: number
  username?: string
  password?: string
  poolSize?: number
  timeout?: number
  ssl?: boolean | Record<string, unknown>
  options?: Record<string, unknown>
}

export interface DatabaseConfig {
  default: string
  connections: Record<string, ConnectionConfig>
  logging?: boolean
  cacheTTL?: number
  maxCacheSize?: number
}

export type QueryOperator = '=' | '!=' | '<' | '<=' | '>' | '>=' | 'like' | 'in' | 'not in' | 'between' | 'is null' | 'is not null'

export interface WhereCondition {
  column: string
  operator: QueryOperator
  value: unknown
  boolean: 'and' | 'or'
}

export interface OrderByClause {
  column: string
  direction: 'asc' | 'desc'
}

export interface JoinClause {
  type: 'inner' | 'left' | 'right' | 'cross'
  table: string
  first: string
  operator: string
  second: string
}

export interface RawExpression {
  __raw: true
  sql: string
  bindings: unknown[]
}

export type Row = Record<string, unknown>

export interface RelationshipDefinition {
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany'
  model: string
  foreignKey?: string
  localKey?: string
  pivotTable?: string
  pivotForeignKey?: string
  pivotRelatedKey?: string
}

export interface ModelDefinition {
  table: string
  primaryKey?: string
  fillable?: string[]
  hidden?: string[]
  timestamps?: { createdAt?: string, updatedAt?: string } | boolean
  softDeletes?: string | boolean
  defaults?: Record<string, unknown>
  casts?: Record<string, 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array'>
  relationships?: Record<string, RelationshipDefinition>
  scopes?: Record<string, (query: any) => any>
}

export interface DatabaseAdapter {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  query: <T = Row>(sql: string, bindings?: unknown[]) => Promise<T[]>
  insert: (sql: string, bindings?: unknown[]) => Promise<unknown>
  execute: (sql: string, bindings?: unknown[]) => Promise<number>
  beginTransaction: () => Promise<void>
  commit: () => Promise<void>
  rollback: () => Promise<void>
  isConnected: () => boolean
}

export type ColumnType = 'id' | 'string' | 'text' | 'integer' | 'float' | 'boolean' | 'date' | 'datetime' | 'timestamp' | 'json' | 'blob'

export interface ColumnDefinition {
  name: string
  type: ColumnType
  nullable?: boolean
  unique?: boolean
  defaultValue?: unknown
  primaryKey?: boolean
  autoIncrement?: boolean
  references?: { table: string, column: string }
}

export interface TableSchema {
  name: string
  columns: ColumnDefinition[]
}

export interface MigrationResult {
  applied: string[]
  errors: string[]
}
