import { describe, expect, it, afterEach, beforeEach } from 'bun:test'
import {
  batch,
  derived,
  effect,
  state,
  isSignal,
  isDerived,
} from '../../src/signals'

describe('signals integration - reactive chains', () => {
  it('should handle long dependency chains', () => {
    const a = state(1)
    const b = derived(() => a() * 2)
    const c = derived(() => b() * 3)
    const d = derived(() => c() * 4)
    const e = derived(() => d() * 5)

    expect(e()).toBe(120) // 1 * 2 * 3 * 4 * 5

    a.set(2)
    expect(e()).toBe(240) // 2 * 2 * 3 * 4 * 5
  })

  it('should handle diamond dependency patterns', () => {
    const source = state(1)
    const left = derived(() => source() * 2)
    const right = derived(() => source() * 3)
    const combined = derived(() => left() + right())

    expect(combined()).toBe(5) // (1*2) + (1*3)

    source.set(10)
    expect(combined()).toBe(50) // (10*2) + (10*3)
  })

  it('should handle multiple independent chains', () => {
    const a = state(1)
    const b = state(2)

    const chainA = derived(() => a() * 10)
    const chainB = derived(() => b() * 100)
    const combined = derived(() => chainA() + chainB())

    expect(combined()).toBe(210) // 10 + 200

    a.set(5)
    expect(combined()).toBe(250) // 50 + 200

    b.set(3)
    expect(combined()).toBe(350) // 50 + 300
  })

  it('should handle conditional dependencies', () => {
    const useFirst = state(true)
    const first = state(10)
    const second = state(20)

    const result = derived(() => {
      if (useFirst()) {
        return first()
      }
      return second()
    })

    expect(result()).toBe(10)

    useFirst.set(false)
    expect(result()).toBe(20)

    // Now changes to first shouldn't affect result
    first.set(100)
    expect(result()).toBe(20)
  })
})

describe('signals integration - effects with derived', () => {
  it('should trigger effects from derived changes', () => {
    const source = state(1)
    const doubled = derived(() => source() * 2)
    const values: number[] = []

    effect(() => {
      values.push(doubled())
    })

    source.set(2)
    source.set(3)

    expect(values).toEqual([2, 4, 6])
  })

  it('should handle effects with multiple derived dependencies', () => {
    const a = state(1)
    const b = state(2)
    const sumDerived = derived(() => a() + b())
    const productDerived = derived(() => a() * b())
    const effectResults: [number, number][] = []

    effect(() => {
      effectResults.push([sumDerived(), productDerived()])
    })

    a.set(3)
    b.set(4)

    expect(effectResults[0]).toEqual([3, 2]) // Initial
    expect(effectResults.length).toBeGreaterThanOrEqual(2)
  })

  it('should handle effect cleanup with derived dependencies', () => {
    const source = state(1)
    const doubled = derived(() => source() * 2)
    let cleanupCount = 0

    const cleanup = effect(() => {
      doubled()
      return () => {
        cleanupCount++
      }
    })

    source.set(2) // Should trigger cleanup + re-run
    source.set(3) // Should trigger cleanup + re-run

    cleanup() // Final cleanup

    expect(cleanupCount).toBeGreaterThanOrEqual(2)
  })
})

describe('signals integration - batching scenarios', () => {
  it('should batch updates to multiple signals', () => {
    const a = state(0)
    const b = state(0)
    const c = state(0)
    let effectRuns = 0

    effect(() => {
      a()
      b()
      c()
      effectRuns++
    })

    expect(effectRuns).toBe(1) // Initial

    batch(() => {
      a.set(1)
      b.set(2)
      c.set(3)
    })

    expect(effectRuns).toBe(2) // Only one additional run
    expect(a()).toBe(1)
    expect(b()).toBe(2)
    expect(c()).toBe(3)
  })

  it('should batch derived updates', () => {
    const a = state(1)
    const b = state(2)
    const sum = derived(() => a() + b())
    const values: number[] = []

    effect(() => {
      values.push(sum())
    })

    batch(() => {
      a.set(10)
      b.set(20)
    })

    expect(values[0]).toBe(3) // Initial
    expect(values[values.length - 1]).toBe(30) // Final after batch
  })

  it('should handle nested batches', () => {
    const count = state(0)
    let effectRuns = 0

    effect(() => {
      count()
      effectRuns++
    })

    expect(effectRuns).toBe(1)

    batch(() => {
      count.set(1)
      batch(() => {
        count.set(2)
        count.set(3)
      })
      count.set(4)
    })

    // All updates batched together
    expect(count()).toBe(4)
  })

  it('should handle errors in batch', () => {
    const count = state(0)

    expect(() => {
      batch(() => {
        count.set(1)
        throw new Error('Batch error')
      })
    }).toThrow('Batch error')

    // State should still be updated before error
    expect(count()).toBe(1)
  })
})

