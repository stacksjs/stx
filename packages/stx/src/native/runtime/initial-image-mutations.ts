import type { NativeMutationOperation } from '../bridge/protocol'

function merge<T extends object>(before: T | undefined, patch: T | undefined): T | undefined {
  if (!patch) return before
  const next = { ...before } as Record<string, unknown>
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue
    if (value === null) delete next[key]
    else next[key] = value
  }
  return next as T
}

/** Give a new image its bound source, geometry and handlers in its first host operation. */
export function prepareInitialImages(operations: NativeMutationOperation[]): NativeMutationOperation[] {
  if (!operations.some(op => op.op === 'createNode' && op.node.type === 'Image')) return operations
  const created = new Map<string, Extract<NativeMutationOperation, { op: 'createNode' }>>()
  const result: NativeMutationOperation[] = []
  for (const operation of operations) {
    if (operation.op === 'createNode' && operation.node.type === 'Image') {
      const copy = { ...operation, node: { ...operation.node } }
      created.set(operation.id, copy)
      result.push(copy)
      continue
    }
    if (operation.op === 'removeNode') created.delete(operation.id)
    const initial = operation.op === 'updateNode' ? created.get(operation.id) : undefined
    if (operation.op !== 'updateNode' || !initial) {
      result.push(operation)
      continue
    }
    // Hosts can start loading during createNode. Sending a temporary empty
    // source and only then its binding produces a false missing-source error.
    // Include handlers too, so the real first load is never lost. Updates to
    // an image already committed in an earlier batch retain their ordering.
    initial.node.props = merge(initial.node.props, operation.patch.props)
    initial.node.style = merge(initial.node.style, operation.patch.style)
    initial.node.events = merge(initial.node.events, operation.patch.events)
    if (operation.patch.children !== undefined)
      result.push({ ...operation, patch: { children: operation.patch.children } })
  }
  return result
}
