declare module 'sharp' {
  interface ImageMetadata {
    width: number
    height: number
    format: string
    channels?: number
    depth?: string
    density?: number
    hasAlpha?: boolean
    space?: string
    [key: string]: unknown
  }

  interface SharpInstance {
    resize(width?: number, height?: number, options?: Record<string, unknown>): SharpInstance
    toFormat(format: string, options?: Record<string, unknown>): SharpInstance
    toBuffer(): Promise<Buffer>
    toFile(path: string): Promise<Record<string, unknown>>
    metadata(): Promise<ImageMetadata>
    blur(sigma?: number): SharpInstance
    rotate(angle?: number): SharpInstance
    flip(): SharpInstance
    flop(): SharpInstance
    png(options?: Record<string, unknown>): SharpInstance
    jpeg(options?: Record<string, unknown>): SharpInstance
    webp(options?: Record<string, unknown>): SharpInstance
    avif(options?: Record<string, unknown>): SharpInstance
  }

  function sharp(input?: Buffer | Uint8Array | string): SharpInstance
  export = sharp
}
