import { describe, expect, it } from 'bun:test'
import { installJSCGlobals, NativeFormData, NATIVE_FORM_ENTRIES } from '../../src/native/runtime/jsc-globals'

describe('native form collection (#2088)', () => {
  it('reads a host-provided snapshot without a DOM or a file capability', () => {
    const scope: Record<string, any> = {}
    installJSCGlobals(scope)
    const values: Array<[string, unknown]> = [['name', 'Ada'], ['role', 'reader'], ['role', 'writer'], ['count', 0]]
    const handle = { [NATIVE_FORM_ENTRIES]() { return values } }
    const form = new scope.FormData(handle)
    values[0][1] = 'Grace'
    expect([...form]).toEqual([['name', 'Ada'], ['role', 'reader'], ['role', 'writer'], ['count', '0']])
    expect(form.getAll('role')).toEqual(['reader', 'writer'])
  })

  it('does not mistake arbitrary objects for native form handles', () => {
    for (const invalid of [null, {}, { elements: [] }, 'form'])
      expect(() => new NativeFormData(invalid)).toThrow('native form handle')
  })

  it('retains explicit append and file-part behavior', () => {
    const form = new NativeFormData()
    form.append('photo', { path: '/tmp/photo.png', name: 'photo.png', type: 'image/png' })
    form.append('caption', 'Profile')
    expect(form.get('photo')).toEqual({ path: '/tmp/photo.png', name: 'photo.png', type: 'image/png' })
    expect(form.get('caption')).toBe('Profile')
  })
})
