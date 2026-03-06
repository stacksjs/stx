import { describe, expect, test } from 'bun:test'
import { db, QueryBuilder, raw } from '../src'

describe('QueryBuilder', () => {
  test('builds simple select', () => {
    const { sql, bindings } = new QueryBuilder('users').toSQL()
    expect(sql).toBe('SELECT * FROM users')
    expect(bindings).toEqual([])
  })

  test('builds select with columns', () => {
    const { sql } = new QueryBuilder('users').select('id', 'name').toSQL()
    expect(sql).toBe('SELECT id, name FROM users')
  })

  test('builds where clause', () => {
    const { sql, bindings } = new QueryBuilder('users').where('active', true).toSQL()
    expect(sql).toBe('SELECT * FROM users WHERE active = ?')
    expect(bindings).toEqual([true])
  })

  test('builds where with operator', () => {
    const { sql, bindings } = new QueryBuilder('users').where('age', '>=', 18).toSQL()
    expect(sql).toBe('SELECT * FROM users WHERE age >= ?')
    expect(bindings).toEqual([18])
  })

  test('builds multiple where clauses', () => {
    const { sql, bindings } = new QueryBuilder('users')
      .where('active', true)
      .where('role', 'admin')
      .toSQL()
    expect(sql).toBe('SELECT * FROM users WHERE active = ? AND role = ?')
    expect(bindings).toEqual([true, 'admin'])
  })

  test('builds orWhere', () => {
    const { sql } = new QueryBuilder('users')
      .where('role', 'admin')
      .orWhere('role', 'super')
      .toSQL()
    expect(sql).toContain('OR role = ?')
  })

  test('builds whereNull', () => {
    const { sql } = new QueryBuilder('users').whereNull('deleted_at').toSQL()
    expect(sql).toBe('SELECT * FROM users WHERE deleted_at IS NULL')
  })

  test('builds whereIn', () => {
    const { sql, bindings } = new QueryBuilder('users').whereIn('id', [1, 2, 3]).toSQL()
    expect(sql).toBe('SELECT * FROM users WHERE id IN (?, ?, ?)')
    expect(bindings).toEqual([1, 2, 3])
  })

  test('builds whereBetween', () => {
    const { sql, bindings } = new QueryBuilder('users').whereBetween('age', [18, 65]).toSQL()
    expect(sql).toBe('SELECT * FROM users WHERE age BETWEEN ? AND ?')
    expect(bindings).toEqual([18, 65])
  })

  test('builds orderBy', () => {
    const { sql } = new QueryBuilder('users').orderBy('name').toSQL()
    expect(sql).toContain('ORDER BY name ASC')
  })

  test('builds orderBy desc', () => {
    const { sql } = new QueryBuilder('users').orderBy('created_at', 'desc').toSQL()
    expect(sql).toContain('ORDER BY created_at DESC')
  })

  test('builds limit and offset', () => {
    const { sql } = new QueryBuilder('users').limit(10).offset(20).toSQL()
    expect(sql).toContain('LIMIT 10')
    expect(sql).toContain('OFFSET 20')
  })

  test('builds distinct', () => {
    const { sql } = new QueryBuilder('users').distinct().toSQL()
    expect(sql).toContain('SELECT DISTINCT')
  })

  test('builds groupBy', () => {
    const { sql } = new QueryBuilder('orders').groupBy('status').toSQL()
    expect(sql).toContain('GROUP BY status')
  })

  test('builds join', () => {
    const { sql } = new QueryBuilder('users')
      .join('posts', 'users.id', '=', 'posts.user_id')
      .toSQL()
    expect(sql).toContain('INNER JOIN posts ON users.id = posts.user_id')
  })

  test('builds leftJoin', () => {
    const { sql } = new QueryBuilder('users')
      .leftJoin('posts', 'users.id', '=', 'posts.user_id')
      .toSQL()
    expect(sql).toContain('LEFT JOIN posts ON users.id = posts.user_id')
  })

  test('builds insert SQL', () => {
    const { sql, bindings } = new QueryBuilder('users')
      .toInsertSQL({ name: 'Alice', email: 'alice@test.com' })
    expect(sql).toBe('INSERT INTO users (name, email) VALUES (?, ?)')
    expect(bindings).toEqual(['Alice', 'alice@test.com'])
  })

  test('builds update SQL', () => {
    const { sql, bindings } = new QueryBuilder('users')
      .where('id', 1)
      .toUpdateSQL({ name: 'Bob' })
    expect(sql).toBe('UPDATE users SET name = ? WHERE id = ?')
    expect(bindings).toEqual(['Bob', 1])
  })

  test('builds delete SQL', () => {
    const { sql, bindings } = new QueryBuilder('users')
      .where('id', 1)
      .toDeleteSQL()
    expect(sql).toBe('DELETE FROM users WHERE id = ?')
    expect(bindings).toEqual([1])
  })

  test('builds count SQL', () => {
    const { sql } = new QueryBuilder('users')
      .where('active', true)
      .toCountSQL()
    expect(sql).toBe('SELECT COUNT(*) as count FROM users WHERE active = ?')
  })

  test('db() convenience function', () => {
    const { sql } = db('users').where('active', true).toSQL()
    expect(sql).toBe('SELECT * FROM users WHERE active = ?')
  })

  test('raw expression', () => {
    const expr = raw('NOW()')
    expect(expr.__raw).toBe(true)
    expect(expr.sql).toBe('NOW()')
  })
})
