import type { ErrorBoundaryConfig, ErrorInfo } from './types'

export class ErrorBoundary {
  private config: ErrorBoundaryConfig

  constructor(config: ErrorBoundaryConfig) {
    this.config = config
  }

  catch(error: Error, info?: Partial<ErrorInfo>): string | Response {
    const fullInfo: ErrorInfo = {
      timestamp: new Date(),
      ...info,
    }

    if (this.config.onError) {
      this.config.onError(error)
    }

    return this.config.catch(error, fullInfo)
  }

  wrap<T>(fn: () => T): T | string {
    try {
      return fn()
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      const result = this.catch(err)
      if (result instanceof Response) {
        return this.config.fallback ?? ''
      }
      return result
    }
  }

  async wrapAsync<T>(fn: () => Promise<T>): Promise<T | string> {
    try {
      return await fn()
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      const result = this.catch(err)
      if (result instanceof Response) {
        return this.config.fallback ?? ''
      }
      return result
    }
  }
}

export function defineErrorBoundary(config: ErrorBoundaryConfig): ErrorBoundary {
  return new ErrorBoundary(config)
}
