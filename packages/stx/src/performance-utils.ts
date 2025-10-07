/**
 * Performance optimization utilities for stx
 */

/**
 * Cache for compiled regex patterns to avoid recompilation
 */
const REGEX_CACHE = new Map<string, RegExp>()

/**
 * Get a cached regex pattern or compile and cache it
 */
export function getCachedRegex(pattern: string, flags?: string): RegExp {
  const key = `${pattern}:${flags || ''}`

  if (!REGEX_CACHE.has(key)) {
    REGEX_CACHE.set(key, new RegExp(pattern, flags))
  }

  return REGEX_CACHE.get(key)!
}

/**
 * Cache for template processing results
 */
export class TemplateCache {
  private cache = new Map<string, { result: string, timestamp: number, dependencies: Set<string> }>()
  private maxSize: number
  private ttl: number // Time to live in milliseconds

  constructor(maxSize = 1000, ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    this.maxSize = maxSize
    this.ttl = ttl
  }

  /**
   * Get cached result if available and not expired
   */
  get(key: string): string | null {
    const cached = this.cache.get(key)

    if (!cached) {
      return null
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.result
  }

  /**
   * Store result in cache
   */
  set(key: string, result: string, dependencies: Set<string> = new Set()): void {
    // If cache is full, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      dependencies,
    })
  }

  /**
   * Invalidate cache entries that depend on a specific file
   */
  invalidateDependency(filePath: string): number {
    let invalidated = 0

    for (const [key, cached] of this.cache.entries()) {
      if (cached.dependencies.has(filePath)) {
        this.cache.delete(key)
        invalidated++
      }
    }

    return invalidated
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number, maxSize: number, hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    }
  }
}

/**
 * Debounce function calls to avoid excessive processing
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | undefined

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

/**
 * Throttle function calls to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastExecution = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastExecution >= delay) {
      lastExecution = now
      func(...args)
    }
  }
}

/**
 * Memoize function results to avoid repeated calculations
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  maxCacheSize = 100,
): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    // If cache is full, remove oldest entry
    if (cache.size >= maxCacheSize) {
      const firstKey = cache.keys().next().value
      if (firstKey) {
        cache.delete(firstKey)
      }
    }

    const result = func(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * Optimized string replacement that reuses regex patterns
 */
export function optimizedReplace(
  text: string,
  pattern: string | RegExp,
  replacement: string | ((match: string, ...args: any[]) => string),
  flags?: string,
): string {
  if (typeof pattern === 'string') {
    const regex = getCachedRegex(pattern, flags)
    return text.replace(regex, replacement as any)
  }

  return text.replace(pattern, replacement as any)
}

/**
 * Pool of worker contexts to avoid creating new Function instances
 */
class ExpressionEvaluatorPool {
  private pool: Array<{ func: (...args: any[]) => any, context: string[] }> = []
  private maxPoolSize = 10

  getEvaluator(contextKeys: string[]): (...args: any[]) => any {
    const contextSignature = contextKeys.sort().join(',')

    // Try to find a reusable evaluator
    const reusable = this.pool.find(item => item.context.join(',') === contextSignature)
    if (reusable) {
      return reusable.func
    }

    // Create new evaluator
    // eslint-disable-next-line no-new-func
    const evaluator = new Function(...contextKeys, `
      'use strict';
      return function(expr) {
        try {
          return eval(expr);
        } catch (e) {
          if (e instanceof ReferenceError || e instanceof TypeError) {
            return undefined;
          }
          throw e;
        }
      }
    `) as (...args: any[]) => any

    // Add to pool if not full
    if (this.pool.length < this.maxPoolSize) {
      this.pool.push({
        func: evaluator,
        context: contextKeys.slice(),
      })
    }

    return evaluator
  }

  clear(): void {
    this.pool.length = 0
  }
}

// Global expression evaluator pool
export const expressionEvaluatorPool = new ExpressionEvaluatorPool()

/**
 * Performance monitor for tracking processing times
 */
export class PerformanceMonitor {
  private metrics = new Map<string, { count: number, totalTime: number, maxTime: number, minTime: number }>()

  /**
   * Time a function execution
   */
  time<T>(label: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start

    this.recordTime(label, duration)
    return result
  }

  /**
   * Time an async function execution
   */
  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start

    this.recordTime(label, duration)
    return result
  }

  /**
   * Record a timing measurement
   */
  recordTime(label: string, duration: number): void {
    const existing = this.metrics.get(label)

    if (existing) {
      existing.count++
      existing.totalTime += duration
      existing.maxTime = Math.max(existing.maxTime, duration)
      existing.minTime = Math.min(existing.minTime, duration)
    }
    else {
      this.metrics.set(label, {
        count: 1,
        totalTime: duration,
        maxTime: duration,
        minTime: duration,
      })
    }
  }

  /**
   * Get performance statistics
   */
  getStats(label?: string): Record<string, any> {
    if (label) {
      const metric = this.metrics.get(label)
      if (!metric)
        return {}

      return {
        count: metric.count,
        avgTime: metric.totalTime / metric.count,
        totalTime: metric.totalTime,
        maxTime: metric.maxTime,
        minTime: metric.minTime,
      }
    }

    const stats: Record<string, any> = {}
    for (const [key, metric] of this.metrics.entries()) {
      stats[key] = {
        count: metric.count,
        avgTime: metric.totalTime / metric.count,
        totalTime: metric.totalTime,
        maxTime: metric.maxTime,
        minTime: metric.minTime,
      }
    }

    return stats
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear()
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()