describe('signals integration - complex state patterns', () => {
  it('should handle todo list pattern', () => {
    interface Todo {
      id: number
      text: string
      completed: boolean
    }

    const todos = state<Todo[]>([])
    const filter = state<'all' | 'active' | 'completed'>('all')

    const filteredTodos = derived(() => {
      const list = todos()
      switch (filter()) {
        case 'active':
          return list.filter(t => !t.completed)
        case 'completed':
          return list.filter(t => t.completed)
        default:
          return list
      }
    })

    const totalCount = derived(() => todos().length)
    const activeCount = derived(() => todos().filter(t => !t.completed).length)
    const completedCount = derived(() => todos().filter(t => t.completed).length)

    // Add todos
    todos.update(list => [
      ...list,
      { id: 1, text: 'Task 1', completed: false },
      { id: 2, text: 'Task 2', completed: true },
      { id: 3, text: 'Task 3', completed: false },
    ])

    expect(totalCount()).toBe(3)
    expect(activeCount()).toBe(2)
    expect(completedCount()).toBe(1)
    expect(filteredTodos().length).toBe(3)

    filter.set('active')
    expect(filteredTodos().length).toBe(2)

    filter.set('completed')
    expect(filteredTodos().length).toBe(1)
  })

  it('should handle shopping cart pattern', () => {
    interface CartItem {
      id: string
      name: string
      price: number
      quantity: number
    }

    const cart = state<CartItem[]>([])
    const discount = state(0) // percentage

    const subtotal = derived(() =>
      cart().reduce((sum, item) => sum + item.price * item.quantity, 0),
    )

    const discountAmount = derived(() =>
      subtotal() * (discount() / 100),
    )

    const total = derived(() =>
      subtotal() - discountAmount(),
    )

    const itemCount = derived(() =>
      cart().reduce((sum, item) => sum + item.quantity, 0),
    )

    // Add items
    cart.set([
      { id: '1', name: 'Item A', price: 10, quantity: 2 },
      { id: '2', name: 'Item B', price: 20, quantity: 1 },
    ])

    expect(subtotal()).toBe(40) // 10*2 + 20*1
    expect(total()).toBe(40) // No discount
    expect(itemCount()).toBe(3)

    discount.set(10)
    expect(discountAmount()).toBe(4)
    expect(total()).toBe(36)

    // Update quantity
    cart.update(items =>
      items.map(item =>
        item.id === '1' ? { ...item, quantity: 5 } : item,
      ),
    )

    expect(subtotal()).toBe(70) // 10*5 + 20*1
    expect(discountAmount()).toBe(7)
    expect(total()).toBe(63)
  })

  it('should handle form state pattern', () => {
    const form = state({
      username: '',
      email: '',
      password: '',
    })

    const touched = state({
      username: false,
      email: false,
      password: false,
    })

    const errors = derived(() => {
      const { username, email, password } = form()
      const errs: Partial<Record<keyof typeof form extends () => infer T ? keyof T : never, string>> = {}

      if (username.length < 3) errs.username = 'Too short'
      if (!email.includes('@')) errs.email = 'Invalid email'
      if (password.length < 8) errs.password = 'Too short'

      return errs
    })

    const isValid = derived(() =>
      Object.keys(errors()).length === 0,
    )

    const canSubmit = derived(() => {
      const { username, email, password } = touched()
      return isValid() && (username && email && password)
    })

    expect(isValid()).toBe(false)
    expect(canSubmit()).toBe(false)

    form.set({
      username: 'john',
      email: 'john@example.com',
      password: 'password123',
    })

    expect(isValid()).toBe(true)
    expect(canSubmit()).toBe(false) // Not touched yet

    touched.set({
      username: true,
      email: true,
      password: true,
    })

    expect(canSubmit()).toBe(true)
  })
})

describe('signals integration - async patterns', () => {
  it('should handle async effects', async () => {
    const userId = state<number | null>(null)
    const userData = state<{ name: string } | null>(null)
    const loading = state(false)

    // Simulate async data fetching
    effect(() => {
      const id = userId()
      if (id !== null) {
        loading.set(true)
        setTimeout(() => {
          userData.set({ name: `User ${id}` })
          loading.set(false)
        }, 10)
      }
    })

    userId.set(1)

    expect(loading()).toBe(true)

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(loading()).toBe(false)
    expect(userData()?.name).toBe('User 1')
  })

  it('should handle debounced updates', async () => {
    const searchQuery = state('')
    const results = state<string[]>([])
    let searchCount = 0

    // Simulate debounced search
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    effect(() => {
      const query = searchQuery()

      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      if (query.length > 0) {
        debounceTimer = setTimeout(() => {
          searchCount++
          results.set([`Result for: ${query}`])
        }, 50)
      }
    })

    // Rapid updates
    searchQuery.set('a')
    searchQuery.set('ab')
    searchQuery.set('abc')

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 100))

    // Should only search once for final value
    expect(searchCount).toBe(1)
    expect(results()[0]).toContain('abc')
  })
})

