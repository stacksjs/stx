import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import type { FileMetadata, StorageDriver } from '../types'

export interface LocalDriverConfig {
  root: string
  urlPrefix?: string
}

export function localDriver(config: LocalDriverConfig): StorageDriver {
  const { root, urlPrefix = '/storage' } = config

  function fullPath(path: string): string {
    return join(root, path)
  }

  function ensureDir(filePath: string): void {
    const dir = dirname(filePath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }

  function guessContentType(path: string): string | undefined {
    const ext = path.split('.').pop()?.toLowerCase()
    const types: Record<string, string> = {
      txt: 'text/plain',
      html: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      json: 'application/json',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
    }
    return ext ? types[ext] : undefined
  }

  function collectFiles(dir: string, prefix?: string): FileMetadata[] {
    const results: FileMetadata[] = []
    if (!existsSync(dir)) return results

    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const entryPath = join(dir, entry.name)
      const relativePath = relative(root, entryPath)

      if (entry.isDirectory()) {
        results.push(...collectFiles(entryPath, prefix))
      }
      else if (entry.isFile()) {
        if (!prefix || relativePath.startsWith(prefix)) {
          const stat = statSync(entryPath)
          results.push({
            path: relativePath,
            size: stat.size,
            lastModified: stat.mtime,
            contentType: guessContentType(relativePath),
          })
        }
      }
    }
    return results
  }

  const driver: StorageDriver = {
    name: 'local',

    async put(path: string, content: string | Buffer): Promise<string> {
      const fp = fullPath(path)
      ensureDir(fp)
      await Bun.write(fp, content)
      return `${urlPrefix}/${path}`
    },

    async get(path: string): Promise<Buffer | null> {
      const fp = fullPath(path)
      const file = Bun.file(fp)
      if (!await file.exists()) return null
      const arrayBuffer = await file.arrayBuffer()
      return Buffer.from(arrayBuffer)
    },

    async exists(path: string): Promise<boolean> {
      const file = Bun.file(fullPath(path))
      return file.exists()
    },

    async delete(path: string): Promise<boolean> {
      const fp = fullPath(path)
      if (!existsSync(fp)) return false
      unlinkSync(fp)
      return true
    },

    async list(prefix?: string): Promise<FileMetadata[]> {
      const searchDir = prefix ? join(root, prefix.split('/')[0] || '') : root
      const results = collectFiles(existsSync(searchDir) ? searchDir : root, prefix)
      return results.sort((a, b) => a.path.localeCompare(b.path))
    },

    url(path: string): string {
      return `${urlPrefix}/${path}`
    },

    async copy(from: string, to: string): Promise<string> {
      const content = await driver.get(from)
      if (!content) throw new Error(`File not found: ${from}`)
      return driver.put(to, content)
    },

    async move(from: string, to: string): Promise<string> {
      const result = await driver.copy!(from, to)
      await driver.delete(from)
      return result
    },
  }

  return driver
}
