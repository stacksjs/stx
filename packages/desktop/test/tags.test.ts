import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { tags } from '../src/tags'
import { findCall, installMockBridge } from './_mock-bridge'

describe('tags', () => {
  let bridge: ReturnType<typeof installMockBridge>
  beforeEach(() => { bridge = installMockBridge(['tags']) })
  afterEach(() => { bridge.uninstall() })

  it('get returns array of tag names', async () => {
    bridge.whenCalled('tags', 'get', ['Red', 'Important'])
    expect(await tags.get('/tmp/file')).toEqual(['Red', 'Important'])
  })

  it('set normalizes single string to array', async () => {
    bridge.whenCalled('tags', 'set', true)
    await tags.set('/tmp/file', 'Red')
    const c = findCall(bridge.calls, 'tags', 'set')!
    expect(c.args[0]).toBe('/tmp/file')
    expect(c.args[1]).toEqual(['Red'])
  })

  it('clear forwards path', async () => {
    bridge.whenCalled('tags', 'clear', true)
    await tags.clear('/tmp/file')
    expect(findCall(bridge.calls, 'tags', 'clear')!.args).toEqual(['/tmp/file'])
  })

  it('all methods reject empty path', async () => {
    await expect(tags.get('')).rejects.toThrow(/required/)
    await expect(tags.set('', [])).rejects.toThrow(/required/)
    await expect(tags.clear('')).rejects.toThrow(/required/)
  })
})
