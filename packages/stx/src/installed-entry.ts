import os from 'node:os'
import { join } from 'node:path'

/** Resolve runtime assets from the app's install, never Bun's global cache. */
export function resolveInstalledEntry(specifier: string, root = process.cwd()): string | undefined {
  try {
    const resolved = typeof Bun !== 'undefined' ? Bun.resolveSync(specifier, root) : undefined
    return resolved && isInstalledEntry(resolved) ? resolved : undefined
  }
  catch {
    return undefined
  }
}

/**
 * With no app install, Bun can resolve an unrelated release in its global
 * package cache. Refuse that copy: its version and dependencies do not belong
 * to this server. Linked workspaces remain valid even outside node_modules.
 */
export function isInstalledEntry(path: string, env: Record<string, string | undefined> = process.env): boolean {
  const normalized = path.replace(/\\/g, '/')
  if (normalized.split('/').some(segment => /@\d[^/]*@@@\d+$/.test(segment)))
    return false
  const caches = [
    env.BUN_INSTALL_CACHE_DIR,
    join(env.BUN_INSTALL || join(os.homedir(), '.bun'), 'install', 'cache'),
  ].filter((dir): dir is string => !!dir).map(dir => `${dir.replace(/\\/g, '/').replace(/\/$/, '')}/`)
  return !caches.some(cache => normalized.startsWith(cache))
}
