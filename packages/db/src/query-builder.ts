import type { JoinClause, OrderByClause, QueryOperator, RawExpression, Row, WhereCondition } from './types'

export class QueryBuilder {
  private _table: string = ''
  private _columns: (string | RawExpression)[] = ['*']
  private _wheres: WhereCondition[] = []
  private _orders: OrderByClause[] = []
  private _joins: JoinClause[] = []
  private _groupBy: string[] = []
  private _having: WhereCondition[] = []
  private _limit?: number
  private _offset?: number
  private _distinct: boolean = false
  private _bindings: unknown[] = []

  constructor(table?: string) {
    if (table) this._table = table
  }

  table(name: string): this {
    this._table = name
    return this
  }

  from(name: string): this {
    return this.table(name)
  }

  select(...columns: (string | RawExpression)[]): this {
    this._columns = columns.length > 0 ? columns : ['*']
    return this
  }

  addSelect(...columns: (string | RawExpression)[]): this {
    if (this._columns[0] === '*') this._columns = columns
    else this._columns.push(...columns)
    return this
  }

  distinct(): this {
    this._distinct = true
    return this
  }

  where(column: string, operatorOrValue: QueryOperator | unknown, value?: unknown): this {
    let operator: QueryOperator = '='
    let actualValue: unknown = operatorOrValue
    if (value !== undefined) {
      operator = operatorOrValue as QueryOperator
      actualValue = value
    }
    this._wheres.push({ column, operator, value: actualValue, boolean: 'and' })
    return this
  }

  orWhere(column: string, operatorOrValue: QueryOperator | unknown, value?: unknown): this {
    let operator: QueryOperator = '='
    let actualValue: unknown = operatorOrValue
    if (value !== undefined) {
      operator = operatorOrValue as QueryOperator
      actualValue = value
    }
    this._wheres.push({ column, operator, value: actualValue, boolean: 'or' })
    return this
  }

  whereNull(column: string): this {
    this._wheres.push({ column, operator: 'is null', value: null, boolean: 'and' })
    return this
  }

  whereNotNull(column: string): this {
    this._wheres.push({ column, operator: 'is not null', value: null, boolean: 'and' })
    return this
  }

  whereIn(column: string, values: unknown[]): this {
    this._wheres.push({ column, operator: 'in', value: values, boolean: 'and' })
    return this
  }

  whereNotIn(column: string, values: unknown[]): this {
    this._wheres.push({ column, operator: 'not in', value: values, boolean: 'and' })
    return this
  }

  whereBetween(column: string, range: [unknown, unknown]): this {
    this._wheres.push({ column, operator: 'between', value: range, boolean: 'and' })
    return this
  }

  orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): this {
    this._orders.push({ column, direction })
    return this
  }

  groupBy(...columns: string[]): this {
    this._groupBy.push(...columns)
    return this
  }

  having(column: string, operator: QueryOperator, value: unknown): this {
    this._having.push({ column, operator, value, boolean: 'and' })
    return this
  }

  limit(n: number): this {
    this._limit = n
    return this
  }

  offset(n: number): this {
    this._offset = n
    return this
  }

  join(table: string, first: string, operator: string, second: string): this {
    this._joins.push({ type: 'inner', table, first, operator, second })
    return this
  }

  leftJoin(table: string, first: string, operator: string, second: string): this {
    this._joins.push({ type: 'left', table, first, operator, second })
    return this
  }

  rightJoin(table: string, first: string, operator: string, second: string): this {
    this._joins.push({ type: 'right', table, first, operator, second })
    return this
  }

  toSQL(): { sql: string, bindings: unknown[] } {
    const bindings: unknown[] = []
    const parts: string[] = []

    // SELECT
    const cols = this._columns.map(c =>
      typeof c === 'object' && '__raw' in c ? c.sql : c,
    ).join(', ')
    parts.push(`SELECT${this._distinct ? ' DISTINCT' : ''} ${cols}`)

    // FROM
    parts.push(`FROM ${this._table}`)

    // JOINs
    for (const j of this._joins) {
      parts.push(`${j.type.toUpperCase()} JOIN ${j.table} ON ${j.first} ${j.operator} ${j.second}`)
    }

    // WHERE
    if (this._wheres.length > 0) {
      const conditions = this._wheres.map((w, i) => {
        const prefix = i === 0 ? '' : ` ${w.boolean.toUpperCase()} `
        if (w.operator === 'is null') return `${prefix}${w.column} IS NULL`
        if (w.operator === 'is not null') return `${prefix}${w.column} IS NOT NULL`
        if (w.operator === 'in') {
          const vals = w.value as unknown[]
          const placeholders = vals.map(() => '?').join(', ')
          bindings.push(...vals)
          return `${prefix}${w.column} IN (${placeholders})`
        }
        if (w.operator === 'not in') {
          const vals = w.value as unknown[]
          const placeholders = vals.map(() => '?').join(', ')
          bindings.push(...vals)
          return `${prefix}${w.column} NOT IN (${placeholders})`
        }
        if (w.operator === 'between') {
          const [a, b] = w.value as [unknown, unknown]
          bindings.push(a, b)
          return `${prefix}${w.column} BETWEEN ? AND ?`
        }
        bindings.push(w.value)
        return `${prefix}${w.column} ${w.operator} ?`
      })
      parts.push(`WHERE ${conditions.join('')}`)
    }

    // GROUP BY
    if (this._groupBy.length > 0) {
      parts.push(`GROUP BY ${this._groupBy.join(', ')}`)
    }

    // HAVING
    if (this._having.length > 0) {
      const havingParts = this._having.map((h, i) => {
        const prefix = i === 0 ? '' : ` ${h.boolean.toUpperCase()} `
        bindings.push(h.value)
        return `${prefix}${h.column} ${h.operator} ?`
      })
      parts.push(`HAVING ${havingParts.join('')}`)
    }

    // ORDER BY
    if (this._orders.length > 0) {
      parts.push(`ORDER BY ${this._orders.map(o => `${o.column} ${o.direction.toUpperCase()}`).join(', ')}`)
    }

    // LIMIT / OFFSET
    if (this._limit !== undefined) {
      parts.push(`LIMIT ${this._limit}`)
    }
    if (this._offset !== undefined) {
      parts.push(`OFFSET ${this._offset}`)
    }

    return { sql: parts.join(' '), bindings }
  }

  toInsertSQL(data: Row): { sql: string, bindings: unknown[] } {
    const keys = Object.keys(data)
    const placeholders = keys.map(() => '?').join(', ')
    const bindings = keys.map(k => data[k])
    return {
      sql: `INSERT INTO ${this._table} (${keys.join(', ')}) VALUES (${placeholders})`,
      bindings,
    }
  }

  toUpdateSQL(data: Row): { sql: string, bindings: unknown[] } {
    const bindings: unknown[] = []
    const sets = Object.entries(data).map(([k, v]) => {
      bindings.push(v)
      return `${k} = ?`
    })

    const { sql: whereSql, bindings: whereBindings } = this._buildWhereClause()
    bindings.push(...whereBindings)

    return {
      sql: `UPDATE ${this._table} SET ${sets.join(', ')}${whereSql ? ` WHERE ${whereSql}` : ''}`,
      bindings,
    }
  }

  toDeleteSQL(): { sql: string, bindings: unknown[] } {
    const { sql: whereSql, bindings } = this._buildWhereClause()
    return {
      sql: `DELETE FROM ${this._table}${whereSql ? ` WHERE ${whereSql}` : ''}`,
      bindings,
    }
  }

  toCountSQL(): { sql: string, bindings: unknown[] } {
    const { sql: whereSql, bindings } = this._buildWhereClause()
    return {
      sql: `SELECT COUNT(*) as count FROM ${this._table}${whereSql ? ` WHERE ${whereSql}` : ''}`,
      bindings,
    }
  }

  private _buildWhereClause(): { sql: string, bindings: unknown[] } {
    if (this._wheres.length === 0) return { sql: '', bindings: [] }
    const bindings: unknown[] = []
    const conditions = this._wheres.map((w, i) => {
      const prefix = i === 0 ? '' : ` ${w.boolean.toUpperCase()} `
      if (w.operator === 'is null') return `${prefix}${w.column} IS NULL`
      if (w.operator === 'is not null') return `${prefix}${w.column} IS NOT NULL`
      bindings.push(w.value)
      return `${prefix}${w.column} ${w.operator} ?`
    })
    return { sql: conditions.join(''), bindings }
  }
}

export function raw(sql: string, bindings: unknown[] = []): RawExpression {
  return { __raw: true, sql, bindings }
}
