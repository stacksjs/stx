import type { ColumnDefinition, ColumnType, TableSchema } from './types'

export class TableBuilder {
  columns: ColumnDefinition[] = []
  private _current: ColumnDefinition | null = null

  private addColumn(name: string, type: ColumnType): this {
    this._current = { name, type }
    this.columns.push(this._current)
    return this
  }

  id(name = 'id'): this {
    return this.addColumn(name, 'id')
  }

  string(name: string, _length?: number): this {
    return this.addColumn(name, 'string')
  }

  text(name: string): this {
    return this.addColumn(name, 'text')
  }

  integer(name: string): this {
    return this.addColumn(name, 'integer')
  }

  float(name: string): this {
    return this.addColumn(name, 'float')
  }

  boolean(name: string): this {
    return this.addColumn(name, 'boolean')
  }

  date(name: string): this {
    return this.addColumn(name, 'date')
  }

  datetime(name: string): this {
    return this.addColumn(name, 'datetime')
  }

  timestamp(name: string): this {
    return this.addColumn(name, 'timestamp')
  }

  json(name: string): this {
    return this.addColumn(name, 'json')
  }

  blob(name: string): this {
    return this.addColumn(name, 'blob')
  }

  timestamps(): this {
    this.addColumn('created_at', 'timestamp')
    this.addColumn('updated_at', 'timestamp')
    return this
  }

  softDeletes(name = 'deleted_at'): this {
    return this.addColumn(name, 'timestamp').nullable()
  }

  nullable(): this {
    if (this._current) this._current.nullable = true
    return this
  }

  unique(): this {
    if (this._current) this._current.unique = true
    return this
  }

  default(value: unknown): this {
    if (this._current) this._current.defaultValue = value
    return this
  }

  references(table: string, column = 'id'): this {
    if (this._current) this._current.references = { table, column }
    return this
  }
}

export function defineTable(name: string, builder: (t: TableBuilder) => void): TableSchema {
  const t = new TableBuilder()
  builder(t)
  return { name, columns: t.columns }
}

function columnTypeToSQL(col: ColumnDefinition): string {
  const typeMap: Record<ColumnType, string> = {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    string: 'TEXT',
    text: 'TEXT',
    integer: 'INTEGER',
    float: 'REAL',
    boolean: 'INTEGER',
    date: 'TEXT',
    datetime: 'TEXT',
    timestamp: 'TEXT',
    json: 'TEXT',
    blob: 'BLOB',
  }

  const parts = [`${col.name} ${typeMap[col.type]}`]
  if (col.type !== 'id') {
    if (!col.nullable) parts.push('NOT NULL')
    if (col.unique) parts.push('UNIQUE')
    if (col.defaultValue !== undefined) {
      const val = typeof col.defaultValue === 'string' ? `'${col.defaultValue}'` : String(col.defaultValue)
      parts.push(`DEFAULT ${val}`)
    }
  }
  return parts.join(' ')
}

export function tableSchemaToSQL(schema: TableSchema): string {
  const columns = schema.columns.map(columnTypeToSQL)
  const fks = schema.columns
    .filter(c => c.references)
    .map(c => `FOREIGN KEY (${c.name}) REFERENCES ${c.references!.table}(${c.references!.column})`)
  const all = [...columns, ...fks]
  return `CREATE TABLE IF NOT EXISTS ${schema.name} (\n  ${all.join(',\n  ')}\n)`
}
