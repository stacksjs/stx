/**
 * Auto-Sibling Image Discovery
 *
 * NuxtImage-style sugar: if a `.webp` (or `.avif`) sits next to a `.jpg`/
 * `.png` on disk, rewrite plain `<img src="hero.jpg">` into
 *
 *   <picture>
 *     <source type="image/avif" srcset="/images/hero.avif">
 *     <source type="image/webp" srcset="/images/hero.webp">
 *     <img src="/images/hero.jpg" alt="…">
 *   </picture>
 *
 * No consumer change required — drop the optimized format next to the
 * original asset and capable browsers pick it up.
 *
 * Skipped intentionally:
 *   - `<img>` already inside a `<picture>` (don't double-wrap)
 *   - Remote URLs (http://, https://, protocol-relative `//cdn/…`)
 *   - data: URIs
 *   - sources whose extension isn't a known raster format
 *   - images whose resolved path is outside `publicDir` (we don't probe
 *     arbitrary paths on disk)
 */

import path from 'node:path'

export interface AutoSiblingOptions {
  /** Filesystem root for resolving src URLs (typically the stx config's `publicDir`). */
  publicDir: string
  /** Sibling formats to probe for, in priority order (most-preferred first). */
  formats?: Array<{ ext: string, mime: string }>
}

const RASTER_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif'])

const DEFAULT_FORMATS = [
  { ext: '.avif', mime: 'image/avif' },
  { ext: '.webp', mime: 'image/webp' },
]

/**
 * Scan `html` for plain `<img>` tags whose src resolves to a real file
 * inside `publicDir`, probe for sibling-format files (e.g. `hero.webp`
 * next to `hero.jpg`), and wrap matches in `<picture>` with `<source>`
 * entries for each sibling that actually exists on disk.
 *
 * Returns the rewritten HTML. If no `<img>` matches or no siblings are
 * found, returns the input unchanged (no allocations beyond the scan).
 */
export async function rewriteImagesWithSiblings(
  html: string,
  options: AutoSiblingOptions,
): Promise<string> {
  const formats = options.formats ?? DEFAULT_FORMATS
  if (!options.publicDir) return html

  // First pass: find raw <img> positions and figure out which ones are
  // safely outside an enclosing <picture>. We index <picture> spans so a
  // single linear scan over <img> matches can do the containment test.
  const pictureRanges = collectPictureRanges(html)

  // Collect candidate replacements as { start, end, replacement } so we
  // can apply them in a single rebuild pass without disturbing offsets.
  type Patch = { start: number, end: number, replacement: string }
  const patches: Patch[] = []

  const imgRe = /<img\b[^>]*?>/gi
  const matches: Array<{ idx: number, length: number, src: string, raw: string }> = []
  let m: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((m = imgRe.exec(html)) !== null) {
    const raw = m[0]
    const srcMatch = raw.match(/\bsrc=["']([^"']+)["']/i)
    if (!srcMatch) continue
    if (isInsideRange(m.index, pictureRanges)) continue
    matches.push({ idx: m.index, length: raw.length, src: srcMatch[1], raw })
  }

  if (matches.length === 0) return html

  // Probe siblings in parallel — image-heavy pages can have dozens of
  // <img> tags, each adding 2 stat calls. Parallel keeps it under a
  // single event-loop tick on cold cache.
  const probes = await Promise.all(
    matches.map(async (match) => {
      const sources = await findSiblings(match.src, options.publicDir, formats)
      return { match, sources }
    }),
  )

  for (const { match, sources } of probes) {
    if (sources.length === 0) continue
    const sourceTags = sources
      .map(s => `<source type="${s.mime}" srcset="${escapeAttr(s.url)}">`)
      .join('')
    const replacement = `<picture>${sourceTags}${match.raw}</picture>`
    patches.push({ start: match.idx, end: match.idx + match.length, replacement })
  }

  if (patches.length === 0) return html

  // Stitch the patches into a new string in one pass. Patches are in
  // ascending order because matches were collected in source order.
  let out = ''
  let cursor = 0
  for (const p of patches) {
    out += html.slice(cursor, p.start)
    out += p.replacement
    cursor = p.end
  }
  out += html.slice(cursor)
  return out
}

interface SiblingSource {
  url: string
  mime: string
}

async function findSiblings(
  srcUrl: string,
  publicDir: string,
  formats: Array<{ ext: string, mime: string }>,
): Promise<SiblingSource[]> {
  if (!shouldProbe(srcUrl)) return []

  const ext = path.extname(srcUrl).toLowerCase()
  if (!RASTER_EXTS.has(ext)) return []

  // Resolve URL → filesystem path. We expect URLs starting with `/` to
  // mean "rooted at publicDir". Relative URLs (no leading slash) are
  // ambiguous without a template-relative base, so we skip them — the
  // caller can opt in by always rooting srcs at `/`.
  if (!srcUrl.startsWith('/')) return []

  const fsBase = path.join(publicDir, srcUrl.slice(1))
  const fsDir = path.dirname(fsBase)
  const fsBaseName = path.basename(fsBase, ext)

  // Reject absolute escapes (../../etc.) — publicDir + relative path
  // should never resolve outside publicDir.
  const resolvedDir = path.resolve(fsDir)
  const resolvedPublic = path.resolve(publicDir)
  if (!resolvedDir.startsWith(resolvedPublic)) return []

  const urlDir = path.posix.dirname(srcUrl)

  const checks = formats.map(async (fmt) => {
    const siblingPath = path.join(fsDir, `${fsBaseName}${fmt.ext}`)
    const exists = await Bun.file(siblingPath).exists()
    if (!exists) return null
    const siblingUrl = path.posix.join(urlDir, `${fsBaseName}${fmt.ext}`)
    return { url: siblingUrl, mime: fmt.mime }
  })

  const results = await Promise.all(checks)
  return results.filter((s): s is SiblingSource => s !== null)
}

function shouldProbe(srcUrl: string): boolean {
  if (!srcUrl) return false
  // Remote / protocol-relative / data: — never probe.
  if (srcUrl.startsWith('http://') || srcUrl.startsWith('https://')) return false
  if (srcUrl.startsWith('//')) return false
  if (srcUrl.startsWith('data:')) return false
  return true
}

function collectPictureRanges(html: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = []
  const re = /<picture\b[^>]*>[\s\S]*?<\/picture>/gi
  let m: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(html)) !== null) {
    ranges.push([m.index, m.index + m[0].length])
  }
  return ranges
}

function isInsideRange(idx: number, ranges: Array<[number, number]>): boolean {
  for (const [start, end] of ranges) {
    if (idx >= start && idx < end) return true
  }
  return false
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}
