import { describe, expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'
import { createNativeViewOperations } from '../../src/native/runtime/view-operations'

const source = `<script client>
const field = useRef('field')
const shown = state(true)
const width = state(100)
window.probe = { field, shown, width }
onMount(() => { window.focused = field().focus().catch(error => ({ code: error.code })) })
</script><div><input testID="field" x-ref="field" :if="shown" :style="{ width: width() }" /></div>`

describe.each([false, true])('native mounted-view operations (minify=%s)', (minify) => {
  for (const platform of ['ios', 'android'] as const) {
    it(`uses mounted ids after rendering and preserves the ${platform} viewport contract`, async () => {
      const { code } = await compileNativeScreen(source, { minify })
      const box = { x: -4, y: 24, width: 100, height: 32, viewportWidth: 390, viewportHeight: 844, unit: platform === 'ios' ? 'points' : 'dp', coordinateSpace: 'screenViewport' }
      const calls: unknown[][] = []
      const phone = mountNativeScreen(code, 'Screen', {
        platform, capabilities: ['viewFocus', 'viewMeasure'],
        native(module, method, args) { calls.push([module, method, args]); return method === 'measure' ? box : true },
      })
      try {
        await phone.settle()
        expect(await phone.context.focused).toBe(true)
        expect(phone.context.craft.capabilities.viewFocus).toBe(true)
        expect(phone.context.craft.capabilities.viewMeasure).toBe(true)
        const id = phone.byTestID('field')!.id
        expect(calls[0]).toEqual(['View', 'focus', [{ nodeId: id, mode: 'keyboard' }]])
        expect(phone.messages.findIndex(message => message.type === 'RENDER')).toBeLessThan(phone.messages.findIndex(message => message.type === 'API_REQUEST'))
        const field = phone.context.probe.field()
        expect(await field.focus({ mode: 'accessibility' })).toBe(true)
        expect(calls.at(-1)).toEqual(['View', 'focus', [{ nodeId: id, mode: 'accessibility' }]])
        expect(await field.measure()).toEqual(box)
        expect(calls.at(-1)).toEqual(['View', 'measure', [{ nodeId: id }]])
        const start = phone.messages.length
        phone.context.probe.width.set(125)
        await field.measure()
        expect(phone.byTestID('field')!.style.width).toBe(125)
        const changed = phone.messages.slice(start)
        const mutation = changed.findIndex(message => message.type === 'MUTATE')
        expect(mutation).toBeGreaterThanOrEqual(0)
        expect(mutation).toBeLessThan(changed.findIndex(message => message.type === 'API_REQUEST'))
        phone.context.probe.shown.set(false)
        await phone.settle()
        const before = calls.length
        await expect(field.measure()).rejects.toMatchObject({ code: 'VIEW_NOT_MOUNTED' })
        expect(calls).toHaveLength(before)
        phone.unmount()
        await expect(field.focus()).rejects.toMatchObject({ code: 'SCREEN_CLOSED' })
        expect(calls).toHaveLength(before)
      }
      finally { phone.unmount() }
    }, 30_000)
  }
})

it('gates focus and measurement independently and propagates native focus errors', async () => {
  const { code } = await compileNativeScreen(source)
  const phone = mountNativeScreen(code, 'Screen', { capabilities: ['viewFocus'], native() { throw { code: 'UNSUPPORTED_TARGET', message: 'Not a supported focus target' } } })
  try {
    await phone.settle()
    expect(phone.context.craft.capabilities.viewMeasure).toBe(false)
    expect(await phone.context.focused).toEqual({ code: 'UNSUPPORTED_TARGET' })
    const count = phone.messages.filter(message => message.type === 'API_REQUEST').length
    await expect(phone.context.probe.field().measure()).rejects.toMatchObject({ code: 'UNSUPPORTED' })
    expect(phone.messages.filter(message => message.type === 'API_REQUEST')).toHaveLength(count)
  }
  finally { phone.unmount() }
})

it('rejects a stale measurement after removal and reinsertion of the same view id', async () => {
  const { code } = await compileNativeScreen(source)
  let reply: (value: unknown) => void = () => { throw new Error('No measurement request') }
  let requested = false
  const phone = mountNativeScreen(code, 'Screen', { capabilities: ['viewMeasure'], native() {
    requested = true
    return new Promise(resolve => { reply = resolve })
  } })
  try {
    await phone.settle()
    expect(await phone.context.focused).toEqual({ code: 'UNSUPPORTED' })
    const id = phone.byTestID('field')!.id
    const result = phone.context.probe.field().measure().catch((error: { code: string }) => error.code)
    await phone.settle()
    expect(requested).toBe(true)
    phone.context.probe.shown.set(false)
    await phone.settle()
    phone.context.probe.shown.set(true)
    await phone.settle()
    expect(phone.byTestID('field')!.id).toBe(id)
    reply({ x: 0, y: 0, width: 1, height: 1, viewportWidth: 390, viewportHeight: 844, unit: 'points', coordinateSpace: 'screenViewport' })
    expect(await result).toBe('VIEW_NOT_MOUNTED')
  }
  finally { phone.unmount() }
})

it('rejects malformed host results rather than inventing geometry or successful focus', async () => {
  let response: unknown
  const protocol = { async callNativeAPI<T>(): Promise<T> { return response as T } }
  const operations = createNativeViewOperations(protocol, ['viewFocus', 'viewMeasure'], () => {})
  response = false
  await expect(operations.focus('field')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  const box = { x: 0, y: 1, width: 2, height: 3, viewportWidth: 390, viewportHeight: 844, unit: 'points', coordinateSpace: 'screenViewport' }
  for (const invalid of [null, {}, { ...box, width: -1 }, { ...box, x: NaN }, { ...box, viewportWidth: Infinity }, { ...box, unit: 'px' }, { ...box, coordinateSpace: 'window' }]) {
    response = invalid
    await expect(operations.measure('field')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  }
})
