import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

interface CandidateArchive {
  name: string
  archive: string
}

/** Serve original prepublication archives with their actual versions and manifests. */
export async function packageCandidateRegistry(archives: CandidateArchive[]) {
  const candidates = await Promise.all(archives.map(async (owner) => {
    const bytes = await Bun.file(owner.archive).bytes()
    const files = await new Bun.Archive(bytes).files()
    const input: unknown = await files.get('package/package.json')!.json()
    assert(input !== null && typeof input === 'object' && !Array.isArray(input))
    assert('name' in input && input.name === owner.name)
    assert('version' in input && typeof input.version === 'string')
    const manifest = { ...input, name: owner.name, version: input.version }
    return { bytes, manifest }
  }))
  const metadata = new Map<string, typeof candidates[number]>(candidates.map(candidate => [candidate.manifest.name, candidate]))
  const payloads = new Map<string, typeof candidates[number]>(candidates.map((candidate, index) => [`/archives/${index}.tgz`, candidate]))
  const requests: Array<Record<string, unknown>> = []
  const pending = new Set<AbortController>()
  const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')
  const server = Bun.serve({ hostname: '127.0.0.1', port: 0, idleTimeout: 0,
    async fetch(request, host) {
      const incoming = new URL(request.url)
      const record: Record<string, unknown> = { method: request.method, path: incoming.pathname }
      requests.push(record)
      if (request.method !== 'GET') return new Response(null, { status: 405 })
      const payload = payloads.get(incoming.pathname)
      if (payload) {
        Object.assign(record, { kind: 'candidate-archive', name: payload.manifest.name, version: payload.manifest.version, sha256: hash(payload.bytes) })
        return new Response(payload.bytes, { headers: { 'content-type': 'application/octet-stream', 'cache-control': 'no-store' } })
      }
      let name: string
      try { name = decodeURIComponent(incoming.pathname.slice(1)) }
      catch { return new Response(null, { status: 400 }) }
      const candidate = metadata.get(name)
      if (candidate) {
        Object.assign(record, { kind: 'candidate-metadata', name, version: candidate.manifest.version })
        const index = candidates.indexOf(candidate)
        return Response.json({ name, 'dist-tags': { latest: candidate.manifest.version }, versions: {
          [candidate.manifest.version]: { ...candidate.manifest, dist: {
            tarball: new URL(`/archives/${index}.tgz`, host.url).href,
            shasum: createHash('sha1').update(candidate.bytes).digest('hex'),
            integrity: `sha512-${createHash('sha512').update(candidate.bytes).digest('base64')}`,
          } },
        } }, { headers: { 'cache-control': 'no-store' } })
      }
      const controller = new AbortController()
      pending.add(controller)
      const timer = setTimeout(() => controller.abort(), 60_000)
      try {
        const upstream = new URL('https://registry.npmjs.org')
        upstream.pathname = incoming.pathname
        upstream.search = incoming.search
        const response = await fetch(upstream, { headers: { accept: 'application/json' }, signal: controller.signal })
        const bytes = await response.bytes()
        Object.assign(record, { kind: 'public-metadata', status: response.status, sha256: hash(bytes) })
        return new Response(bytes, { status: response.status, headers: { 'content-type': 'application/json' } })
      }
      catch (error) {
        Object.assign(record, { kind: 'public-metadata', status: 502, error: error instanceof Error ? error.name : 'FetchFailure' })
        return new Response('Public metadata request failed', { status: 502 })
      }
      finally {
        clearTimeout(timer)
        pending.delete(controller)
      }
    },
  })
  let stopped = false
  async function stop() {
    if (stopped) return
    stopped = true
    for (const controller of pending) controller.abort()
    await server.stop(true)
  }
  return { url: server.url.href, requests, stop, [Symbol.asyncDispose]: stop }
}
