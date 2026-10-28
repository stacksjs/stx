import type { Dirent } from 'node:fs'
import type { StxOptions } from '@stacksjs/stx'
import path from 'node:path'
import { readdir, readFile, stat } from 'node:fs/promises'
import { componentImportCandidates, pascalToKebab } from '@stacksjs/stx/component-resolution'
import { splitTopLevelArgs } from '@stacksjs/stx/directive-arguments'
import { extractParenthesizedExpression } from '@stacksjs/stx/parser/directive-parser'
import { resolveTemplatePath } from '@stacksjs/stx/utils'

export const IMAGE_BUILTIN_PATTERN = /<(?:StxImage|Image|stx-image|stx-img)[\s/>]|@image\s*\(/

export interface ImageTemplateScope {
  /** Discovered, non-excluded pages, with overridden copies removed. */
  pages: readonly string[]
  options: Partial<StxOptions>
  pluginComponentDirs?: readonly string[]
}

/**
 * Walk literal template dependencies, not cwd. No template code is executed:
 * conditional includes count conservatively; runtime-computed paths need
 * imageWarmup: true. Unused resource definitions are never entry points.
 */
export async function servedTemplatesUseImageBuiltins(root: string, scope: ImageTemplateScope): Promise<boolean> {
  const options: StxOptions = { ...scope.options, root }
  const absolute = (file: string) => path.resolve(root, file)
  for (const key of ['componentsDir', 'layoutsDir', 'fallbackLayoutsDir', 'fallbackComponentsDir', 'partialsDir'] as const) {
    if (options[key])
      options[key] = absolute(options[key])
  }
  if (options.additionalComponentsDirs)
    options.additionalComponentsDirs = options.additionalComponentsDirs.map(absolute)
  const directories = new Map<string, Promise<string[]>>()
  const sources = new Map<string, Promise<string>>()

  // Each directory is read once and every "is this a file?" is answered from
  // that listing. Component resolution asks the same directories the same
  // questions for every tag on every page, and a tag that resolves nowhere
  // (a custom element) asks every component directory and each of its
  // subdirectories. Asked of the filesystem, that was ~50 s of stat calls for
  // a 128-page dashboard, run on the dev server's thread after it bound.
  const listings = new Map<string, Promise<{ exact: Map<string, Dirent>, folded: Set<string> } | null>>()
  const isFileCache = new Map<string, Promise<boolean>>()

  function listing(dir: string): Promise<{ exact: Map<string, Dirent>, folded: Set<string> } | null> {
    let entries = listings.get(dir)
    if (!entries) {
      entries = readdir(dir, { withFileTypes: true }).then(
        list => ({ exact: new Map(list.map(entry => [entry.name, entry])), folded: new Set(list.map(entry => entry.name.toLowerCase())) }),
        () => null,
      )
      listings.set(dir, entries)
    }
    return entries
  }

  function isFile(file: string): Promise<boolean> {
    let known = isFileCache.get(file)
    if (!known) {
      known = (async () => {
        const entries = await listing(path.dirname(file))
        if (!entries)
          return false
        const name = path.basename(file)
        const entry = entries.exact.get(name)
        if (entry?.isFile())
          return true
        // A symlink is followed, as stat follows it. A name that differs only
        // in case is decided by the filesystem itself: case-insensitive ones
        // (the macOS default) find `button.stx` for `Button.stx`, others do not.
        if (entry?.isSymbolicLink() || (!entry && entries.folded.has(name.toLowerCase())))
          return stat(file).then(result => result.isFile(), () => false)
        return false
      })()
      isFileCache.set(file, known)
    }
    return known
  }

  async function firstFile(candidates: string[]): Promise<string | undefined> {
    for (const candidate of candidates) {
      const file = absolute(candidate)
      if (await isFile(file))
        return file
    }
  }

  function componentDirectories(directory: string): Promise<string[]> {
    const dir = absolute(directory)
    let files = directories.get(dir)
    if (!files) {
      files = (async () => {
        const result: string[] = []
        const pending = [{ dir, depth: 0 }]
        while (pending.length) {
          const current = pending.pop()!
          if (current.depth >= 8)
            continue
          const entries = await readdir(current.dir, { withFileTypes: true }).catch(() => [])
          for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
              const child = path.join(current.dir, entry.name)
              result.push(child)
              pending.push({ dir: child, depth: current.depth + 1 })
            }
          }
        }
        return result
      })()
      directories.set(dir, files)
    }
    return files
  }

  // What a name resolves to depends on the name, the page's directory and the
  // referencing file's directory, and nothing else once the page's own
  // imports are ruled out: shared layouts and components repeat the same tags
  // on every page, so each answer is worked out once.
  const resolutions = new Map<string, Promise<string | undefined>>()

  function component(name: string, file: string, page: string, imported: Map<string, string>): Promise<string | undefined> {
    const pascal = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')
    for (const alias of [name, name.toLowerCase(), pascal, pascalToKebab(name)]) {
      if (imported.has(alias))
        return Promise.resolve(imported.get(alias))
    }
    const key = `${name}\0${path.dirname(page)}\0${path.dirname(file)}`
    let resolving = resolutions.get(key)
    if (!resolving) {
      resolving = resolveComponent(name, pascal, file, page)
      resolutions.set(key, resolving)
    }
    return resolving
  }

  async function resolveComponent(name: string, pascal: string, file: string, page: string): Promise<string | undefined> {
    if (name.startsWith('./') || name.startsWith('../'))
      return firstFile([path.resolve(path.dirname(file), name.endsWith('.stx') ? name : `${name}.stx`)])
    const names = [...new Set([name, pascal, pascalToKebab(name)].map(value => `${value.replace(/\.stx$/, '')}.stx`))]
    // Same app-first / plugin / framework-default precedence as the renderer.
    const dirs = [
      path.join(path.dirname(page), 'components'),
      options.componentsDir,
      path.join(path.dirname(file), 'components'),
      ...(options.additionalComponentsDirs ?? []),
      path.join(root, 'resources/views/components'),
      path.join(root, 'resources/components'),
      path.join(root, 'src/components'),
      path.join(root, 'components'),
      ...(scope.pluginComponentDirs ?? []),
      options.fallbackComponentsDir,
    ].filter((dir): dir is string => typeof dir === 'string' && dir.length > 0)
    for (const dir of new Set(dirs)) {
      const direct = await firstFile(names.map(name => path.join(dir, name)))
      if (direct)
        return direct
      for (const child of await componentDirectories(dir)) {
        const nested = await firstFile(names.map(name => path.join(child, name)))
        if (nested)
          return nested
      }
    }
  }

  for (const entry of scope.pages) {
    const page = absolute(entry)
    const pending = [page]
    const visited = new Set<string>()
    const imported = new Map<string, string>()
    while (pending.length) {
      const file = pending.pop()!
      if (visited.has(file))
        continue
      visited.add(file)
      let reading = sources.get(file)
      if (!reading) {
        reading = readFile(file, 'utf8').catch(() => '')
        sources.set(file, reading)
      }
      const source = await reading
      if (IMAGE_BUILTIN_PATTERN.test(source))
        return true

      const references: Array<{ kind: string, args: string[] }> = []
      const directives = /@(import|component|extends|layout|include|partial|includeIf|includeWhen|includeUnless|includeFirst)\s*\(/g
      let match: RegExpExecArray | null
      while ((match = directives.exec(source)) !== null) {
        const parsed = extractParenthesizedExpression(source, directives.lastIndex - 1)
        if (!parsed)
          continue
        references.push({ kind: match[1], args: splitTopLevelArgs(parsed.expression) })
        directives.lastIndex = parsed.endPos
      }
      const literal = (arg = '') => /^(['"])([^'"\r\n]+)\1$/.exec(arg.trim())?.[2]
      for (const ref of references.filter(ref => ref.kind === 'import')) {
        for (const arg of ref.args) {
          const name = literal(arg)
          if (!name)
            continue
          const resolved = await firstFile(componentImportCandidates(name, file, options))
          if (resolved) {
            const base = path.basename(name, '.stx')
            const pascal = base.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')
            for (const alias of [base, base.toLowerCase(), pascal, pascalToKebab(pascal)])
              imported.set(alias, resolved)
          }
        }
      }
      for (const ref of references) {
        const arg = ref.args[ref.kind === 'includeWhen' || ref.kind === 'includeUnless' ? 1 : 0]
        const names = ref.kind === 'includeFirst' && arg?.trim().startsWith('[')
          ? splitTopLevelArgs(arg.trim().slice(1, -1)).map(literal)
          : [literal(arg)]
        for (const name of names) {
          if (!name)
            continue
          let resolved: string | null | undefined
          if (ref.kind === 'component')
            resolved = await component(name, file, page, imported)
          else if (ref.kind === 'extends' || ref.kind === 'layout')
            resolved = await resolveTemplatePath(name, file, options)
          else if (ref.kind !== 'import') {
            const base = name.startsWith('.') ? path.dirname(file) : options.partialsDir || 'partials'
            resolved = await firstFile([path.resolve(absolute(base), name.endsWith('.stx') ? name : `${name}.stx`)])
          }
          if (resolved)
            pending.push(absolute(resolved))
          if (resolved && ref.kind === 'includeFirst')
            break
        }
      }
      const tags = /<([A-Z][\w.-]*|[a-z][\w.]*-[\w.-]+)(?=[\s/>])/g
      const names = new Set<string>()
      while ((match = tags.exec(source)) !== null)
        names.add(match[1])
      for (const name of names) {
        const resolved = await component(name, file, page, imported)
        if (resolved)
          pending.push(resolved)
      }
    }
  }
  return false
}
