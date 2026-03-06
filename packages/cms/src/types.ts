export interface CollectionDefinition {
  name: string
  directory: string
  extensions?: string[]
  slugField?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  schema?: SchemaDefinition
}

export interface SchemaDefinition {
  fields: Record<string, SchemaField>
}

export interface SchemaField {
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
  required?: boolean
  default?: unknown
}

export interface ContentItem<T = Record<string, unknown>> {
  slug: string
  title?: string
  date?: Date
  data: T
  content: string
  filePath: string
  collection: string
  excerpt?: string
}

export interface QueryOptions {
  limit?: number
  offset?: number
  sort?: { field: string, order: 'asc' | 'desc' }
  filter?: Record<string, unknown>
  where?: (item: ContentItem) => boolean
}
