import { beforeEach, describe, expect, it } from 'bun:test'
import {
  debounce,
  expressionEvaluatorPool,
  getCachedRegex,
  memoize,
  optimizedReplace,
  PerformanceMonitor,
  performanceMonitor,
  TemplateCache,
  throttle,
} from '../../src/performance-utils'

describe('Performance Utils', () => {
  describe('Regex Caching', () => {
    it('should cache and reuse regex patterns without global flag', () => {
      const pattern = 'test\\d+'
      const flags = 'i' // Non-global flag - can be cached

      const regex1 = getCachedRegex(pattern, flags)
      const regex2 = getCachedRegex(pattern, flags)

      // Should return the same instance (cached)
      expect(regex1).toBe(regex2)
      expect(regex1.source).toBe(pattern)
      expect(regex1.flags).toBe(flags)
    })

    it('should NOT cache regex patterns with global flag', () => {
      const pattern = 'test\\d+'
      const flags = 'gi' // Global flag - creates new instance each time

      const regex1 = getCachedRegex(pattern, flags)
      const regex2 = getCachedRegex(pattern, flags)

      // Should return different instances (not cached due to mutable lastIndex)
      expect(regex1).not.toBe(regex2)
      expect(regex1.source).toBe(pattern)
      expect(regex1.flags).toBe(flags)
    })

    it('should create different instances for different patterns', () => {
      const regex1 = getCachedRegex('pattern1')
      const regex2 = getCachedRegex('pattern2')

      expect(regex1).not.toBe(regex2)
    })

    it('should create different instances for different flags', () => {
      const pattern = 'test'
      const regex1 = getCachedRegex(pattern, 'i')
      const regex2 = getCachedRegex(pattern, 'g')

      expect(regex1).not.toBe(regex2)
    })
  })

  describe('Template Cache', () => {
    let cache: TemplateCache

    beforeEach(() => {
      cache = new TemplateCache(5, 1000) // Small cache with 1 second TTL
    })

    it('should store and retrieve cached templates', () => {
      const key = 'template1'
      const result = '<html>Processed template</html>'
      const dependencies = new Set(['dep1', 'dep2'])

      cache.set(key, result, dependencies)
      const retrieved = cache.get(key)

      expect(retrieved).toBe(result)
    })

    it('should return null for non-existent keys', () => {
      const result = cache.get('nonexistent')
      expect(result).toBeNull()
    })

    it('should expire entries after TTL', async () => {
      const cache = new TemplateCache(5, 100) // 100ms TTL
      const key = 'expiring-template'
      const result = '<html>Will expire</html>'

      cache.set(key, result)
      expect(cache.get(key)).toBe(result)

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(cache.get(key)).toBeNull()
    })

    it('should remove oldest entries when cache is full', () => {
      const cache = new TemplateCache(2, 10000) // Max 2 entries

      cache.set('template1', 'result1')
      cache.set('template2', 'result2')
      cache.set('template3', 'result3') // Should evict template1

      expect(cache.get('template1')).toBeNull()
      expect(cache.get('template2')).toBe('result2')
      expect(cache.get('template3')).toBe('result3')
    })

    it('should invalidate dependencies', () => {
      const deps1 = new Set(['file1.stx', 'shared.stx'])
      const deps2 = new Set(['file2.stx', 'shared.stx'])

      cache.set('template1', 'result1', deps1)
      cache.set('template2', 'result2', deps2)

      const invalidated = cache.invalidateDependency('shared.stx')

      expect(invalidated).toBe(2)
      expect(cache.get('template1')).toBeNull()
      expect(cache.get('template2')).toBeNull()
    })

    it('should provide cache statistics', () => {
      cache.set('template1', 'result1')
      cache.set('template2', 'result2')

      const stats = cache.getStats()
      expect(stats.size).toBe(2)
      expect(stats.maxSize).toBe(5)
    })

    it('should clear all cached entries', () => {
      cache.set('template1', 'result1')
      cache.set('template2', 'result2')

      cache.clear()

      expect(cache.get('template1')).toBeNull()
      expect(cache.get('template2')).toBeNull()
    })
  })

  describe('Debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0
      const increment = () => callCount++

      const debouncedIncrement = debounce(increment, 50)

      // Call multiple times rapidly
      debouncedIncrement()
      debouncedIncrement()
      debouncedIncrement()

      // Should not have executed yet
      expect(callCount).toBe(0)

      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 60))

      // Should have executed only once
      expect(callCount).toBe(1)
    })

    it('should reset debounce timer on subsequent calls', async () => {
      let callCount = 0
      const increment = () => callCount++

      const debouncedIncrement = debounce(increment, 50)

      debouncedIncrement()

      // Call again before delay expires
      setTimeout(() => debouncedIncrement(), 25)

      // Wait for initial delay
      await new Promise(resolve => setTimeout(resolve, 60))

      // Should not have executed yet (timer was reset)
      expect(callCount).toBe(0)

      // Wait for reset delay
      await new Promise(resolve => setTimeout(resolve, 30))

      // Should have executed once
      expect(callCount).toBe(1)
    })
  })

  describe('Throttle', () => {
    it('should throttle function calls', async () => {
      let callCount = 0
      const increment = () => callCount++

      const throttledIncrement = throttle(increment, 50)

      // First call should execute immediately
      throttledIncrement()
      expect(callCount).toBe(1)

      // Subsequent calls should be throttled
      throttledIncrement()
      throttledIncrement()
      expect(callCount).toBe(1)

      // Wait for throttle delay
      await new Promise(resolve => setTimeout(resolve, 60))

      // Next call should execute
      throttledIncrement()
      expect(callCount).toBe(2)
    })
  })

  describe('Memoization', () => {
    it('should memoize function results', () => {
      let callCount = 0
      const expensiveFunction = (n: number) => {
        callCount++
        return n * n
      }

      const memoizedFunction = memoize(expensiveFunction)

      // First call
      const result1 = memoizedFunction(5)
      expect(result1).toBe(25)
      expect(callCount).toBe(1)

      // Second call with same argument (should be cached)
      const result2 = memoizedFunction(5)
      expect(result2).toBe(25)
      expect(callCount).toBe(1) // Should not have called function again

      // Call with different argument
      const result3 = memoizedFunction(10)
      expect(result3).toBe(100)
      expect(callCount).toBe(2)
    })

    it('should limit cache size', () => {
      let callCount = 0
      const fn = (n: number) => {
        callCount++
        return n
      }

      const memoizedFn = memoize(fn, 2) // Max cache size of 2

      memoizedFn(1) // Cache: [1]
      memoizedFn(2) // Cache: [1, 2]
      memoizedFn(3) // Cache: [2, 3] (1 evicted)

      // Call with 1 again (should not be cached)
      memoizedFn(1)
      expect(callCount).toBe(4) // Should have been called again
    })
  })

  describe('Optimized Replace', () => {
    it('should use cached regex for string patterns', () => {
      const text = 'hello world hello universe'
      const result = optimizedReplace(text, 'hello', 'hi', 'g')

      expect(result).toBe('hi world hi universe')
    })

    it('should work with regex patterns', () => {
      const text = 'test123 test456'
      const regex = /test\d+/g
      const result = optimizedReplace(text, regex, 'replaced')

      expect(result).toBe('replaced replaced')
    })

    it('should work with function replacements', () => {
      const text = 'hello world'
      const result = optimizedReplace(text, 'hello', match => match.toUpperCase())

      expect(result).toBe('HELLO world')
    })
  })

  describe('Expression Evaluator Pool', () => {
    it('should reuse evaluators for same context keys', () => {
      const keys1 = ['name', 'age']
      const keys2 = ['age', 'name'] // Same keys, different order

      const evaluator1 = expressionEvaluatorPool.getEvaluator(keys1)
      const evaluator2 = expressionEvaluatorPool.getEvaluator(keys2)

      // Should reuse the same evaluator (keys are sorted internally)
      expect(evaluator1).toBe(evaluator2)
    })

    it('should create different evaluators for different contexts', () => {
      const keys1 = ['name', 'age']
      const keys2 = ['name', 'email']

      const evaluator1 = expressionEvaluatorPool.getEvaluator(keys1)
      const evaluator2 = expressionEvaluatorPool.getEvaluator(keys2)

      expect(evaluator1).not.toBe(evaluator2)
    })

    it('should clear the pool', () => {
      const keys = ['name']
      const evaluator1 = expressionEvaluatorPool.getEvaluator(keys)

      expressionEvaluatorPool.clear()

      const evaluator2 = expressionEvaluatorPool.getEvaluator(keys)

      // Should create a new evaluator after clearing
      expect(evaluator1).not.toBe(evaluator2)
    })
  })

  describe('Performance Monitor', () => {
    let monitor: PerformanceMonitor

    beforeEach(() => {
      monitor = new PerformanceMonitor()
    })

    it('should time function execution', () => {
      const result = monitor.time('test-operation', () => {
        // Simulate some work
        let sum = 0
        for (let i = 0; i < 1000; i++) {
          sum += i
        }
        return sum
      })

      expect(result).toBe(499500) // Sum of 0 to 999

      const stats = monitor.getStats('test-operation')
      expect(stats.count).toBe(1)
      expect(stats.totalTime).toBeGreaterThan(0)
      expect(stats.avgTime).toBeGreaterThan(0)
    })

    it('should time async function execution', async () => {
      const result = await monitor.timeAsync('async-operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'async result'
      })

      expect(result).toBe('async result')

      const stats = monitor.getStats('async-operation')
      expect(stats.count).toBe(1)
      expect(stats.totalTime).toBeGreaterThanOrEqual(10)
    })

    it('should record multiple timings', () => {
      monitor.time('operation', () => 1)
      monitor.time('operation', () => 2)
      monitor.time('operation', () => 3)

      const stats = monitor.getStats('operation')
      expect(stats.count).toBe(3)
      expect(stats.avgTime).toBeGreaterThan(0)
      expect(stats.minTime).toBeGreaterThan(0)
      expect(stats.maxTime).toBeGreaterThanOrEqual(stats.minTime)
    })

    it('should provide overall statistics', () => {
      monitor.time('op1', () => 1)
      monitor.time('op2', () => 2)

      const allStats = monitor.getStats()
      expect(allStats).toHaveProperty('op1')
      expect(allStats).toHaveProperty('op2')
      expect(allStats.op1.count).toBe(1)
      expect(allStats.op2.count).toBe(1)
    })

    it('should record manual timings', () => {
      monitor.recordTime('manual-operation', 100)
      monitor.recordTime('manual-operation', 200)

      const stats = monitor.getStats('manual-operation')
      expect(stats.count).toBe(2)
      expect(stats.totalTime).toBe(300)
      expect(stats.avgTime).toBe(150)
      expect(stats.minTime).toBe(100)
      expect(stats.maxTime).toBe(200)
    })

    it('should clear all metrics', () => {
      monitor.time('operation', () => 1)

      const statsBefore = monitor.getStats()
      expect(Object.keys(statsBefore)).toHaveLength(1)

      monitor.clear()

      const statsAfter = monitor.getStats()
      expect(Object.keys(statsAfter)).toHaveLength(0)
    })
  })

  describe('Global Performance Monitor', () => {
    it('should be accessible globally', () => {
      // performanceMonitor is a Proxy that delegates to a lazily-loaded PerformanceMonitor
      // Since it's a Proxy, we can't use instanceof, but we can verify it has the expected methods
      expect(typeof performanceMonitor.recordTime).toBe('function')
      expect(typeof performanceMonitor.getStats).toBe('function')
      expect(typeof performanceMonitor.reset).toBe('function')
    })

    it('should maintain state across calls', () => {
      performanceMonitor.recordTime('global-test', 50)

      const stats = performanceMonitor.getStats('global-test')
      expect(stats.count).toBe(1)
      expect(stats.totalTime).toBe(50)
    })
  })

  describe('Advanced Caching Scenarios', () => {
    let cache: TemplateCache

    beforeEach(() => {
      cache = new TemplateCache(10, 5000)
    })

    it('should handle concurrent cache operations', async () => {
      const promises = []

      // Simulate concurrent cache operations
      for (let i = 0; i < 20; i++) {
        promises.push(
          Promise.resolve().then(() => {
            cache.set(`key-${i}`, `result-${i}`, new Set([`dep-${i}`]))
          }),
        )
      }

      await Promise.all(promises)

      // Should have limited entries due to cache size
      const stats = cache.getStats()
      expect(stats.size).toBeLessThanOrEqual(10)
    })

    it('should handle complex dependency invalidation', () => {
      // Create interdependent cache entries
      cache.set('template1', 'result1', new Set(['shared.stx', 'header.stx']))
      cache.set('template2', 'result2', new Set(['shared.stx', 'footer.stx']))
      cache.set('template3', 'result3', new Set(['footer.stx']))
      cache.set('template4', 'result4', new Set(['standalone.stx']))

      // Invalidate shared dependency
      const invalidated = cache.invalidateDependency('shared.stx')
      expect(invalidated).toBe(2) // template1 and template2

      expect(cache.get('template1')).toBeNull()
      expect(cache.get('template2')).toBeNull()
      expect(cache.get('template3')).toBe('result3') // Should still exist
      expect(cache.get('template4')).toBe('result4') // Should still exist
    })

    it('should properly handle edge cases in dependency tracking', () => {
      // Empty dependencies
      cache.set('template1', 'result1', new Set())

      // Duplicate dependencies
      const deps = new Set(['file.stx', 'file.stx'])
      cache.set('template2', 'result2', deps)

      // Non-existent dependency invalidation
      const invalidated = cache.invalidateDependency('nonexistent.stx')
      expect(invalidated).toBe(0)

      // Verify entries still exist
      expect(cache.get('template1')).toBe('result1')
      expect(cache.get('template2')).toBe('result2')
    })

    it('should handle cache statistics accurately', () => {
      // Add various entries
      cache.set('temp1', 'result1')
      cache.set('temp2', 'result2')
      cache.set('temp3', 'result3')

      const stats = cache.getStats()
      expect(stats.size).toBe(3)
      expect(stats.maxSize).toBe(10)

      // Clear and verify
      cache.clear()
      const emptyStats = cache.getStats()
      expect(emptyStats.size).toBe(0)
    })
  })

  describe('Performance Optimization Patterns', () => {
    it('should demonstrate effective memoization usage', () => {
      let computationCount = 0

      const expensiveComputation = (data: string) => {
        computationCount++
        // Simulate expensive operation
        return data.split('').reverse().join('').toUpperCase()
      }

      const memoizedComputation = memoize(expensiveComputation, 100)

      // First calls should trigger computation
      const result1 = memoizedComputation('hello')
      const result2 = memoizedComputation('world')
      expect(computationCount).toBe(2)

      // Repeated calls should use cache
      const result3 = memoizedComputation('hello')
      const result4 = memoizedComputation('world')
      expect(computationCount).toBe(2) // Should not increase

      expect(result1).toBe(result3)
      expect(result2).toBe(result4)
      expect(result1).toBe('OLLEH')
      expect(result2).toBe('DLROW')
    })

    it('should handle throttling for high-frequency operations', async () => {
      let executionCount = 0
      const operation = () => {
        executionCount++
        return executionCount
      }

      const throttledOperation = throttle(operation, 100)

      // Rapid consecutive calls
      const results = []
      for (let i = 0; i < 10; i++) {
        results.push(throttledOperation())
      }

      // Should execute immediately for first call
      expect(results[0]).toBe(1)

      // Subsequent calls should be throttled
      for (let i = 1; i < 10; i++) {
        expect(results[i]).toBe(1) // Same result as first call
      }

      // Wait for throttle period and test again
      await new Promise(resolve => setTimeout(resolve, 150))

      const nextResult = throttledOperation()
      expect(nextResult).toBe(2) // New execution
    })

    it('should handle debouncing for batching operations', async () => {
      let executionCount = 0
      const batchedOperation = () => {
        executionCount++
        return `batch-${executionCount}`
      }

      const debouncedOperation = debounce(batchedOperation, 50)

      // Rapid consecutive calls
      debouncedOperation()
      debouncedOperation()
      debouncedOperation()
      debouncedOperation()

      // Should not execute immediately
      expect(executionCount).toBe(0)

      // Wait for debounce period
      await new Promise(resolve => setTimeout(resolve, 70))

      // Should execute once
      expect(executionCount).toBe(1)
    })
  })

  describe('Expression Evaluator Pool Optimization', () => {
    it('should efficiently reuse evaluators', () => {
      const pool = expressionEvaluatorPool

      // Clear pool to start fresh
      pool.clear()

      // Create evaluators for different contexts
      const evaluator1 = pool.getEvaluator(['name', 'age', 'email'])
      const evaluator2 = pool.getEvaluator(['age', 'email', 'name']) // Same keys, different order
      const evaluator3 = pool.getEvaluator(['name', 'email']) // Subset
      const evaluator4 = pool.getEvaluator(['name', 'age', 'email']) // Exact match

      // Should reuse for same context (regardless of order)
      expect(evaluator1).toBe(evaluator2)
      expect(evaluator1).toBe(evaluator4)

      // Should create new for different context
      expect(evaluator1).not.toBe(evaluator3)
    })

    it('should handle edge cases in evaluator creation', () => {
      const pool = expressionEvaluatorPool

      // Empty context
      const emptyEvaluator = pool.getEvaluator([])
      expect(emptyEvaluator).toBeDefined()

      // Single key
      const singleEvaluator = pool.getEvaluator(['singleKey'])
      expect(singleEvaluator).toBeDefined()

      // Duplicate keys (should be normalized)
      const duplicateEvaluator1 = pool.getEvaluator(['key', 'key', 'other'])
      const duplicateEvaluator2 = pool.getEvaluator(['key', 'other'])
      expect(duplicateEvaluator1).toBe(duplicateEvaluator2)
    })
  })

  describe('Regex Caching Performance', () => {
    it('should cache regex patterns effectively for non-global patterns', () => {
      // Test that regex caching works as expected (non-global flags)
      const pattern1 = 'test\\d+'
      const pattern2 = 'hello.*world'
      const flags = 'i' // Non-global flag - can be cached

      // Create multiple regex instances
      const regex1a = getCachedRegex(pattern1, flags)
      const regex1b = getCachedRegex(pattern1, flags)
      const regex2a = getCachedRegex(pattern2, flags)
      const regex2b = getCachedRegex(pattern2, flags)

      // Same pattern should return same instance
      expect(regex1a).toBe(regex1b)
      expect(regex2a).toBe(regex2b)

      // Different patterns should return different instances
      expect(regex1a).not.toBe(regex2a)

      // Verify functionality
      expect('test123'.match(regex1a)).toBeTruthy()
      expect('hello beautiful world'.match(regex2a)).toBeTruthy()
    })

    it('should create new instances for global patterns', () => {
      // Global patterns are not cached due to mutable lastIndex state
      const pattern = 'test\\d+'
      const flags = 'gi'

      const regex1 = getCachedRegex(pattern, flags)
      const regex2 = getCachedRegex(pattern, flags)

      // Should be different instances
      expect(regex1).not.toBe(regex2)

      // But should both work correctly
      expect('test123'.match(regex1)).toBeTruthy()
      expect('test456'.match(regex2)).toBeTruthy()
    })

    it('should handle optimized string replacement', () => {
      const text = 'Hello world, hello universe, hello everyone'

      // Test with string pattern
      const result1 = optimizedReplace(text, 'hello', 'hi', 'gi')
      expect(result1).toBe('Hi world, hi universe, hi everyone')

      // Test with regex pattern
      const result2 = optimizedReplace(text, /hello/gi, 'greetings')
      expect(result2).toBe('greetings world, greetings universe, greetings everyone')

      // Test with function replacement
      const result3 = optimizedReplace(text, /hello/gi, match => match.toUpperCase())
      expect(result3).toBe('HELLO world, HELLO universe, HELLO everyone')
    })
  })

  describe('Memory Management and Cleanup', () => {
    it('should properly clean up cache resources', () => {
      const cache = new TemplateCache(5, 100) // Small TTL

      // Fill cache
      for (let i = 0; i < 10; i++) {
        cache.set(`key-${i}`, `value-${i}`)
      }

      // Should be limited by max size
      expect(cache.getStats().size).toBeLessThanOrEqual(5)

      // Clear and verify cleanup
      cache.clear()
      expect(cache.getStats().size).toBe(0)
    })

    it('should handle performance monitor cleanup', () => {
      const monitor = new PerformanceMonitor()

      // Add some metrics
      monitor.recordTime('operation1', 100)
      monitor.recordTime('operation2', 200)
      monitor.recordTime('operation3', 300)

      const statsBefore = monitor.getStats()
      expect(Object.keys(statsBefore)).toHaveLength(3)

      // Clear and verify
      monitor.clear()
      const statsAfter = monitor.getStats()
      expect(Object.keys(statsAfter)).toHaveLength(0)
    })

    it('should handle evaluator pool cleanup', () => {
      const pool = expressionEvaluatorPool

      // Create some evaluators
      pool.getEvaluator(['key1'])
      pool.getEvaluator(['key2'])
      pool.getEvaluator(['key3'])

      // Clear pool
      pool.clear()

      // New evaluators should be different instances
      const newEvaluator1 = pool.getEvaluator(['key1'])
      const newEvaluator2 = pool.getEvaluator(['key1'])

      // Should still cache after clear
      expect(newEvaluator1).toBe(newEvaluator2)
    })
  })
})
