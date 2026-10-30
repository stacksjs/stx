import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export interface ApplicationDataOptions {
  bundleIdentifier?: string
  home?: string
  platform?: NodeJS.Platform
}

/** Preserve a Mac app's existing sandbox data when moving to direct distribution. */
export function applicationDataDirectory(name: string, options: ApplicationDataOptions = {}): string {
  if (!name || name === '.' || name === '..' || /[/\\\0]/.test(name))
    throw new Error('Application data requires an application name')
  const home = options.home ?? homedir()
  const platform = options.platform ?? process.platform
  if (platform === 'darwin') {
    const id = options.bundleIdentifier
    if (id) {
      if (!/^[\w-]+(?:\.[\w-]+)+$/.test(id)) throw new Error('Invalid application bundle identifier')
      const container = join(home, 'Library/Containers', id)
      // Check only the container root: macOS protects its contents from other
      // apps. The signed app opens its own database after resolving this path.
      if (existsSync(container))
        return join(container, 'Data/Library/Application Support', name)
    }
    return join(home, 'Library/Application Support', name)
  }
  if (platform === 'win32') return join(process.env.LOCALAPPDATA || join(home, 'AppData/Local'), name)
  return join(process.env.XDG_DATA_HOME || join(home, '.local/share'), name)
}
