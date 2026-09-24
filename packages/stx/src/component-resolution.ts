import fs from 'node:fs'
import path from 'node:path'

const pkgStxIndexCache = new Map<string, Map<string, string>>()

/** Shared package component index; editor checks bypass the renderer's cache. */
export function buildStxIndex(pkgDir: string, cache = true): Map<string, string> {
  const cached = pkgStxIndexCache.get(pkgDir)
  if (cache && cached) return cached

  const index = new Map<string, string>()
  const roots = [path.join(pkgDir, 'src'), path.join(pkgDir, 'dist'), pkgDir]

  function walk(dir: string, depth: number) {
    if (depth > 6) return
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    }
    catch {
      return
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
        walk(full, depth + 1)
      }
      else if (entry.isFile() && entry.name.endsWith('.stx')) {
        const base = entry.name.slice(0, -4)
        // Prefer shallower matches — only set if not already present
        if (!index.has(base)) index.set(base, full)
        const lower = base.toLowerCase()
        if (!index.has(lower)) index.set(lower, full)
        const kebab = base.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
        if (!index.has(kebab)) index.set(kebab, full)
      }
    }
  }

  for (const root of roots) {
    walk(root, 0)
    if (index.size > 0) break
  }

  if (cache) pkgStxIndexCache.set(pkgDir, index)
  return index
}

/**
 * Resolve a module specifier (e.g. '@stacksjs/components' or './foo') to a
 * package directory on disk, walking up node_modules from `fromDir`.
 */
export function resolvePackageDir(spec: string, fromDir: string): string | null {
  // Handle relative paths — caller should resolve those before calling here
  if (spec.startsWith('.') || spec.startsWith('/')) return null

  // Walk up looking for node_modules/<spec>
  let dir = fromDir
  while (true) {
    const candidate = path.join(dir, 'node_modules', spec)
    try {
      if (fs.statSync(candidate).isDirectory()) return candidate
    }
    catch {
      // Not here — keep walking
    }
    const parent = path.dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

export interface ComponentLookupOptions {
  componentsDir?: string
  projectRoot?: string
}

export interface ComponentLookupContext {
  __importedComponents?: Map<string, string>
  __originalFilePath?: string
}

export function componentImportCandidates(componentPath: string, filePath: string, options: ComponentLookupOptions = {}): string[] {
  return [
    path.resolve(path.dirname(filePath), `${componentPath}.stx`),
    path.resolve(path.dirname(filePath), componentPath),
    path.resolve(options.componentsDir || 'components', `${componentPath}.stx`),
    path.resolve(options.componentsDir || 'components', componentPath),
    componentPath.endsWith('.stx') ? componentPath : `${componentPath}.stx`,
  ]
}

function variants(name: string): string[] {
  const base = name.endsWith('.stx') ? name.slice(0, -4) : name
  const pascal = base.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')
  const kebab = base.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  return [base, pascal, kebab]
}

export function importedComponentPath(name: string, context?: ComponentLookupContext): string | undefined {
  const [base, pascal, kebab] = variants(name)
  for (const candidate of [base, base.toLowerCase(), pascal, kebab]) {
    const imported = context?.__importedComponents?.get(candidate)
    if (imported !== undefined)
      return imported
  }
}

/** The renderer and editor walk exactly the same ordered file candidates. */
export function* componentFileCandidates(name: string, fromFile: string, options: ComponentLookupOptions = {}, context?: ComponentLookupContext): Generator<string> {
  const names = variants(name)
  if (names[0].startsWith('./') || names[0].startsWith('../')) {
    yield path.resolve(path.dirname(fromFile), `${names[0]}.stx`)
    return
  }
  const files = [...new Set(names.map(base => `${base}.stx`))]
  const projectRoot = options.projectRoot || process.cwd()
  const directories = [
    ...(context?.__originalFilePath ? [path.join(path.dirname(context.__originalFilePath), 'components')] : []),
    ...(options.componentsDir ? [options.componentsDir] : []),
    path.join(path.dirname(fromFile), 'components'),
    path.resolve(projectRoot, 'src/components'),
    path.resolve(projectRoot, 'components'),
    ...(import.meta.dir ? [path.resolve(import.meta.dir, 'components')] : []),
  ]
  for (const directory of new Set(directories)) {
    for (const file of files)
      yield path.join(directory, file)
    try {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          for (const file of files)
            yield path.join(directory, entry.name, file)
        }
      }
    }
    catch {
      // Missing or unreadable directories are not component candidates.
    }
  }
}

/** Synchronous counterpart for TypeScript's synchronous language-service host. */
export function resolveComponentFileSync(name: string, fromFile: string, options: ComponentLookupOptions = {}, context?: ComponentLookupContext): string | null {
  const imported = importedComponentPath(name, context)
  if (imported !== undefined)
    return imported
  for (const candidate of componentFileCandidates(name, fromFile, options, context)) {
    try {
      if (fs.statSync(candidate, { throwIfNoEntry: false })?.isFile())
        return candidate
    }
    catch {
      // Match the renderer's non-throwing file-existence check.
    }
  }
  return null
}
