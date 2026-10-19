import type { NativeNode, NativeOperation } from './testing'

export interface TestMutationError { code: string, message: string, operationIndex: number }

/** Preflight topology on a copy: a rejected batch must never partially alter the test phone. */
export function validateTestMutations(source: Map<string, NativeNode>, operations: NativeOperation[]): TestMutationError | null {
  const containers = new Set(['View', 'SafeAreaView', 'ScrollView', 'KeyboardAvoidingView', 'Modal', 'Pressable', 'TouchableOpacity', 'TouchableHighlight', 'ImageBackground', 'FlatList', 'SectionList', 'Fragment', 'Svg', 'G', 'Map'].map(type => type.toLowerCase()))
  const nodes = new Map([...source].map(([id, node]) => [id, {
    type: node.type,
    parent: null as string | null,
    children: node.children.filter((child): child is NativeNode => typeof child !== 'string').map(child => child.id),
  }]))
  for (const [id, node] of nodes)
    for (const child of node.children) {
      const entry = nodes.get(child)
      if (entry) entry.parent = id
    }
  const drop = (id: string): void => {
    const node = nodes.get(id)
    if (!node) return
    node.children.forEach(drop)
    nodes.delete(id)
  }
  for (const [operationIndex, op] of operations.entries()) {
    const fail = (code: string, message: string): TestMutationError => ({ code, message, operationIndex })
    if (op.op === 'createNode') {
      if (nodes.has(op.id)) return fail('DUPLICATE_NODE', `Node ${op.id} already exists`)
      if (!op.node?.type) return fail('INVALID_NODE', 'createNode requires a node type')
      nodes.set(op.id, { type: op.node.type, parent: null, children: [] })
    }
    else if (op.op === 'insertChild' || op.op === 'moveChild') {
      const parent = nodes.get(op.parentId!)
      const child = nodes.get(op.childId!)
      if (!parent) return fail('UNKNOWN_PARENT', `Node ${op.parentId} does not exist`)
      if (!child) return fail('UNKNOWN_NODE', `Node ${op.childId} does not exist`)
      if (!containers.has(parent.type.toLowerCase())) return fail('INVALID_PARENT', `Node ${op.parentId} cannot contain children`)
      if (op.op === 'insertChild' && child.parent !== null) return fail('NODE_ATTACHED', `Node ${op.childId} already has a parent`)
      if (op.op === 'moveChild') {
        if (child.parent !== op.parentId || !parent.children.includes(op.childId!)) return fail('NOT_A_CHILD', `Node ${op.childId} is not a child of ${op.parentId}`)
        parent.children.splice(parent.children.indexOf(op.childId!), 1)
      }
      for (let id: string | null = op.parentId!; id; id = nodes.get(id)?.parent ?? null)
        if (id === op.childId) return fail('CYCLE', 'Placement would create a cycle')
      if (!Number.isInteger(op.index) || op.index! < 0 || op.index! > parent.children.length) return fail('INVALID_INDEX', `Index must be between 0 and ${parent.children.length}`)
      parent.children.splice(op.index!, 0, op.childId!)
      child.parent = op.parentId!
    }
    else if (op.op === 'removeNode' || op.op === 'updateNode') {
      const node = nodes.get(op.id)
      if (!node) return fail('UNKNOWN_NODE', `Node ${op.id} does not exist`)
      if (op.op === 'removeNode') {
        const parent = node.parent ? nodes.get(node.parent) : null
        if (parent) parent.children = parent.children.filter(id => id !== op.id)
        drop(op.id)
      }
    }
    else return fail('INVALID_OPERATION', `Unknown mutation ${op.op}`)
  }
  return null
}
