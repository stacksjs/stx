import fs from 'node:fs'
import path from 'node:path'

export function resolveLayoutChain(routeFilePath: string, pagesDir: string): string[] {
  const layouts: string[] = []
  let dir = path.dirname(routeFilePath)

  // Walk up from the route's directory to the pages root, collecting _layout.stx files
  while (dir.startsWith(pagesDir) || dir === pagesDir) {
    const layoutFile = path.join(dir, '_layout.stx')
    if (fs.existsSync(layoutFile)) {
      layouts.unshift(layoutFile) // Prepend so root layout is first
    }

    if (dir === pagesDir) break
    dir = path.dirname(dir)
  }

  return layouts
}
