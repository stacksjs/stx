declare module 'ts-images' {
  export interface TsImagesConfig {
    placeholderStrategy?: string
    [key: string]: unknown
  }

  export interface PlaceholderResult {
    dataUrl: string
    dataURL: string
    width: number
    height: number
    aspectRatio: number
    originalWidth: number
    originalHeight: number
    dominantColor: string
    css: string
    [key: string]: unknown
  }

  export interface ImageResult {
    width?: number
    height?: number
    outputSize?: number
    [key: string]: unknown
  }

  export function resize(input: Buffer | Uint8Array | string, options: Record<string, unknown>): Promise<Buffer>
  export function convert(input: Buffer | Uint8Array | string, format: string, options?: Record<string, unknown>): Promise<Buffer>
  export function metadata(input: Buffer | Uint8Array | string): Promise<Record<string, unknown>>
  export function blur(input: Buffer | Uint8Array | string, sigma?: number | Record<string, unknown>): Promise<Buffer>
  export function optimize(input: Buffer | Uint8Array | string, options?: Record<string, unknown>): Promise<Buffer>
  export function optimizeImage(options: Record<string, unknown>): Promise<ImageResult>
  export function processImage(options: Record<string, unknown>): Promise<ImageResult>
  export function placeholder(input: Buffer | Uint8Array | string, options?: Record<string, unknown>): Promise<string>
  export function generatePlaceholder(input: string, options?: Record<string, unknown>): Promise<PlaceholderResult>
  export function generateThumbHash(input: string, options?: Record<string, unknown>): Promise<PlaceholderResult>
  export function decode(input: Buffer | Uint8Array | string, format?: string): Promise<Buffer>
  export function encode(input: Buffer | Uint8Array, format: string, options?: Record<string, unknown>): Promise<Buffer>
  export function sharpen(input: Buffer | Uint8Array, amount?: number | Record<string, unknown>): Promise<Buffer>
  export function grayscale(input: Buffer | Uint8Array): Promise<Buffer>
  export function rotate(input: Buffer | Uint8Array, angle?: number): Promise<Buffer>
  export function flip(input: Buffer | Uint8Array): Promise<Buffer>
  export function flop(input: Buffer | Uint8Array): Promise<Buffer>
  export function brightness(input: Buffer | Uint8Array, value: number): Promise<Buffer>
  export function contrast(input: Buffer | Uint8Array, value: number): Promise<Buffer>
  export function saturation(input: Buffer | Uint8Array, value: number): Promise<Buffer>
  export function createSprite(options: Record<string, unknown>): Promise<Record<string, unknown>>
  export function createProcessor(options?: Record<string, unknown>): Record<string, unknown>
}
