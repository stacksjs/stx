export interface StorageDriver {
  name: string
  put(path: string, content: string | Buffer): Promise<string>
  get(path: string): Promise<Buffer | null>
  exists(path: string): Promise<boolean>
  delete(path: string): Promise<boolean>
  list(prefix?: string): Promise<FileMetadata[]>
  url(path: string): string
  signedUrl?(path: string, expiresIn?: number): Promise<string>
  copy?(from: string, to: string): Promise<string>
  move?(from: string, to: string): Promise<string>
}

export interface FileMetadata {
  path: string
  size: number
  lastModified: Date
  contentType?: string
}

export interface StorageConfig {
  default: string
  disks: Record<string, StorageDriver>
}
