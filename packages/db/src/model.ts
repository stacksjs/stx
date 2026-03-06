import type { ModelDefinition, Row } from './types'
import { QueryBuilder } from './query-builder'

export interface ModelInstance {
  get: (key: string) => unknown
  set: (key: string, value: unknown) => void
  toJSON: () => Row
  exists: boolean
  attributes: Row
  original: Row
  isDirty: (key?: string) => boolean
}

export interface Model {
  name: string
  definition: ModelDefinition
  query: () => QueryBuilder
  where: (column: string, operatorOrValue: unknown, value?: unknown) => QueryBuilder
}

const models: Record<string, Model> = {}

export function defineModel(name: string, definition: ModelDefinition): Model {
  const model: Model = {
    name,
    definition,
    query() {
      return new QueryBuilder(definition.table)
    },
    where(column: string, operatorOrValue: unknown, value?: unknown) {
      return new QueryBuilder(definition.table).where(column, operatorOrValue, value)
    },
  }

  models[name] = model
  return model
}

export function getModel(name: string): Model {
  const model = models[name]
  if (!model) throw new Error(`Model '${name}' not defined`)
  return model
}

export function hasModel(name: string): boolean {
  return name in models
}

export function createModelInstance(data: Row): ModelInstance {
  const attributes = { ...data }
  const original = { ...data }

  return {
    get(key: string) { return attributes[key] },
    set(key: string, value: unknown) { attributes[key] = value },
    toJSON() { return { ...attributes } },
    exists: true,
    attributes,
    original,
    isDirty(key?: string) {
      if (key) return attributes[key] !== original[key]
      return Object.keys(attributes).some(k => attributes[k] !== original[k])
    },
  }
}
