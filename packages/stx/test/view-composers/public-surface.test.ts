import { beforeEach, describe, expect, it } from 'bun:test'
// Deliberately imported from the PACKAGE ENTRY, not from '../../src/view-composers'.
//
// view-composers.test.ts imports the module directly, which is why #1860 went
// unnoticed: `runComposers` was wired into the render pipeline and ran on every
// render, but `composer()` / `composerPattern()` were never re-exported from
// index.ts, so no application could ever register one. The registry was empty
// forever and every test still passed.
//
// These assertions exist to fail if the re-export is ever dropped again.
import { clearComposers, composer, composerPattern, runComposers } from '../../src/index'

describe('view composers: public surface (#1860)', () => {
  beforeEach(() => {
    clearComposers()
  })

  it('exports the registration functions from the package entry', () => {
    expect(typeof composer).toBe('function')
    expect(typeof composerPattern).toBe('function')
    expect(typeof runComposers).toBe('function')
    expect(typeof clearComposers).toBe('function')
  })

  it('registers and runs an exact-match composer reached through the entry', async () => {
    const context: Record<string, any> = {}
    composer('dashboard', (ctx) => {
      ctx.stats = { users: 100 }
    })

    await runComposers('/views/dashboard.stx', context)
    expect(context.stats).toEqual({ users: 100 })
  })

  it('registers and runs a pattern composer reached through the entry', async () => {
    const context: Record<string, any> = {}
    composerPattern(/^admin/, (ctx) => {
      ctx.isAdmin = true
    })

    await runComposers('/views/admin.stx', context)
    expect(context.isAdmin).toBe(true)
  })

  it('is the same registry the entry and the module both see', async () => {
    // Registering through the entry must be visible to the pipeline, which
    // imports from './view-composers'. A duplicated module instance would make
    // the export look correct while still leaving the pipeline's registry empty.
    const direct = await import('../../src/view-composers')
    const context: Record<string, any> = {}

    composer('shared', (ctx) => {
      ctx.viaEntry = true
    })

    await direct.runComposers('/views/shared.stx', context)
    expect(context.viaEntry).toBe(true)
  })
})
