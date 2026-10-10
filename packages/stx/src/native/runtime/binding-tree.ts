import type { BindingManifest, ManifestEntry } from '../../binding-manifest'
import type { STXDocument, STXNode } from '../compiler/ir'
import type { NativeHost, NativeNode } from './native-host'

export interface NativeBindingNode extends NativeNode {
  nodeType: 1
  tagName: string
  attributes: Array<{ name: string, value: string }>
  parentNode: NativeBindingNode | null
  parentElement: NativeBindingNode | null
  childNodes: NativeBindingNode[]
  children: NativeBindingNode[]
  namespaceURI: string
  isConnected: boolean
  hasAttribute: (name: string) => boolean
  getAttribute: (name: string) => string | null
  setAttribute: (name: string, value: unknown) => void
  removeAttribute: (name: string) => void
  contains: (node: NativeBindingNode) => boolean
}

export interface NativeBindingTree {
  root: NativeBindingNode
  nodes: Map<number, NativeBindingNode>
}

function createBindingNode(id: string, type: string, bindings: ManifestEntry['bindings']): NativeBindingNode {
  const attributes = bindings.map(binding => ({ name: binding.name, value: binding.value }))
  const node = {
    __stxId: id,
    nodeType: 1 as const,
    tagName: type.toUpperCase(),
    attributes,
    parentNode: null,
    parentElement: null,
    childNodes: [],
    children: [],
    namespaceURI: '',
    isConnected: true,
    hasAttribute(name: string) {
      return attributes.some(attribute => attribute.name === name)
    },
    getAttribute(name: string) {
      return attributes.find(attribute => attribute.name === name)?.value ?? null
    },
    setAttribute(name: string, value: unknown) {
      const existing = attributes.find(attribute => attribute.name === name)
      if (existing) existing.value = String(value)
      else attributes.push({ name, value: String(value) })
    },
    removeAttribute(name: string) {
      const index = attributes.findIndex(attribute => attribute.name === name)
      if (index !== -1) attributes.splice(index, 1)
    },
    contains(candidate: NativeBindingNode) {
      for (let current: NativeBindingNode | null = candidate; current; current = current.parentNode)
        if (current === node) return true
      return false
    },
  }
  return node
}

/** Build host handles and a manifest-id lookup from already translated IR. */
export function materializeNativeBindingTree(
  document: STXDocument,
  manifest: BindingManifest,
  host: NativeHost,
): NativeBindingTree {
  const entries = new Map(manifest.entries.map(entry => [entry.id, entry]))
  const nodes = new Map<number, NativeBindingNode>()
  let sequence = 0

  function visit(source: STXNode, parent: NativeBindingNode | null): NativeBindingNode {
    const id = `n${sequence++}`
    const entry = source.bindingId === undefined ? undefined : entries.get(source.bindingId)
    const node = createBindingNode(id, source.type, entry?.bindings ?? [])
    source.props.__stxId = id
    node.parentNode = parent
    node.parentElement = parent
    host.adopt(node, source.type, parent)
    if (source.bindingId !== undefined) {
      node.setAttribute('data-stx-b', source.bindingId)
      nodes.set(source.bindingId, node)
    }
    for (const child of source.children) {
      if (typeof child === 'string') continue
      const childNode = visit(child, node)
      node.childNodes.push(childNode)
      node.children.push(childNode)
    }
    return node
  }

  return { root: visit(document.root, null), nodes }
}
