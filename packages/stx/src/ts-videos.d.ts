declare module 'ts-videos' {
  export interface VideoInfo {
    duration?: number
    width?: number
    height?: number
    frameRate?: number
    bitrate?: number
    videoCodec?: string
    audioCodec?: string
    [key: string]: unknown
  }

  export class Input {
    constructor(path: string)
    static from(path: string): Input
    getInfo(): Promise<VideoInfo>
  }

  export class Conversion {
    constructor(input: string, output: string, options?: Record<string, unknown>)
    run(onProgress?: (progress: any) => void): Promise<Record<string, any>>
  }

  export function createTranscoder(options?: Record<string, unknown>): Record<string, unknown>
  export function createThumbnailGenerator(options?: Record<string, unknown>): Record<string, unknown>
  export function createStreamingProcessor(options?: Record<string, unknown>): Record<string, unknown>
  export function generateHLS(input: string, options: Record<string, unknown>): Promise<Record<string, any>>
  export function generateDASH(input: string, options: Record<string, unknown>): Promise<Record<string, any>>
  export function extractThumbnails(input: string, options: Record<string, unknown>): Promise<any[]>
}
