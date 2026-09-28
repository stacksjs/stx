/**
 * Worker entry for the startup image pass. See `image-worker.ts`.
 *
 * Runs the same in-thread functions a build calls, then posts back what they
 * left in this worker's module state, for the serving thread to install.
 *
 * @module builtins/image-warmup-worker
 */

import { parentPort } from 'node:worker_threads'
import { prepareImageDelivery, snapshotImageDelivery } from './image-delivery'
import { snapshotImagePlaceholders, warmImagePlaceholders } from './image-placeholder'

// The thread is a `node:worker_threads` Worker (see `image-worker.ts`), so the
// channel is `parentPort` rather than `self`: `self` also sees the messages in
// Bun, but only `parentPort` is the documented pair of the parent's Worker.
const port = parentPort
if (!port)
  throw new Error('image-warmup-worker must run as a worker thread')

interface TaskMessage {
  task: 'delivery' | 'placeholders'
  args: any
}

port.on('message', async (message: TaskMessage) => {
  const { task, args } = message
  try {
    if (task === 'delivery') {
      const result = await prepareImageDelivery(args.publicDir, args.outputDir)
      port.postMessage({ type: 'result', value: { result, state: snapshotImageDelivery() } })
    }
    else {
      await warmImagePlaceholders(args.publicDir, args.options)
      port.postMessage({ type: 'result', value: { placeholders: snapshotImagePlaceholders() } })
    }
  }
  catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    port.postMessage({ type: 'error', error: { name: err.name, message: err.message, stack: err.stack } })
  }
})

port.postMessage({ type: 'ready' })
