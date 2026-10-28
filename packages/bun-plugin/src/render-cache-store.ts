import { createHash } from 'node:crypto'
import nodeFs from 'node:fs/promises'
import nodePath from 'node:path'

/**
 * The render cache, kept across restarts (stacksjs/stx#2133).
 *
 * With `renderCacheVary: 'source'` a page's rendered shell depends on its
 * template and the files that template pulled in, which the entry's signature
 * covers, and on everything the in-process watcher covers by clearing the
 * whole cache: client bundles, stores and composables, data files, and any
 * `watchDirs` the app declared. Process-lifetime inputs never change while the
 * process runs, so in memory they need nothing: the installed stx, the serve
 * options, the config and env files, Bun itself.
 *
 * A copy on disk outlives all of those. So each entry is stored with a
 * fingerprint of the watched files and the process-lifetime inputs, and is
 * used only while that fingerprint still matches. Anything else is a miss:
 * a stale page is worse than a slow one.
 */

/** File types whose change clears the in-memory cache, mirrored here. */
const WATCHED_EXTENSIONS = new Set(['.stx', '.md', '.html', '.js', '.ts', '.tsx', '.mts', '.cts', '.json'])

export interface PersistableEntry {
  html: string
  signature: Map<string, number>
  status: number
  headers?: Record<string, string>
}

export interface RenderInputs {
  /** Directories the watcher covers; every watched file in them is fingerprinted. */
  roots: readonly string[]
  /** Single files read once per process: lockfiles, config and env files, stx itself. */
  files: readonly string[]
  /** Anything else fixed for the process, such as the rendering-relevant serve options. */
  extra: unknown
}

/**
 * A digest of everything an entry's signature does not cover. Files are
 * described by path, mtime and size; a missing file is part of the answer
 * too, since creating one (a new `.env.local`) can change what renders.
 */
export async function renderInputsFingerprint(inputs: RenderInputs): Promise<string> {
  const lines: string[] = []
  for (const root of new Set(inputs.roots)) {
    const absolute = nodePath.resolve(root)
    const entries = await nodeFs.readdir(absolute, { recursive: true, withFileTypes: true }).catch(() => null)
    if (!entries) {
      lines.push(`root ${absolute} missing`)
      continue
    }
    const files = entries
      .filter(entry => entry.isFile() && WATCHED_EXTENSIONS.has(nodePath.extname(entry.name)))
      .map(entry => nodePath.join(entry.parentPath, entry.name))
      .filter(file => !file.split(nodePath.sep).some(part => part === 'node_modules' || part.startsWith('.')))
    const stats = await Promise.all(files.map(file => nodeFs.stat(file).catch(() => null)))
    files.forEach((file, index) => lines.push(`file ${file} ${stats[index]?.mtimeMs ?? 'gone'} ${stats[index]?.size ?? 0}`))
  }
  for (const file of new Set(inputs.files)) {
    const stat = await nodeFs.stat(file).catch(() => null)
    lines.push(`input ${nodePath.resolve(file)} ${stat ? `${stat.mtimeMs} ${stat.size}` : 'missing'}`)
  }
  lines.sort()
  lines.push(`extra ${JSON.stringify(inputs.extra)}`)
  return createHash('sha256').update(lines.join('\n')).digest('hex')
}

/** Put this process's build id where the rendering process put its own. */
export function restampBuildId(html: string, renderedWith: string, current: string): string {
  if (renderedWith === current)
    return html
  const before = `<meta name="stx-build" content="${renderedWith}">`
  const at = html.indexOf(before)
  if (at === -1)
    return html
  return `${html.slice(0, at)}<meta name="stx-build" content="${current}">${html.slice(at + before.length)}`
}

interface StoredEntry {
  v: 1
  key: string
  fingerprint: string
  buildId: string
  html: string
  signature: Array<[string, number]>
  status: number
  headers?: Record<string, string>
}

/**
 * Taken before a render reads anything, and handed back to `write`.
 *
 * The fingerprint is settled first, so it can only be older than what the
 * render read, never newer. An older one no longer matches after the change
 * that made it older, which costs a miss; a newer one would vouch for HTML
 * rendered from files it never described.
 */
export interface RenderTicket {
  generation: number
  fingerprint: string
}

export interface RenderCacheStore {
  /** Settle the fingerprint for a render that is about to start. */
  begin: () => Promise<RenderTicket>
  /** The stored entry for `key`, if its fingerprint still matches. */
  read: (key: string) => Promise<PersistableEntry | undefined>
  /** Keep `entry`, unless the sources changed since its render began. */
  write: (key: string, entry: PersistableEntry, ticket: RenderTicket) => Promise<void>
  /** A watched source changed: nothing rendered before now describes the files. */
  invalidate: () => void
}

/**
 * One file per entry, read on demand. A dashboard's worth of pages is tens of
 * megabytes of HTML, so nothing is loaded up front and a page nobody opens
 * costs nothing.
 */
export function createRenderCacheStore(options: {
  dir: string
  inputs: () => RenderInputs
  buildId: () => string
}): RenderCacheStore {
  let generation = 0
  let fingerprint: Promise<string> | null = null
  const current = (): Promise<string> => (fingerprint ??= renderInputsFingerprint(options.inputs()))
  const fileFor = (key: string): string => nodePath.join(options.dir, `${createHash('sha256').update(key).digest('hex')}.json`)

  return {
    async begin() {
      // The generation first: a change during the walk makes this ticket stale.
      const at = generation
      return { generation: at, fingerprint: await current() }
    },

    async read(key) {
      const file = fileFor(key)
      const stored = await Bun.file(file).json().catch(() => null) as StoredEntry | null
      if (!stored)
        return undefined
      if (stored.v !== 1 || stored.key !== key || stored.fingerprint !== await current()) {
        await nodeFs.rm(file, { force: true }).catch(() => {})
        return undefined
      }
      return {
        html: restampBuildId(stored.html, stored.buildId, options.buildId()),
        signature: new Map(stored.signature),
        status: stored.status,
        headers: stored.headers,
      }
    },

    async write(key, entry, ticket) {
      if (ticket.generation !== generation)
        return
      const stored: StoredEntry = {
        v: 1,
        key,
        fingerprint: ticket.fingerprint,
        buildId: options.buildId(),
        html: entry.html,
        signature: [...entry.signature],
        status: entry.status,
        headers: entry.headers,
      }
      await nodeFs.mkdir(options.dir, { recursive: true })
      // Written aside and renamed, so a crash mid-write leaves no half entry.
      const file = fileFor(key)
      const temporary = `${file}.${process.pid}.tmp`
      await Bun.write(temporary, JSON.stringify(stored))
      await nodeFs.rename(temporary, file)
    },

    invalidate() {
      generation++
      fingerprint = null
    },
  }
}
