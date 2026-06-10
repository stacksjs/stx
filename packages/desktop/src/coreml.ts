/**
 * CoreML bindings — load + run on-device ML models.
 *
 * Workflow:
 *   1. `loadModel(id, path)` compiles (if needed) and caches the model
 *      under the caller-provided id.
 *   2. `predict(id, input)` runs inference. Input shape varies wildly
 *      by model — apps should consult their `MLModelDescription` and
 *      pass a dictionary that matches the input feature names.
 *   3. `unloadModel(id)` releases the underlying `MLModel` reference.
 *
 * Browser fallback: WebNN / TensorFlow.js fill the same role with a
 * different API shape; apps targeting both should detect at runtime.
 */
import { hasBridge } from './_bridge'

export interface CoreMLAPI {
  loadModel: (id: string, path: string) => Promise<boolean>
  unloadModel: (id: string) => Promise<void>
  predict: (id: string, input: Record<string, unknown>) => Promise<unknown>
}

export const coreml: CoreMLAPI = {
  async loadModel(id, path) {
    if (!id || !path) throw new Error('coreml.loadModel: id and path are required')
    if (!hasBridge('coreml')) return false
    return await window.craft!.coreml.loadModel(id, path)
  },
  async unloadModel(id) {
    if (!hasBridge('coreml')) return
    await window.craft!.coreml.unloadModel(id)
  },
  async predict(id, input) {
    if (!id) throw new Error('coreml.predict: id is required')
    if (!hasBridge('coreml')) return null
    return await window.craft!.coreml.predict(id, input)
  },
}
