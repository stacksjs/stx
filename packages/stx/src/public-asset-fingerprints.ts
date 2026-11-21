import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, extname, resolve, sep } from 'node:path'

const aliasPattern = /\.stx-([a-f0-9]{16})(\.[a-z0-9]+)$/i
const assetExtension = /\.(?:avif|css|gif|ico|jpe?g|js|mjs|png|svg|webp|woff2?|ttf|otf)$/i
const alreadyFingerprinted = /[.-][a-f0-9]{8,}\.[a-z0-9]+$/i
const immutable = 'public, max-age=31536000, immutable'

type AssetRoot = { directory: string, prefix?: string }
type Publish = (pathname: string, bytes: Buffer) => void
interface PublicAssetFingerprinter {
  rewrite: (response: Response) => Response
  respond: (path: string, head: boolean) => Promise<Response> | undefined
}

function localPath(url: string): string | undefined {
  if (!url.startsWith('/') || url.startsWith('//') || /[?#]/.test(url)) return
  try {
    const pathname = decodeURIComponent(url)
    if (pathname.includes('\\') || pathname.includes('\0') || pathname.startsWith('//')
      || pathname.split('/').some(part => part.startsWith('.'))
      || /^\/(?:_stx|__stx|resources)\//.test(pathname)) return
    return pathname
  }
  catch { return }
}

function digest(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex').slice(0, 16)
}

/** Walk srcset URL tokens without splitting data URLs or comma-containing filenames. */
function fingerprintSourceSet(value: string, fingerprint: (url: string) => string): string {
  const whitespace = /[\t\n\f\r ]/
  let offset = 0
  let copied = 0
  let output = ''
  while (offset < value.length) {
    while (offset < value.length && (whitespace.test(value[offset]!) || value[offset] === ',')) offset++
    const start = offset
    while (offset < value.length && !whitespace.test(value[offset]!)) offset++
    let end = offset
    while (end > start && value[end - 1] === ',') end--
    const url = value.slice(start, end)
    const hashed = fingerprint(url)
    if (hashed !== url) {
      output += value.slice(copied, start) + hashed
      copied = end
    }
    // A trailing comma terminated a descriptor-less candidate. Otherwise,
    // skip its density or width descriptor up to the next separator.
    if (offset === end) {
      const separator = value.indexOf(',', offset)
      offset = separator === -1 ? value.length : separator + 1
    }
  }
  return output + value.slice(copied)
}

/** Resolve exactly what the public mount can serve. A symlink cannot escape its root. */
export function createPublicAssetFingerprinter(roots: AssetRoot[], publish?: Publish): PublicAssetFingerprinter {
  const locations = roots.flatMap(({ directory, prefix }) => {
    try { return [{ directory: realpathSync(directory), prefix: prefix ?? '/' }] }
    catch { return [] }
  })
  const versions = new Map<string, { stamp: string, hash: string }>()

  function asset(pathname: string) {
    for (const { directory, prefix } of locations) {
      if (!pathname.startsWith(prefix)) continue
      try {
        const file = realpathSync(resolve(directory, pathname.slice(prefix.length)))
        if (!file.startsWith(directory + sep)) continue
        const stat = statSync(file, { bigint: true })
        if (!stat.isFile()) continue
        return { file, stamp: `${stat.dev}:${stat.ino}:${stat.size}:${stat.mtimeNs}:${stat.ctimeNs}` }
      }
      catch { /* This mount has no such asset. */ }
    }
  }

  function fingerprint(url: string): string {
    const pathname = localPath(url)
    if (!pathname || !assetExtension.test(pathname) || alreadyFingerprinted.test(pathname)) return url
    const source = asset(pathname)
    if (!source) return url
    const previous = versions.get(pathname)
    const ext = extname(pathname)
    if (!url.endsWith(ext)) return url
    const alias = (hash: string) => `${url.slice(0, -ext.length)}.stx-${hash}${ext}`
    if (previous?.stamp === source.stamp) return alias(previous.hash)
    let bytes: Buffer
    try { bytes = readFileSync(source.file) }
    catch { return url }
    const hash = digest(bytes)
    publish?.(pathname.replace(/\.[^.]+$/, `.stx-${hash}${ext}`), bytes)
    versions.set(pathname, { stamp: source.stamp, hash })
    return alias(hash)
  }

  function respond(path: string, head: boolean): Promise<Response> | undefined {
    const pathname = localPath(path)
    const match = pathname && aliasPattern.exec(pathname)
    if (!match || !pathname || !assetExtension.test(pathname)) return
    const original = pathname.slice(0, -match[0].length) + match[2]
    return (async () => {
      const source = asset(original)
      if (source) {
        try {
          // Verify the same bytes sent to the client. A stale URL must never
          // cache the new file under the previous release's immutable name.
          const bytes = await readFile(source.file)
          if (digest(bytes) === match[1])
            return new Response(head ? null : bytes, { headers: {
              'Content-Type': Bun.file(source.file).type || 'application/octet-stream',
              'Content-Length': String(bytes.length),
              'Cache-Control': immutable,
            } })
        }
        catch { /* The original disappeared during a rollout. */ }
      }
      return new Response(head ? null : 'Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
    })()
  }

  function rewrite(response: Response): Response {
    if (!response.ok || response.status === 206 || !response.body || response.bodyUsed
      || !response.headers.get('Content-Type')?.includes('text/html') || response.headers.has('Content-Encoding')) return response

    function attribute(element: HTMLRewriterTypes.Element, name: string) {
      const value = element.getAttribute(name)
      if (!value) return
      const versioned = fingerprint(value)
      if (versioned !== value) element.setAttribute(name, versioned)
    }

    function sourceSet(element: HTMLRewriterTypes.Element, name: string) {
      const value = element.getAttribute(name)
      if (!value) return
      const versioned = fingerprintSourceSet(value, fingerprint)
      if (versioned !== value) element.setAttribute(name, versioned)
    }

    const marker = ':not([data-stx-no-fingerprint])'
    const headers = new Headers(response.headers)
    headers.delete('Content-Length')
    headers.delete('ETag')
    return new HTMLRewriter()
      .on(`img${marker},source${marker},script${marker},audio${marker},video${marker}`, {
        element(element) {
          attribute(element, 'src')
          attribute(element, 'poster')
          sourceSet(element, 'srcset')
        },
      })
      .on(`link${marker}`, {
        element(element) {
          const rel = element.getAttribute('rel')?.toLowerCase().split(/\s+/) ?? []
          const as = element.getAttribute('as')?.toLowerCase()
          if (!rel.some(value => ['stylesheet', 'icon', 'apple-touch-icon', 'modulepreload'].includes(value))
            && !(rel.includes('preload') && (as === 'image' || as === 'script' || as === 'style'))) return
          attribute(element, 'href')
          sourceSet(element, 'imagesrcset')
        },
      })
      .transform(new Response(response.body, { status: response.status, statusText: response.statusText, headers }))
  }

  return { rewrite, respond }
}

/** The output already contains the public files under their original URLs. */
export async function fingerprintBuiltPages(outputDir: string, pages: Iterable<string>): Promise<void> {
  const assets = createPublicAssetFingerprinter([{ directory: outputDir }], (pathname, bytes) => {
    const file = resolve(outputDir, `.${pathname}`)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, bytes)
  })
  for (const path of pages) {
    const page = Bun.file(path)
    const html = await page.text()
    const transformed = await assets.rewrite(new Response(html, { headers: { 'Content-Type': 'text/html' } })).text()
    if (transformed !== html) await Bun.write(page, transformed)
  }
}
