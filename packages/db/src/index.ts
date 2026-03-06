export { QueryBuilder, raw } from './query-builder'
export { defineTable, TableBuilder, tableSchemaToSQL } from './schema'
export { configureDatabase, getAdapter, getDatabaseConfig, registerAdapter, resetDatabaseConfig, transaction } from './connection'
export { createModelInstance, defineModel, getModel, hasModel } from './model'
export type { Model, ModelInstance } from './model'
export type {
  ColumnDefinition,
  ColumnType,
  ConnectionConfig,
  DatabaseAdapter,
  DatabaseConfig,
  DatabaseDriver,
  JoinClause,
  MigrationResult,
  ModelDefinition,
  OrderByClause,
  QueryOperator,
  RawExpression,
  RelationshipDefinition,
  Row,
  TableSchema,
  WhereCondition,
} from './types'

import { QueryBuilder as _QB } from './query-builder'

export function db(table: string): _QB {
  return new _QB(table)
}
