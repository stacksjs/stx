import type { Permission, User } from './types'

const permissions = new Map<string, Permission>()

export function definePermissions(perms: Permission[]): void {
  for (const perm of perms) {
    permissions.set(perm.name, perm)
  }
}

export function can(user: User, ability: string, ...args: any[]): boolean {
  const permission = permissions.get(ability)
  if (!permission)
    return false

  return permission.handler(user, ...args)
}

/** Exposed for testing — clears all registered permissions */
export function clearPermissions(): void {
  permissions.clear()
}
