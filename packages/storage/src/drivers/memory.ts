import type { FileMetadata, StorageDriver } from '../types'

export class MemoryDriver implements StorageDriver {
  name = 'memory'
  files: Map<string, { content: Buffer; metadata: FileMetadata }> = new Map()

  async put(path: string, content: string | Buffer): Promise<string> {
    const buffer = typeof content === 'string' ? Buffer.from(content) : content
    this.files.set(path, {
      content: buffer,
      metadata: {
        path,
        size: buffer.length,
        lastModified: new Date(),
        contentType: guessContentType(path),
      },
    })
    return path
  }

  async get(path: string): Promise<Buffer | null> {
    const file = this.files.get(path)
    return file ? file.content : null
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path)
  }

  async delete(path: string): Promise<boolean> {
    return this.files.delete(path)
  }

  async list(prefix?: string): Promise<FileMetadata[]> {
    const results: FileMetadata[] = []
    for (const [key, value] of this.files) {
      if (!prefix || key.startsWith(prefix)) {
        results.push(value.metadata)
      }
    }
    return results.sort((a, b) => a.path.localeCompare(b.path))
  }

  url(path: string): string {
    return `memory://${path}`
  }

  async signedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    return `memory://${path}?expires=${expiresIn}&token=mock-signed-token`
  }

  async copy(from: string, to: string): Promise<string> {
    const file = this.files.get(from)
    if (!file) {
      throw new Error(`File not found: ${from}`)
    }
    const buffer = Buffer.from(file.content)
    this.files.set(to, {
      content: buffer,
      metadata: {
        path: to,
        size: buffer.length,
        lastModified: new Date(),
        contentType: file.metadata.contentType,
      },
    })
    return to
  }

  async move(from: string, to: string): Promise<string> {
    const result = await this.copy(from, to)
    this.files.delete(from)
    return result
  }

  clear(): void {
    this.files.clear()
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
