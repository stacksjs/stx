export interface ErrorBoundaryConfig {
  catch: (error: Error, info: ErrorInfo) => string | Response
  fallback?: string
  onError?: (error: Error) => void
}

export interface ErrorInfo {
  componentStack?: string
  filePath?: string
  line?: number
  column?: number
  timestamp: Date
}

export interface OverlayConfig {
  theme?: 'dark' | 'light'
  showStack?: boolean
  showSource?: boolean
  showHints?: boolean
}
