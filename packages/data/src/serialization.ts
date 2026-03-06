function prepareForSerialization(value: unknown): unknown {
  if (value instanceof Date) {
    return { __type: 'Date', value: value.toISOString() }
  }
  if (typeof value === 'bigint') {
    return { __type: 'BigInt', value: value.toString() }
  }
  if (value instanceof Map) {
    return { __type: 'Map', value: Array.from(value.entries()).map(([k, v]) => [k, prepareForSerialization(v)]) }
  }
  if (value instanceof Set) {
    return { __type: 'Set', value: Array.from(value).map(prepareForSerialization) }
  }
  if (value instanceof RegExp) {
    return { __type: 'RegExp', source: value.source, flags: value.flags }
  }
  if (Array.isArray(value)) {
    return value.map(prepareForSerialization)
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      result[k] = prepareForSerialization(v)
    }
    return result
  }
  return value
}

export function serialize(value: unknown): string {
  return JSON.stringify(prepareForSerialization(value))
}

export function deserialize<T = unknown>(json: string): T {
  return JSON.parse(json, (_key, val) => {
    if (val && typeof val === 'object' && '__type' in val) {
      switch (val.__type) {
        case 'Date':
          return new Date(val.value)
        case 'BigInt':
          return BigInt(val.value)
        case 'Map':
          return new Map(val.value)
        case 'Set':
          return new Set(val.value)
        case 'RegExp':
          return new RegExp(val.source, val.flags)
      }
    }
    return val
  })
}
