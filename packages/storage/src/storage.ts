import type { StorageConfig, StorageDriver } from './types'

let globalConfig: StorageConfig = {
  default: 'local',
  disks: {},
}

export function configureStorage(config: Partial<StorageConfig>): void {
  if (config.default !== undefined) {
    globalConfig.default = config.default
  }
  if (config.disks) {
    globalConfig.disks = { ...globalConfig.disks, ...config.disks }
  }
}

export function useStorage(disk?: string): StorageDriver {
  const diskName = disk || globalConfig.default
  const driver = globalConfig.disks[diskName]

  if (!driver) {
    throw new Error(
      `Storage disk "${diskName}" is not configured. Available disks: ${Object.keys(globalConfig.disks).join(', ') || '(none)'}`,
    )
  }

  return driver
}

export function createStorage(driver: StorageDriver): StorageDriver {
  return driver
}

/**
 * Reset configuration (useful for testing)
 */
export function resetStorage(): void {
  globalConfig = {
    default: 'local',
    disks: {},
  }
}