describe('signals integration - memory and cleanup', () => {
  it('should properly cleanup disposed effects', () => {
    const count = state(0)
    let effectRuns = 0
    const cleanups: (() => void)[] = []

    // Create multiple effects
    for (let i = 0; i < 10; i++) {
      cleanups.push(
        effect(() => {
          count()
          effectRuns++
        }),
      )
    }

    expect(effectRuns).toBe(10)

    // Cleanup all effects
    cleanups.forEach(cleanup => cleanup())
    effectRuns = 0

    // Updates should not trigger effects
    count.set(1)
    count.set(2)

    expect(effectRuns).toBe(0)
  })

  it('should handle rapid subscribe/unsubscribe', () => {
    const count = state(0)
    const subscriptions: (() => void)[] = []

    // Subscribe 100 times
    for (let i = 0; i < 100; i++) {
      subscriptions.push(count.subscribe(() => {}))
    }

    // Unsubscribe all
    subscriptions.forEach(unsub => unsub())

    // Should not throw on update
    count.set(1)
    expect(count()).toBe(1)
  })

  it('should handle derived garbage collection', () => {
    const source = state(0)

    // Create and immediately discard derived values
    for (let i = 0; i < 100; i++) {
      const temp = derived(() => source() * i)
      temp() // Access once
    }

    // Should not throw
    source.set(1)
    expect(source()).toBe(1)
  })
})

describe('signals integration - error handling', () => {
  it('should handle errors in derived computations', () => {
    const shouldThrow = state(false)

    const risky = derived(() => {
      if (shouldThrow()) {
        throw new Error('Computation error')
      }
      return 'ok'
    })

    expect(risky()).toBe('ok')

    // This should throw when computed
    shouldThrow.set(true)
    expect(() => risky()).toThrow('Computation error')
  })

  it('should handle errors in effects gracefully', () => {
    const trigger = state(0)
    let errorCaught = false

    // In a real app, you'd have error boundaries
    try {
      effect(() => {
        if (trigger() > 5) {
          throw new Error('Effect error')
        }
      })

      trigger.set(10) // Should throw
    } catch {
      errorCaught = true
    }

    expect(errorCaught).toBe(true)
  })

  it('should continue working after errors', () => {
    const count = state(0)
    const values: number[] = []

    effect(() => {
      const c = count()
      if (c === 3) {
        // Skip problematic value
        return
      }
      values.push(c)
    })

    count.set(1)
    count.set(2)
    count.set(3) // Skipped
    count.set(4)

    expect(values).toContain(0)
    expect(values).toContain(1)
    expect(values).toContain(2)
    expect(values).toContain(4)
    expect(values).not.toContain(3)
  })
})

describe('signals integration - type safety', () => {
  it('should maintain type inference for primitive signals', () => {
    const num = state(42)
    const str = state('hello')
    const bool = state(true)

    // These should be type-safe
    num.set(100)
    str.set('world')
    bool.set(false)

    expect(typeof num()).toBe('number')
    expect(typeof str()).toBe('string')
    expect(typeof bool()).toBe('boolean')
  })

  it('should maintain type inference for object signals', () => {
    interface User {
      id: number
      name: string
      email: string
    }

    const user = state<User>({
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
    })

    // Type-safe update
    user.update(u => ({ ...u, name: 'Bob' }))

    expect(user().name).toBe('Bob')
    expect(user().id).toBe(1)
  })

  it('should maintain type inference for array signals', () => {
    const numbers = state<number[]>([1, 2, 3])
    const strings = state<string[]>(['a', 'b', 'c'])

    numbers.update(arr => [...arr, 4])
    strings.update(arr => arr.filter(s => s !== 'b'))

    expect(numbers()).toEqual([1, 2, 3, 4])
    expect(strings()).toEqual(['a', 'c'])
  })

  it('should infer derived types correctly', () => {
    const count = state(10)
    const doubled = derived(() => count() * 2)
    const stringified = derived(() => `Count: ${count()}`)

    expect(typeof doubled()).toBe('number')
    expect(typeof stringified()).toBe('string')
  })
})
