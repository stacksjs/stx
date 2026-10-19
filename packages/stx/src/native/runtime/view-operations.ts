import type { STXBridge } from '../bridge/protocol'

export interface NativeFocusOptions { mode?: 'keyboard' | 'accessibility' }
export interface NativeViewBounds {
  x: number
  y: number
  width: number
  height: number
  viewportWidth: number
  viewportHeight: number
  unit: 'points' | 'dp'
  coordinateSpace: 'screenViewport'
}
export interface NativeViewOperations {
  focus: (nodeId: string, options?: NativeFocusOptions) => Promise<true>
  measure: (nodeId: string) => Promise<NativeViewBounds>
}

export function nativeViewError(code: string, message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code })
}

/** Craft #373: stable node ids and logical viewport coordinates, not DOM geometry. */
export function createNativeViewOperations(
  protocol: Pick<STXBridge, 'callNativeAPI'>,
  capabilities: readonly string[],
  beforeRequest: () => void,
): NativeViewOperations {
  const supported = new Set(capabilities)
  function prepare(capability: string): void {
    if (!supported.has(capability))
      throw nativeViewError('UNSUPPORTED', `This Craft host does not advertise ${capability}`)
    beforeRequest()
  }
  return {
    async focus(nodeId, options = {}) {
      const mode = options.mode ?? 'keyboard'
      if (mode !== 'keyboard' && mode !== 'accessibility')
        throw nativeViewError('INVALID_ARGUMENT', 'View.focus mode must be keyboard or accessibility')
      prepare('viewFocus')
      const result = await protocol.callNativeAPI('View', 'focus', { nodeId, mode })
      if (result !== true) throw nativeViewError('INVALID_RESPONSE', 'View.focus did not confirm focus')
      return true
    },
    async measure(nodeId) {
      prepare('viewMeasure')
      const box = await protocol.callNativeAPI<NativeViewBounds>('View', 'measure', { nodeId })
      if (!box || !['x', 'y', 'width', 'height', 'viewportWidth', 'viewportHeight'].every(key => typeof box[key as keyof NativeViewBounds] === 'number' && Number.isFinite(box[key as keyof NativeViewBounds]))
        || box.width < 0 || box.height < 0 || box.viewportWidth < 0 || box.viewportHeight < 0
        || !['points', 'dp'].includes(box.unit) || box.coordinateSpace !== 'screenViewport')
        throw nativeViewError('INVALID_RESPONSE', 'View.measure returned invalid viewport bounds')
      return box
    },
  }
}
