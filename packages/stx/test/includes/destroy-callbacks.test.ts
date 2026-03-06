import { describe, expect, it } from 'bun:test'

describe('transformSignalScript destroy callbacks', () => {
  it('should include __destroyCallbacks in scope registration', async () => {
    // Read the includes source to verify the transform output contains __destroyCallbacks
    const source = await Bun.file(new URL('../../src/includes.ts', import.meta.url)).text()

    // Verify the transformSignalScript function includes __destroyCallbacks in scope registration
    expect(source).toContain('__destroyCallbacks: __destroyHooks')

    // Verify onDestroy is captured locally
    expect(source).toContain('var __destroyHooks = []')
    expect(source).toContain('var onDestroy = function(fn)')
  })
})
