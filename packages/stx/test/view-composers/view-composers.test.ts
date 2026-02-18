import { beforeEach, describe, expect, it } from 'bun:test'
import { composer, composerPattern, runComposers, clearComposers } from '../../src/view-composers'

describe('View Composers', () => {
  beforeEach(() => {
    clearComposers()
  })

  describe('composer() - exact match', () => {
    it('should match by view name', async () => {
      const context: Record<string, any> = {}
      composer('dashboard', (ctx) => {
        ctx.stats = { users: 100 }
      })

      await runComposers('/views/dashboard.stx', context)
      expect(context.stats).toEqual({ users: 100 })
    })

    it('should match by full file path', async () => {
      const context: Record<string, any> = {}
      composer('/views/admin/users.stx', (ctx) => {
        ctx.roles = ['admin', 'editor', 'viewer']
      })

      await runComposers('/views/admin/users.stx', context)
      expect(context.roles).toEqual(['admin', 'editor', 'viewer'])
    })

    it('should not match non-matching view', async () => {
      const context: Record<string, any> = {}
      composer('dashboard', (ctx) => {
        ctx.matched = true
      })

      await runComposers('/views/profile.stx', context)
      expect(context.matched).toBeUndefined()
    })

    it('should run multiple composers for same view in sequence', async () => {
      const context: Record<string, any> = { order: [] }

      composer('profile', (ctx) => {
        ctx.order.push('first')
        ctx.user = { name: 'Alice' }
      })

      composer('profile', (ctx) => {
        ctx.order.push('second')
        ctx.tabs = ['overview', 'settings']
      })

      await runComposers('/views/profile.stx', context)
      expect(context.order).toEqual(['first', 'second'])
      expect(context.user).toEqual({ name: 'Alice' })
      expect(context.tabs).toEqual(['overview', 'settings'])
    })

    it('should make context mutations visible to subsequent composers', async () => {
      const context: Record<string, any> = {}

      composer('page', (ctx) => {
        ctx.count = 1
      })

      composer('page', (ctx) => {
        ctx.count = ctx.count + 1
      })

      await runComposers('/views/page.stx', context)
      expect(context.count).toBe(2)
    })
  })

  describe('composerPattern() - regex match', () => {
    it('should match with RegExp pattern against view name', async () => {
      const context: Record<string, any> = {}
      composerPattern(/^admin/, (ctx) => {
        ctx.isAdmin = true
      })

      await runComposers('/views/admin-panel.stx', context)
      expect(context.isAdmin).toBe(true)
    })

    it('should not match non-matching pattern', async () => {
      const context: Record<string, any> = {}
      composerPattern(/^admin/, (ctx) => {
        ctx.isAdmin = true
      })

      await runComposers('/views/user-admin.stx', context)
      // 'user-admin' starts with 'user', not 'admin', so view name doesn't match
      // But the full path /views/user-admin.stx doesn't start with admin either
      // Pattern tests against both filePath and viewName
      expect(context.isAdmin).toBeUndefined()
    })

    it('should match with string pattern converted to RegExp', async () => {
      const context: Record<string, any> = {}
      composerPattern('settings', (ctx) => {
        ctx.settingsVersion = '2.0'
      })

      await runComposers('/views/settings.stx', context)
      expect(context.settingsVersion).toBe('2.0')
    })

    it('should match against full file path', async () => {
      const context: Record<string, any> = {}
      composerPattern(/\/admin\//, (ctx) => {
        ctx.isAdmin = true
      })

      await runComposers('/views/admin/users.stx', context)
      expect(context.isAdmin).toBe(true)
    })

    it('should run pattern composers in registration order', async () => {
      const context: Record<string, any> = { order: [] }

      composerPattern(/.*/, (ctx) => {
        ctx.order.push('first')
      })

      composerPattern(/.*/, (ctx) => {
        ctx.order.push('second')
      })

      composerPattern(/.*/, (ctx) => {
        ctx.order.push('third')
      })

      await runComposers('/views/any.stx', context)
      expect(context.order).toEqual(['first', 'second', 'third'])
    })
  })

  describe('execution order', () => {
    it('should run exact path match first, then exact name, then patterns', async () => {
      const context: Record<string, any> = { order: [] }

      // Register in reverse order to prove execution order is by type, not registration
      composerPattern(/.*/, (ctx) => {
        ctx.order.push('pattern')
      })

      composer('test', (ctx) => {
        ctx.order.push('exact-name')
      })

      composer('/views/test.stx', (ctx) => {
        ctx.order.push('exact-path')
      })

      await runComposers('/views/test.stx', context)
      expect(context.order).toEqual(['exact-path', 'exact-name', 'pattern'])
    })
  })

  describe('async composers', () => {
    it('should handle async callbacks', async () => {
      const context: Record<string, any> = {}

      composer('dashboard', async (ctx) => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10))
        ctx.asyncData = 'loaded'
      })

      await runComposers('/views/dashboard.stx', context)
      expect(context.asyncData).toBe('loaded')
    })

    it('should await async composers before running next', async () => {
      const context: Record<string, any> = { order: [] }

      composer('page', async (ctx) => {
        await new Promise(resolve => setTimeout(resolve, 20))
        ctx.order.push('async-first')
      })

      composer('page', (ctx) => {
        ctx.order.push('sync-second')
      })

      await runComposers('/views/page.stx', context)
      expect(context.order).toEqual(['async-first', 'sync-second'])
    })
  })

  describe('clearComposers', () => {
    it('should clear all registered composers', async () => {
      const context: Record<string, any> = {}

      composer('test', (ctx) => {
        ctx.value = 'set'
      })

      composerPattern(/.*/, (ctx) => {
        ctx.patternValue = 'set'
      })

      clearComposers()

      await runComposers('/views/test.stx', context)
      expect(context.value).toBeUndefined()
      expect(context.patternValue).toBeUndefined()
    })
  })

  describe('filePath parameter in callback', () => {
    it('should pass filePath to composer callback', async () => {
      const context: Record<string, any> = {}

      composer('test', (ctx, filePath) => {
        ctx.receivedPath = filePath
      })

      await runComposers('/views/test.stx', context)
      expect(context.receivedPath).toBe('/views/test.stx')
    })

    it('should pass filePath to pattern composer callback', async () => {
      const context: Record<string, any> = {}

      composerPattern(/.*/, (ctx, filePath) => {
        ctx.receivedPath = filePath
      })

      await runComposers('/views/special.stx', context)
      expect(context.receivedPath).toBe('/views/special.stx')
    })
  })
})
