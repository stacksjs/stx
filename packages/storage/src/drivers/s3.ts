import type { FileMetadata, StorageDriver } from '../types'

export interface S3DriverConfig {
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  endpoint?: string
}

export function s3Driver(config: S3DriverConfig): StorageDriver {
  const { bucket, region, accessKeyId, secretAccessKey, endpoint } = config

  const baseUrl = endpoint || `https://${bucket}.s3.${region}.amazonaws.com`

  function buildHeaders(method: string, path: string, contentType?: string): Record<string, string> {
    const date = new Date().toUTCString()
    const headers: Record<string, string> = {
      'Date': date,
      'Host': new URL(baseUrl).host,
      'x-amz-date': date,
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
    }
    if (contentType) {
      headers['Content-Type'] = contentType
    }
    // In a real implementation, this would compute AWS Signature V4
    // using accessKeyId and secretAccessKey
    headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${new Date().toISOString().slice(0, 10)}/${region}/s3/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=placeholder`
    return headers
  }

  function guessContentType(path: string): string {
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
    return (ext && types[ext]) || 'application/octet-stream'
  }

  const driver: StorageDriver = {
    name: 's3',

    async put(path: string, content: string | Buffer): Promise<string> {
      const contentType = guessContentType(path)
      const headers = buildHeaders('PUT', path, contentType)
      const url = `${baseUrl}/${path}`

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: content,
      })

      if (!response.ok) {
        throw new Error(`S3 PUT failed: ${response.status} ${response.statusText}`)
      }

      return url
    },

    async get(path: string): Promise<Buffer | null> {
      const headers = buildHeaders('GET', path)
      const url = `${baseUrl}/${path}`

      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (response.status === 404) return null
      if (!response.ok) {
        throw new Error(`S3 GET failed: ${response.status} ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    },

    async exists(path: string): Promise<boolean> {
      const headers = buildHeaders('HEAD', path)
      const url = `${baseUrl}/${path}`

      const response = await fetch(url, {
        method: 'HEAD',
        headers,
      })

      return response.ok
    },

    async delete(path: string): Promise<boolean> {
      const headers = buildHeaders('DELETE', path)
      const url = `${baseUrl}/${path}`

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      })

      return response.ok || response.status === 204
    },

    async list(prefix?: string): Promise<FileMetadata[]> {
      const params = new URLSearchParams({ 'list-type': '2' })
      if (prefix) params.set('prefix', prefix)

      const headers = buildHeaders('GET', '')
      const url = `${baseUrl}?${params.toString()}`

      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`S3 LIST failed: ${response.status} ${response.statusText}`)
      }

      // Parse XML response - simplified parsing
      const text = await response.text()
      const files: FileMetadata[] = []

      const keyMatches = text.matchAll(/<Key>([^<]+)<\/Key>/g)
      const sizeMatches = text.matchAll(/<Size>(\d+)<\/Size>/g)
      const dateMatches = text.matchAll(/<LastModified>([^<]+)<\/LastModified>/g)

      const keys = [...keyMatches].map(m => m[1])
      const sizes = [...sizeMatches].map(m => Number.parseInt(m[1], 10))
      const dates = [...dateMatches].map(m => new Date(m[1]))

      for (let i = 0; i < keys.length; i++) {
        files.push({
          path: keys[i],
          size: sizes[i] || 0,
          lastModified: dates[i] || new Date(),
          contentType: guessContentType(keys[i]),
        })
      }

      return files.sort((a, b) => a.path.localeCompare(b.path))
    },

    url(path: string): string {
      return `${baseUrl}/${path}`
    },

    async signedUrl(path: string, expiresIn: number = 3600): Promise<string> {
      const expiration = Math.floor(Date.now() / 1000) + expiresIn
      const params = new URLSearchParams({
        'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
        'X-Amz-Credential': `${accessKeyId}/${new Date().toISOString().slice(0, 10)}/${region}/s3/aws4_request`,
        'X-Amz-Date': new Date().toISOString().replace(/[:-]/g, '').replace(/\.\d+/, ''),
        'X-Amz-Expires': expiresIn.toString(),
        'X-Amz-SignedHeaders': 'host',
        'X-Amz-Signature': 'placeholder-signature',
      })

      return `${baseUrl}/${path}?${params.toString()}`
    },

    async copy(from: string, to: string): Promise<string> {
      const contentType = guessContentType(to)
      const headers = buildHeaders('PUT', to, contentType)
      headers['x-amz-copy-source'] = `/${bucket}/${from}`
      const url = `${baseUrl}/${to}`

      const response = await fetch(url, {
        method: 'PUT',
        headers,
      })

      if (!response.ok) {
        throw new Error(`S3 COPY failed: ${response.status} ${response.statusText}`)
      }

      return url
    },

    async move(from: string, to: string): Promise<string> {
      const result = await driver.copy!(from, to)
      await driver.delete(from)
      return result
    },
  }

  return driver
}
