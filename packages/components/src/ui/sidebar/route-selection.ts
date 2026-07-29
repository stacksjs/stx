function normalizePath(path: string): string {
  const clean = (path || '/').split(/[?#]/, 1)[0] || '/'
  const withSlash = clean.startsWith('/') ? clean : `/${clean}`
  return withSlash.replace(/\/+$/, '') || '/'
}

function isLocalHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//')
}

export function findActiveSidebarHref(currentPath: string, hrefs: string[]): string | null {
  const current = normalizePath(currentPath)
  let best: string | null = null
  let bestLength = -1

  for (const href of hrefs) {
    if (!isLocalHref(href))
      continue

    const candidate = normalizePath(href)
    const matches = candidate === '/'
      ? current === '/'
      : current === candidate || current.startsWith(`${candidate}/`)

    if (matches && candidate.length > bestLength) {
      best = href
      bestLength = candidate.length
    }
  }

  return best
}
