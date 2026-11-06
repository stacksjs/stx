import fs from 'node:fs'
import path from 'node:path'

/**
 * Convert PascalCase to kebab-case with proper handling of consecutive uppercase letters.
 *
 * Examples:
 * - `UserCard` → `user-card`
 * - `XMLParser` → `xml-parser` (not `x-m-l-parser`)
 * - `HTMLElement` → `html-element`
 * - `MyURLParser` → `my-url-parser`
 * - `IOStream` → `io-stream`
 *
 * The algorithm:
 * 1. Insert hyphen before uppercase letters that follow lowercase letters
 * 2. Insert hyphen before the last uppercase in a sequence of uppercase letters (before lowercase)
 * 3. Convert to lowercase
 */
export function pascalToKebab(str: string): string {
  return str
    // Insert hyphen between lowercase and uppercase: userCard → user-Card
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    // Insert hyphen between consecutive uppercase and lowercase: XMLParser → XML-Parser
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

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
        const kebab = pascalToKebab(base)
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
  const kebab = pascalToKebab(base)
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

/**
 * The package a file belongs to, when that is not the project being built.
 *
 * Walking up to the nearest package.json answers "whose file is this" for both
 * an installed dependency and a workspace package symlinked into node_modules,
 * where a realpath would land outside node_modules and look like the app's own.
 * A file in the host project returns undefined, so nothing about app
 * resolution changes.
 */
export function owningPackageRoot(fromFile: string, projectRoot?: string): string | undefined {
  const root = projectRoot ? path.resolve(projectRoot) : undefined
  let dir = path.dirname(path.resolve(fromFile))
  for (;;) {
    if (fs.existsSync(path.join(dir, 'package.json')))
      return root && dir === root ? undefined : dir
    const parent = path.dirname(dir)
    if (parent === dir)
      return undefined
    dir = parent
  }
}

/** Conventional component roots inside a package that declares none. */
const PACKAGE_COMPONENT_DIRS = ['src/ui', 'src/components', 'components', 'dist']

/**
 * Where a tag written INSIDE a package should look first (stacksjs/stx#2170).
 *
 * Resolution ranked the host's directories ahead of the referencing file's own,
 * so `<Avatar>` written inside `@stacksjs/components` was answered by the app's
 * `Avatar`, and the package's component rendered against markup it was never
 * written for. In stacksjs/stacks#3213 that produced three native diagnostics
 * per avatar, and moving the host's Avatar aside took them from nine to zero.
 *
 * It cannot be fixed by ranking packages first everywhere: an app writing
 * `<EmptyState>` must still get the framework's (stacksjs/stx#2927). The two
 * are different questions, and the file holding the tag is what separates them.
 *
 * A package may name its own roots in package.json, which is the only thing
 * that works for one shipping a flat, content-hashed dist where neither a
 * `components/` sibling nor a plain `Name.stx` exists:
 *
 *   { "stx": { "components": ["./src/ui", "./src/components"] } }
 *
 * Otherwise the conventional roots are tried, plus the directory holding the
 * file itself, which is what a flat package needs.
 */
export function packageComponentDirs(fromFile: string, projectRoot?: string): string[] {
  const resolved = path.resolve(fromFile)
  // Without a known project root, "the nearest package.json" would be the app's
  // own for an app file, and this would start ranking a page's own directory
  // above the configured one. An installed dependency is the one case that can
  // be recognised without that root, so it is the only one taken.
  if (!projectRoot && !resolved.split(path.sep).includes('node_modules'))
    return []
  const pkg = owningPackageRoot(resolved, projectRoot)
  if (!pkg)
    return []
  let declared: string[] = []
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(pkg, 'package.json'), 'utf8')) as { stx?: { components?: unknown } }
    const listed = manifest.stx?.components
    if (Array.isArray(listed))
      declared = listed.filter((entry): entry is string => typeof entry === 'string')
  }
  catch {
    // An unreadable or malformed manifest just means no declared roots.
  }
  const roots = declared.length ? declared : PACKAGE_COMPONENT_DIRS
  // The file's own directory first: a flat package keeps its components beside
  // whatever references them.
  return [path.dirname(path.resolve(fromFile)), ...roots.map(entry => path.resolve(pkg, entry))]
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
    // A tag inside a package is that package's question first; for a file in
    // the project this list is empty and the order below is unchanged.
    ...packageComponentDirs(fromFile, options.projectRoot),
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
