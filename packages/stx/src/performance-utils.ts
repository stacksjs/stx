/**
 * Performance optimization utilities for stx
 */

/**
 * Generic LRU (Least Recently Used) cache implementation
 * Automatically evicts least recently used items when capacity is reached
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>()
  private readonly maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  /**
   * Get a value from the cache, moving it to most recently used
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined
    }

    // Move to end (most recently used) by deleting and re-adding
    const value = this.cache.get(key)!
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  /**
   * Set a value in the cache
   */
  set(key: K, value: V): void {
    // If key exists, delete it first to update position
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    // If at capacity, delete the oldest (first) entry
    else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, value)
  }

  /**
   * Check if key exists in cache
   */
  has(key: K): boolean {
    return this.cache.has(key)
  }

  /**
   * Delete a key from the cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get the current size of the cache
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * Get all keys in the cache (oldest to newest)
   */
  keys(): IterableIterator<K> {
    return this.cache.keys()
  }

  /**
   * Get all values in the cache (oldest to newest)
   */
  values(): IterableIterator<V> {
    return this.cache.values()
  }
}

/**
 * Cache for compiled regex patterns to avoid recompilation.
 * Only stores non-global patterns to avoid lastIndex state issues.
 */
const REGEX_CACHE = new Map<string, RegExp>()

/**
 * Get a cached regex pattern or compile and cache it.
 *
 * IMPORTANT: For global patterns (flags include 'g'), this function returns
 * a NEW RegExp instance each time to avoid shared `lastIndex` state issues.
 * Only non-global patterns are cached.
 *
 * @param pattern - The regex pattern string
 * @param flags - Optional regex flags (e.g., 'i', 'g', 'gi')
 * @returns A RegExp instance (cached for non-global, new for global)
 *
 * @example
 * ```typescript
 * // Safe to cache - non-global pattern
 * const pattern = getCachedRegex('@if\\s*\\(', 'i')
 *
 * // Not cached - global patterns always return new instance
 * const global = getCachedRegex('@directive', 'g')
 * ```
 */
export function getCachedRegex(pattern: string, flags?: string): RegExp {
  // Global patterns have mutable lastIndex state, so always create new instances
  if (flags?.includes('g')) {
    return new RegExp(pattern, flags)
  }

  const key = `${pattern}:${flags || ''}`

  if (!REGEX_CACHE.has(key)) {
    REGEX_CACHE.set(key, new RegExp(pattern, flags))
  }

  return REGEX_CACHE.get(key)!
}

/**
 * Clear the regex cache (useful for testing)
 */
export function clearRegexCache(): void {
  REGEX_CACHE.clear()
}

/**
 * Cache for template processing results
 */
export class TemplateCache {
  private cache = new Map<string, { result: string, timestamp: number, dependencies: Set<string> }>()
  private maxSize: number
  private ttl: number // Time to live in milliseconds

