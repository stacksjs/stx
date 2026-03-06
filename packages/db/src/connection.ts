import type { DatabaseAdapter, DatabaseConfig, Row } from './types'

let databaseConfig: DatabaseConfig = {
  default: 'sqlite',
  connections: {},
  logging: false,
  cacheTTL: 0,
  maxCacheSize: 1000,
}

const adapters: Record<string, DatabaseAdapter> = {}

export function configureDatabase(config: Partial<DatabaseConfig>): void {
  databaseConfig = { ...databaseConfig, ...config }
}

export function getDatabaseConfig(): DatabaseConfig {
  return { ...databaseConfig }
}

export function resetDatabaseConfig(): void {
  databaseConfig = {
    default: 'sqlite',
    connections: {},
    logging: false,
    cacheTTL: 0,
    maxCacheSize: 1000,
  }
  for (const key of Object.keys(adapters)) {
    delete adapters[key]
  }
}

export function registerAdapter(name: string, adapter: DatabaseAdapter): void {
  adapters[name] = adapter
}

export function getAdapter(connection?: string): DatabaseAdapter {
  const name = connection || databaseConfig.default
  const adapter = adapters[name]
  if (!adapter) {
    throw new Error(`Database adapter '${name}' not registered. Call registerAdapter() first.`)
  }
  return adapter
}

export async function transaction<T>(
  callback: (adapter: DatabaseAdapter) => Promise<T>,
  connection?: string,
): Promise<T> {
  const adapter = getAdapter(connection)
  await adapter.beginTransaction()
  try {
    const result = await callback(adapter)
    await adapter.commit()
    return result
  }
  catch (error) {
    await adapter.rollback()
    throw error
  }
}
