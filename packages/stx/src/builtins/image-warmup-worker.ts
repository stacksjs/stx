/**
 * Worker entry for the startup image pass. See `image-worker.ts`.
 *
 * Runs the same in-thread functions a build calls, then posts back what they
 * left in this worker's module state, for the serving thread to install.
 *
 * @module builtins/image-warmup-worker
 */

import { prepareImageDelivery, snapshotImageDelivery } from './image-delivery'
import { snapshotImagePlaceholders, warmImagePlaceholders } from './image-placeholder'

declare const self: Worker

interface TaskMessage {
  task: 'delivery' | 'placeholders'
  args: any
}

self.addEventListener('message', async (event: MessageEvent<TaskMessage>) => {
  const { task, args } = event.data
  try {
    if (task === 'delivery') {
      const result = await prepareImageDelivery(args.publicDir, args.outputDir)
      self.postMessage({ type: 'result', value: { result, state: snapshotImageDelivery() } })
    }
    else {
      await warmImagePlaceholders(args.publicDir, args.options)
      self.postMessage({ type: 'result', value: { placeholders: snapshotImagePlaceholders() } })
    }
  }
  catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    self.postMessage({ type: 'error', error: { name: err.name, message: err.message, stack: err.stack } })
  }
})

self.postMessage({ type: 'ready' })
