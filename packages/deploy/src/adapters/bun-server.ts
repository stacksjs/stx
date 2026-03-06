import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import type { AdapterBuildConfig, AdapterBuildResult, BunServerConfig, DeployAdapter } from '../types'

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
}

function collectFiles(dir: string, base: string = dir): string[] {
  const files: string[] = []
  if (!existsSync(dir)) return files
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...collectFiles(full, base))
    else files.push(relative(base, full))
  }
  return files
}

function generateServerScript(config: BunServerConfig, outDir: string): string {
  const port = config.port ?? 3000
  const hostname = config.hostname ?? '0.0.0.0'

  return `import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

const MIME_TYPES = ${JSON.stringify(MIME_TYPES, null, 2)}

const PUBLIC_DIR = import.meta.dir

Bun.serve({
  port: ${port},
  hostname: '${hostname}',
  ${config.tls ? `tls: { cert: Bun.file('${config.tls.cert}'), key: Bun.file('${config.tls.key}') },` : ''}
  async fetch(request) {
    const url = new URL(request.url)
    let pathname = url.pathname

    // Try exact file
    let filePath = join(PUBLIC_DIR, pathname)
    if (pathname === '/' || !existsSync(filePath)) {
      filePath = join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname + '.html')
    }

    if (!existsSync(filePath)) {
      // SPA fallback
      filePath = join(PUBLIC_DIR, 'index.html')
      if (!existsSync(filePath)) {
        return new Response('Not Found', { status: 404 })
      }
    }

    const ext = extname(filePath)
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'
    const file = Bun.file(filePath)

    const headers = new Headers({ 'Content-Type': contentType })
    ${config.compression ? `headers.set('Content-Encoding', 'identity')` : ''}

    // Cache static assets
    if (ext !== '.html') {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    }

    return new Response(file, { headers })
  },
})

console.log('Server running at http://${hostname}:${port}')
`
}

export function bunServerAdapter(config: BunServerConfig = {}): DeployAdapter {
  return {
    name: 'bun-server',

    async build(buildConfig: AdapterBuildConfig): Promise<AdapterBuildResult> {
      const outDir = buildConfig.outDir
      mkdirSync(outDir, { recursive: true })

      // Generate server entry
      const serverScript = generateServerScript(config, outDir)
      const serverPath = join(outDir, 'server.ts')
      writeFileSync(serverPath, serverScript)

      const files = collectFiles(outDir)

      return {
        outputDir: outDir,
        entrypoint: serverPath,
        files,
      }
    },
  }
}
