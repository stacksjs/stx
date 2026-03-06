import { describe, expect, test } from 'bun:test'
import { defineTable, tableSchemaToSQL } from '../src'

describe('defineTable', () => {
  test('creates a table schema', () => {
    const schema = defineTable('users', (t) => {
      t.id()
      t.string('name')
      t.string('email').unique()
      t.boolean('is_admin').default(false)
      t.timestamps()
    })

    expect(schema.name).toBe('users')
    expect(schema.columns).toHaveLength(6) // id, name, email, is_admin, created_at, updated_at
    expect(schema.columns[0].name).toBe('id')
    expect(schema.columns[0].type).toBe('id')
    expect(schema.columns[2].unique).toBe(true)
    expect(schema.columns[3].defaultValue).toBe(false)
  })

  test('supports nullable columns', () => {
    const schema = defineTable('posts', (t) => {
      t.id()
      t.string('title')
      t.text('body').nullable()
    })

    expect(schema.columns[2].nullable).toBe(true)
  })

  test('supports softDeletes', () => {
    const schema = defineTable('posts', (t) => {
      t.id()
      t.softDeletes()
    })

    expect(schema.columns[1].name).toBe('deleted_at')
    expect(schema.columns[1].nullable).toBe(true)
  })

  test('supports foreign key references', () => {
    const schema = defineTable('posts', (t) => {
      t.id()
      t.integer('user_id').references('users')
    })

    expect(schema.columns[1].references).toEqual({ table: 'users', column: 'id' })
  })
})

describe('tableSchemaToSQL', () => {
  test('generates CREATE TABLE SQL', () => {
    const schema = defineTable('users', (t) => {
      t.id()
      t.string('name')
      t.string('email').unique()
      t.boolean('is_admin').default(false)
      t.timestamps()
    })

    const sql = tableSchemaToSQL(schema)
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS users')
    expect(sql).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT')
    expect(sql).toContain('name TEXT NOT NULL')
    expect(sql).toContain('email TEXT NOT NULL UNIQUE')
    expect(sql).toContain('is_admin INTEGER NOT NULL DEFAULT false')
  })

  test('generates foreign key constraints', () => {
    const schema = defineTable('posts', (t) => {
      t.id()
      t.integer('user_id').references('users')
    })

    const sql = tableSchemaToSQL(schema)
    expect(sql).toContain('FOREIGN KEY (user_id) REFERENCES users(id)')
  })
})