  constructor(maxSize = 1000, ttl: number = 5 * 60 * 1000) { // 5 minutes default TTL
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
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let lastExecution = 0
  let lastResult: ReturnType<T> | undefined

  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    const now = Date.now()

    if (now - lastExecution >= delay) {
      lastExecution = now
      lastResult = func(...args)
    }
    return lastResult
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
 * Optimized string replacement that reuses regex patterns with case-preserving support
 */
export function optimizedReplace(
  text: string,
  pattern: string | RegExp,
  replacement: string | ((match: string, ...args: any[]) => string),
  flags?: string,
): string {
  if (typeof pattern === 'string') {
    const regex = getCachedRegex(pattern, flags)

    // If replacement is a string and case-insensitive flag is set, preserve case
    if (typeof replacement === 'string' && flags?.includes('i')) {
      const replacementStr = replacement
      return text.replace(regex, (match: string) => {
        // Detect the case of the original match
        if (match === match.toUpperCase() && match !== match.toLowerCase()) {
          // All uppercase (but not all same case like numbers)
          return replacementStr.toUpperCase()
        }
        else if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
          // First letter capitalized
          return replacementStr[0].toUpperCase() + replacementStr.slice(1).toLowerCase()
        }
        else {
          // All lowercase or no case
          return replacementStr.toLowerCase()
        }
      })
    }

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
    // Deduplicate keys to avoid "duplicate parameter name" errors in strict mode
    const uniqueKeys = Array.from(new Set(contextKeys))
    const contextSignature = uniqueKeys.sort().join(',')

    // Try to find a reusable evaluator
    const reusable = this.pool.find(item => item.context.join(',') === contextSignature)
    if (reusable) {
      return reusable.func
    }

    // Create new evaluator - handle empty context keys

    const evaluator = uniqueKeys.length === 0
    // eslint-disable-next-line no-new-func
      ? new Function(`
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
      `)() as (...args: any[]) => any
      // eslint-disable-next-line no-new-func
      : new Function(...uniqueKeys, `
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
        context: uniqueKeys.slice(),
      })
    }

    return evaluator
  }

  clear(): void {
    this.pool.length = 0
  }
}

// Global expression evaluator pool
export const expressionEvaluatorPool: ExpressionEvaluatorPool = new ExpressionEvaluatorPool()

/**
 * Performance budget configuration
 */
export interface PerformanceBudget {
  /** Maximum allowed time in milliseconds */
  maxTime: number
  /** Warning threshold (percentage of maxTime, e.g., 0.8 = 80%) */
  warnThreshold?: number
  /** Action to take on budget violation: 'log', 'warn', 'error', 'throw' */
  action?: 'log' | 'warn' | 'error' | 'throw'
}

/**
 * Performance budget violation event
 */
export interface BudgetViolation {
  label: string
  actualTime: number
  budgetTime: number
  exceedancePercent: number
  timestamp: Date
  isWarning: boolean
}

/**
 * Performance budget violation handler type
 */
export type BudgetViolationHandler = (violation: BudgetViolation) => void

/**
 * Performance monitor for tracking processing times with budget support
 */
export class PerformanceMonitor {
  private metrics = new Map<string, { count: number, totalTime: number, maxTime: number, minTime: number }>()
  private budgets = new Map<string, PerformanceBudget>()
  private violations: BudgetViolation[] = []
  private maxViolations = 100
  private violationHandlers: BudgetViolationHandler[] = []
  private enabled = true

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Set a performance budget for a specific operation
   *
   * @param label - Operation label
   * @param budget - Budget configuration
   *
   * @example
   * ```typescript
   * performanceMonitor.setBudget('processDirectives', {
   *   maxTime: 100, // 100ms max
   *   warnThreshold: 0.8, // warn at 80ms
   *   action: 'warn'
   * })
   * ```
   */
  setBudget(label: string, budget: PerformanceBudget): void {
    this.budgets.set(label, {
      warnThreshold: 0.8,
      action: 'warn',
      ...budget,
    })
  }

  /**
   * Set multiple performance budgets at once
   */
  setBudgets(budgets: Record<string, PerformanceBudget>): void {
    for (const [label, budget] of Object.entries(budgets)) {
      this.setBudget(label, budget)
    }
  }

  /**
   * Remove a performance budget
   */
  removeBudget(label: string): void {
    this.budgets.delete(label)
  }

  /**
   * Get all configured budgets
   */
  getBudgets(): Record<string, PerformanceBudget> {
    const result: Record<string, PerformanceBudget> = {}
    for (const [label, budget] of this.budgets.entries()) {
      result[label] = budget
    }
    return result
  }

  /**
   * Add a handler for budget violations
   */
  onViolation(handler: BudgetViolationHandler): void {
    this.violationHandlers.push(handler)
  }

  /**
   * Remove a violation handler
   */
  offViolation(handler: BudgetViolationHandler): void {
    const index = this.violationHandlers.indexOf(handler)
    if (index !== -1) {
      this.violationHandlers.splice(index, 1)
    }
  }

  /**
   * Time a function execution
   */
  time<T>(label: string, fn: () => T): T {
    if (!this.enabled) {
      return fn()
    }

    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start

    this.recordTime(label, duration)
    this.checkBudget(label, duration)
    return result
  }

  /**
   * Time an async function execution
   */
  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) {
      return fn()
    }

    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start

    this.recordTime(label, duration)
    this.checkBudget(label, duration)
    return result
  }

  /**
   * Check if a duration violates the budget
   */
  private checkBudget(label: string, duration: number): void {
    const budget = this.budgets.get(label)
    if (!budget)
      return

    const exceedancePercent = (duration / budget.maxTime) * 100
    const isWarning = budget.warnThreshold
      ? duration >= budget.maxTime * budget.warnThreshold && duration < budget.maxTime
      : false
    const isViolation = duration >= budget.maxTime

    if (!isWarning && !isViolation)
      return

    const violation: BudgetViolation = {
      label,
      actualTime: duration,
      budgetTime: budget.maxTime,
      exceedancePercent,
      timestamp: new Date(),
      isWarning,
    }

    // Store violation
    this.violations.push(violation)
    if (this.violations.length > this.maxViolations) {
      this.violations = this.violations.slice(-this.maxViolations)
    }

    // Call handlers
    for (const handler of this.violationHandlers) {
      try {
        handler(violation)
      }
      catch {
        // Ignore handler errors
      }
    }

    // Take action based on configuration
    const message = isWarning
      ? `[Performance Warning] "${label}" took ${duration.toFixed(2)}ms (${exceedancePercent.toFixed(1)}% of ${budget.maxTime}ms budget)`
      : `[Performance Budget Exceeded] "${label}" took ${duration.toFixed(2)}ms (exceeded ${budget.maxTime}ms budget by ${(exceedancePercent - 100).toFixed(1)}%)`

    switch (budget.action) {
      case 'log':
        console.log(message)
        break
      case 'warn':
        console.warn(message)
        break
      case 'error':
        console.error(message)
        break
      case 'throw':
        if (isViolation) {
          throw new Error(message)
        }
        else {
          console.warn(message)
        }
        break
    }
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

      const budget = this.budgets.get(label)
      return {
        count: metric.count,
        avgTime: metric.totalTime / metric.count,
        totalTime: metric.totalTime,
        maxTime: metric.maxTime,
        minTime: metric.minTime,
        budget: budget?.maxTime,
        budgetUtilization: budget ? (metric.totalTime / metric.count / budget.maxTime) * 100 : undefined,
      }
    }

    const stats: Record<string, any> = {}
    for (const [key, metric] of this.metrics.entries()) {
      const budget = this.budgets.get(key)
      stats[key] = {
        count: metric.count,
        avgTime: metric.totalTime / metric.count,
        totalTime: metric.totalTime,
        maxTime: metric.maxTime,
        minTime: metric.minTime,
        budget: budget?.maxTime,
        budgetUtilization: budget ? (metric.totalTime / metric.count / budget.maxTime) * 100 : undefined,
      }
    }

    return stats
  }

  /**
   * Get all budget violations
   */
  getViolations(label?: string): BudgetViolation[] {
    if (label) {
      return this.violations.filter(v => v.label === label)
    }
    return [...this.violations]
  }

  /**
   * Get violation statistics
   */
  getViolationStats(): { total: number, byLabel: Record<string, number>, warnings: number, errors: number } {
    const byLabel: Record<string, number> = {}
    let warnings = 0
    let errors = 0

    for (const v of this.violations) {
      byLabel[v.label] = (byLabel[v.label] || 0) + 1
      if (v.isWarning) {
        warnings++
      }
      else {
        errors++
      }
    }

    return { total: this.violations.length, byLabel, warnings, errors }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear()
  }

  /**
   * Clear all violations
   */
  clearViolations(): void {
    this.violations.length = 0
  }

  /**
   * Clear budgets
   */
  clearBudgets(): void {
    this.budgets.clear()
  }

  /**
   * Reset everything (metrics, violations, budgets)
   */
  reset(): void {
    this.clear()
    this.clearViolations()
    this.clearBudgets()
    this.violationHandlers.length = 0
  }
}

/**
 * Default performance budgets for common operations
 */
export const defaultPerformanceBudgets: Record<string, PerformanceBudget> = {
  processDirectives: { maxTime: 500, warnThreshold: 0.8, action: 'warn' },
  processTemplate: { maxTime: 200, warnThreshold: 0.8, action: 'warn' },
  processIncludes: { maxTime: 100, warnThreshold: 0.8, action: 'warn' },
  processLoops: { maxTime: 50, warnThreshold: 0.8, action: 'warn' },
  processConditionals: { maxTime: 50, warnThreshold: 0.8, action: 'warn' },
  processExpressions: { maxTime: 100, warnThreshold: 0.8, action: 'warn' },
  renderComponent: { maxTime: 150, warnThreshold: 0.8, action: 'warn' },
  buildWebComponents: { maxTime: 1000, warnThreshold: 0.8, action: 'warn' },
}

// Lazy-loaded performance monitor instance
let _performanceMonitor: PerformanceMonitor | null = null

/**
 * Get the global performance monitor instance (lazy-loaded)
 * This avoids instantiating the monitor until it's actually needed
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!_performanceMonitor) {
    _performanceMonitor = new PerformanceMonitor()
  }
  return _performanceMonitor
}

/**
 * Global performance monitor instance
 * @deprecated Use getPerformanceMonitor() for lazy loading
 */
export const performanceMonitor: PerformanceMonitor = new Proxy({} as PerformanceMonitor, {
  get(_target, prop) {
    return (getPerformanceMonitor() as any)[prop]
  },
})

/**
 * Apply default performance budgets to the monitor
 */
export function applyDefaultBudgets(monitor: PerformanceMonitor = getPerformanceMonitor()): void {
  monitor.setBudgets(defaultPerformanceBudgets)
}

/**
 * Reset the performance monitor instance (useful for testing)
 */
export function resetPerformanceMonitor(): void {
  _performanceMonitor = null
}
