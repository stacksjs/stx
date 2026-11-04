import fs from 'node:fs'
import path from 'node:path'
import { stateDir } from '../state-dir'

// Rendered HTML outlives the process, so its immutable CSS must too (#2153).
// Keep the existing memory ceiling; evicted stylesheets remain on disk.
const LIMIT = 256
const assets = new Map<string, string>()
const hashOf = (css: string): string => Bun.hash(css).toString(16).padStart(16, '0').slice(0, 16)
// Like module-bundles, these URLs belong to the serving process's state dir,
// independently of which app directory supplied the generator configuration.
const fileFor = (hash: string): string => stateDir(process.cwd(), 'css-assets', `${hash}.css`)

function remember(file: string, css: string): void {
  assets.delete(file)
  assets.set(file, css)
  if (assets.size > LIMIT) assets.delete(assets.keys().next().value!)
}

/** Return a hash only after its bytes are durable; callers can otherwise inline. */
export function registerCssServeAsset(css: string): string | undefined {
  const hash = hashOf(css)
  const file = fileFor(hash)
  if (assets.has(file)) {
    remember(file, css)
    return hash
  }
  let temporary: string | undefined
  try {
    let existing: string | undefined
    try { existing = fs.readFileSync(file, 'utf8') }
    catch { /* A missing or damaged asset is rewritten below. */ }
    if (existing !== css) {
      fs.mkdirSync(path.dirname(file), { recursive: true })
      temporary = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`
      fs.writeFileSync(temporary, css, { flag: 'wx' })
      fs.renameSync(temporary, file)
    }
    remember(file, css)
    return hash
  }
  catch {
    // A read-only/unavailable state dir must not leave a persisted HTML link
    // that only this process can answer. injectCss falls back to inline CSS.
    return undefined
  }
  finally {
    if (temporary) {
      try { fs.unlinkSync(temporary) }
      catch { /* Renamed successfully, or best-effort failed-write cleanup. */ }
    }
  }
}

/** Synchronous for existing callers; disk is read only on a memory miss. */
export function getCssServeAsset(hash: string): string | undefined {
  if (!/^[a-f0-9]{16}$/.test(hash)) return undefined
  const file = fileFor(hash)
  const cached = assets.get(file)
  if (cached !== undefined) {
    remember(file, cached)
    return cached
  }
  try {
    const css = fs.readFileSync(file, 'utf8')
    // Immutable URLs must never serve a partial or corrupted file under a
    // valid old hash. A cache hit can then fall back to a fresh render.
    if (hashOf(css) !== hash) return undefined
    remember(file, css)
    return css
  }
  catch { return undefined }
}

export function clearCssServeAssets(): void {
  assets.clear()
}
