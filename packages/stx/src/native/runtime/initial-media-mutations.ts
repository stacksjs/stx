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

/** Give newly created media its bound source, geometry and handlers immediately. */
export function prepareInitialMedia(operations: NativeMutationOperation[]): NativeMutationOperation[] {
  if (!operations.some(op => op.op === 'createNode' && (op.node.type === 'Image' || op.node.type === 'Video'))) return operations
  const created = new Map<string, Extract<NativeMutationOperation, { op: 'createNode' }>>()
  const result: NativeMutationOperation[] = []
  for (const operation of operations) {
    if (operation.op === 'createNode' && (operation.node.type === 'Image' || operation.node.type === 'Video')) {
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
    // Hosts can start loading during createNode. A stale source/flag can load
    // the wrong video; an empty source can report a false missing-image error.
    // Include handlers too, so the real first load is never lost. Updates to
    // media already committed in an earlier batch retain their ordering.
    initial.node.props = merge(initial.node.props, operation.patch.props)
    initial.node.style = merge(initial.node.style, operation.patch.style)
    initial.node.events = merge(initial.node.events, operation.patch.events)
    if (operation.patch.children !== undefined)
      result.push({ ...operation, patch: { children: operation.patch.children } })
  }
  return result
}
