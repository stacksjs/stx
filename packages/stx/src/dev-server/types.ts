/**
 * Type Definitions for Dev Server
 */

import type { SyntaxHighlightTheme, StxOptions } from '../types'

/**
 * Markdown rendering options
 */
export interface MarkdownOptions {
  syntaxHighlighting?: {
    /** Enable server-side syntax highlighting */
    serverSide?: boolean
    /** Enable syntax highlighting (default: true) */
    enabled?: boolean
    /** Default theme for code blocks */
    defaultTheme?: SyntaxHighlightTheme
    /** Highlight code blocks with unknown languages */
    highlightUnknownLanguages?: boolean
    /** Additional themes to make available */
    additionalThemes?: SyntaxHighlightTheme[]
  }
}

/**
 * Dev server configuration options
 */
export interface DevServerOptions {
  /** Port to run the server on (default: 3000) */
  port?: number
  /** Watch for file changes and reload (default: true) */
  watch?: boolean
  /** Open in native window instead of browser */
  native?: boolean
  /** STX template processing options */
  stxOptions?: StxOptions
  /** Markdown-specific options */
  markdown?: MarkdownOptions
  /** Enable template caching */
  cache?: boolean
  /** Enable hot module reload via WebSocket (default: true in watch mode) */
  hotReload?: boolean
  /** Port for WebSocket HMR server (default: HTTP port + 1) */
  hmrPort?: number
}

/**
 * Server instance returned by serve functions
 */
export interface ServerInstance {
  /** Stop the server */
  stop: () => void
  /** Server URL */
  url: string
  /** Server port */
  port: number
  /** HMR port if enabled */
  hmrPort?: number
}

/**
 * File watcher event types
 */
export type WatchEventType = 'change' | 'rename' | 'delete' | 'add'

/**
 * File watcher callback
 */
export type WatchCallback = (eventType: WatchEventType, filename: string) => void

/**
 * Route handler function
 */
export type RouteHandler = (request: Request) => Promise<Response> | Response

/**
 * MIME type mapping
 */
export const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.stx': 'text/html',
}

/**
 * Get MIME type for a file extension
 */
export function getMimeType(ext: string): string {
  return MIME_TYPES[ext.toLowerCase()] || 'application/octet-stream'
}

/**
 * Default dev server options
 */
export const DEFAULT_DEV_OPTIONS: Required<Omit<DevServerOptions, 'stxOptions' | 'markdown'>> = {
  port: 3000,
  watch: true,
  native: false,
  cache: false,
  hotReload: true,
  hmrPort: 3001,
}
