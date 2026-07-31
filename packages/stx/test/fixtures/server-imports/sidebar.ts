export function buildSidebarRoleMap(): string {
  return JSON.stringify({
    deployments: ['admin'],
    errors: ['admin', 'developer'],
  })
}
